import {APILogger} from "../logger/api.logger";
import {TweetService} from "../services/tweet.service";

export class TweetController {
    private log: APILogger;
    private tweetService: TweetService;

    constructor() {
        this.log = new APILogger();
        this.tweetService = new TweetService();
    }

    public async postTweet(userId: number, topic: string): Promise<string[]> {
        this.log.info(`[TweetController] postTweet(userId: ${userId}, topic: ${topic})`);
        return await this.tweetService.postTweet(userId, topic);
    }

    public async getTweetsForUser(userId: number): Promise<string[]> {
        this.log.info(`[TweetController] getTweetsForUser(userId: ${userId})`);
        return await this.tweetService.getTweetsForUser(userId);
    }

    public async getTweets(): Promise<string[]> {
        this.log.info("[TweetController] getTweets");
        return await this.tweetService.getTweets();
    }
}