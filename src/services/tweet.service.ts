import {APILogger} from "../logger/api.logger";
import {UserRepository} from "../repositories/user.repository";
import {GPTUtils} from "../utils/gpt.util";
import {UserService} from "./user.service";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";
import {HttpError} from "../errors/http.error";
import {TwitterApi} from "twitter-api-v2";
import {Tweet} from "../entities/tweet.entity";
import {TweetRepository} from "../repositories/tweet.repository";
import {TweetError} from "../errors/tweet.error";

export class TweetService {
    private log: APILogger;
    private gptUtils: GPTUtils;
    private twitterClient: TwitterApi;
    private userRepository: UserRepository;
    private tweetRepository: TweetRepository;
    private userService: UserService;

    constructor() {
        this.log = new APILogger();
        this.gptUtils = new GPTUtils();

        this.twitterClient = new TwitterApi({
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
        });

        this.userRepository = new UserRepository();
        this.tweetRepository = new TweetRepository();
        this.userService = new UserService();
    }

    public async postTweet(userId: number, topic: string): Promise<string[]> {
        if (!topic || topic.length === 0 || topic.length <= 2 || topic.length > 30) {
            throw new HttpError("Topic is missing or in wrong format", HttpStatusCodes.BAD_REQUEST);
        }

        try {
            // 1. Validate and get user
            this.log.info(`[TweetService] Validating user with userId: ${userId}`);
            const user = await this.userService.validateUser(userId);

            // 2. Get Twitter OAuth2 token
            this.log.info(`[TweetService] Getting Twitter OAuth2 token for user: ${user.accountId}`);
            const {
                client: refreshedClient,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            } = await this.twitterClient.refreshOAuth2Token(user.refreshToken);

            if (!newAccessToken || !newRefreshToken) {
                throw new HttpError("Could not refresh OAuth2 token", HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            // 3. Update user with new tokens
            this.log.info(`[TweetService] Updating user with new tokens`);
            const updateSuccess = await this.userRepository.updateUser(userId, newAccessToken, newRefreshToken);
            if (!updateSuccess) {
                throw new HttpError("Could not update user", HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            let data = null;
            let errorThrown = false;
            let numOfErrorsThrown = 0;

            do {
                let tweet = null;

                // 4. Generate tweet with GPT LLM
                this.log.info(`[TweetService] Generating tweet for topic: ${topic}`);
                try {
                    tweet = await this.gptUtils.generateTweet(topic);
                    errorThrown = false;
                } catch (error) {
                    this.log.error(`[TweetService] Error generating tweet: ${error.message}`);
                    errorThrown = true;
                    numOfErrorsThrown++;
                }

                if (tweet) {
                    // 5. Post tweet to Twitter
                    this.log.info(`[TweetService] Posting to Twitter with tweet: ${tweet}`);
                    try {
                        const {data: responseData} = await refreshedClient.v2.tweet(tweet);
                        data = responseData;
                        errorThrown = false;
                    } catch (error) {
                        this.log.error(`[TweetService] Error posting tweet: ${error.message}`);
                        errorThrown = true;
                        numOfErrorsThrown++;
                    }
                }

                if (numOfErrorsThrown > 5 && errorThrown) {
                    break;
                }
            } while (errorThrown);

            if (!data) {
                throw new HttpError("Could not post tweet to Twitter", HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            // 6. Save tweet to DB
            let tweetObj = new Tweet();
            tweetObj.user = user;
            tweetObj.tweetId = data.id;

            this.log.info(`[TweetService] Saving tweet to DB`);
            tweetObj = await this.tweetRepository.saveTweet(tweetObj);
            if (!tweetObj || !tweetObj.id) {
                throw new HttpError("Could not save tweet to DB", HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            // 7. Return tweet embeds
            return this.executeTweetEmbedsRetrieval(tweetObj, userId);
        } catch (error) {
            this.log.error(`[TweetService] Error generating and posting tweet: ${error.message}`);
            const code = (error instanceof HttpError) ? error.getHttpCode()
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
            throw new HttpError(error.message, code);
        }
    }

    public async getTweetsForUser(userId: number): Promise<string[]> {
        try {
            this.log.info(`[TweetService] Validating user with userId: ${userId}`);
            await this.userService.validateUser(userId);

            return this.executeTweetEmbedsRetrieval(null, userId);
        } catch (error) {
            this.log.error(`[TweetService] Error getting all tweets for user: ${error.message}`);
            const code = (error instanceof HttpError) ? error.getHttpCode()
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
            throw new HttpError(error.message, code);
        }
    }

    public async getTweets(): Promise<string[]> {
        try {
            return this.executeTweetEmbedsRetrieval(null, null);
        } catch (error) {
            this.log.error(`[TweetService] Error getting all tweets: ${error.message}`);
            const code = (error instanceof HttpError) ? error.getHttpCode()
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
            throw new HttpError(error.message, code);
        }
    }

    private async executeTweetEmbedsRetrieval(createdTweetObj: Tweet, userId: number = null) {
        let tweetError = false;
        let tweetEmbeds: string[] = [];

        do {
            let tweets = []
            if (userId !== null) {
                this.log.info(`[TweetService] Getting all tweets for user with userId: ${userId}`);
                tweets = await this.tweetRepository.getTweetsForUser(userId);
            } else {
                this.log.info(`[TweetService] Getting all tweets`);
                tweets = await this.tweetRepository.getTweets();
            }

            if (!tweets || tweets.length === 0) {
                if (createdTweetObj !== null) {
                    this.log.warn(`No tweets found for user with userId=${userId} after posting tweet with`
                        + `tweetId=${createdTweetObj.tweetId}`);
                    return [await this.getTweetEmbedHTML(createdTweetObj)];
                }
                return [];
            }

            try {
                tweetEmbeds = await this.getTweetEmbeds(tweets);
                tweetError = false;
            } catch (error) {
                if (error instanceof TweetError) {
                    tweetError = true;

                    this.log.warn(`Tweet with id=${error.getId()} does not exist. Deleting tweet from DB`);
                    const deleteSuccess = await this.tweetRepository.deleteTweet(error.getId());

                    if (!deleteSuccess) {
                        throw new HttpError(
                            "Could not remove deleted tweet from DB",
                            HttpStatusCodes.INTERNAL_SERVER_ERROR
                        );
                    }
                } else {
                    throw error;
                }
            }
        } while (tweetError);

        return tweetEmbeds;
    }

    private async getTweetEmbeds(tweets: Tweet[]) {
        this.log.info(`[TweetService] Returning tweet embeds`);
        const tweetEmbedHTMLPromises = tweets.map(async (tweet) => {
            return await this.getTweetEmbedHTML(tweet);
        });

        return await Promise.all(tweetEmbedHTMLPromises);
    }

    private async getTweetEmbedHTML(tweet: Tweet): Promise<string> {
        const twitterEmbedUrl = process.env.TWITTER_EMBED_API_URL;
        const userId = tweet.user.accountId;
        const tweetId = tweet.tweetId;

        const fetchUrl = `${twitterEmbedUrl}?url=https://twitter.com/${userId}/status/${tweetId}`;
        const response = await fetch(fetchUrl, {method: "GET"});

        let json: any;
        try {
            json = await response.json();
        } catch (error) {
            throw new TweetError(`Tweet with tweetId=${tweet.tweetId} does not exist`, tweet.id);
        }

        if (json && json.html) {
            return json.html;
        } else {
            throw new HttpError("Error getting tweet embed HTML", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}