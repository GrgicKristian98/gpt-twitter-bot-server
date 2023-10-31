import {Tweet} from "../entities/tweet.entity";
import {AppDataSource} from "../dataSource";

export class TweetRepository {
    private tweetRepository: any;

    constructor() {
        this.tweetRepository = AppDataSource.getRepository(Tweet);
    }

    public async saveTweet(tweet: Tweet): Promise<Tweet> {
        const existingTweet = await this.tweetRepository.findOne({
            where: {
                tweetId: tweet.tweetId
            }
        });

        if (!existingTweet || !existingTweet.id) {
            return await this.tweetRepository.save(tweet);
        } else {
            return existingTweet;
        }
    }

    public async deleteTweet(id: number): Promise<boolean> {
        const existingTweet = await this.tweetRepository.findOne({
            where: {
                id: id
            }
        });

        if (existingTweet && existingTweet.id) {
            await this.tweetRepository.remove(existingTweet);
            return true;
        } else {
            return false;
        }
    }

    public async getTweetsForUser(userId: number): Promise<Tweet[]> {
        return await this.tweetRepository.find({
            where: {
                user: userId
            },
            order: {
                tweetPublished: "DESC"
            },
            take: 2,
            relations: ["user"]
        });
    }

    public async getTweets(): Promise<Tweet[]> {
        return await this.tweetRepository.find({
            order: {
                tweetPublished: "DESC"
            },
            take: 2,
            relations: ["user"]
        });
    }
}