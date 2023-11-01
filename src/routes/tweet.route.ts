import {Router} from 'express';
import {TweetController} from "../controllers/tweet.controller";
import {CustomRequest} from "../interfaces/customRequest.interface";
import {verifyToken} from "../middleware/verifyToken.middleware";
import {HttpError} from "../errors/http.error";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";
import {APILogger} from "../logger/api.logger";

const log = new APILogger();

const router = Router();
const tweetController = new TweetController();

router.post('/api/tweet', verifyToken, (req: CustomRequest, res) => {
    const userId = req.userId;
    const topic = req.body.topic;

    res.status(HttpStatusCodes.ACCEPTED).json({message: 'Tweet is being processed'});

    tweetController
        .postTweet(userId, topic)
        .then((embeds) => {
            req.io.emit(`tweet-post-${userId}`, embeds);
            log.info(`Event emitted: tweet-post-${userId}`);
        })
        .catch((err: HttpError) => {
            req.io.emit(`tweet-post-${userId}`, err.getHttpCode());
            log.warn(`Event emitted: tweet-post-${userId}`);
        });
});

router.get('/api/tweet/all/user', verifyToken, (req: CustomRequest, res) => {
    const userId = req.userId;
    tweetController
        .getTweetsForUser(userId)
        .then((embeds) => res.status(HttpStatusCodes.OK).json({embeds: embeds}))
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

router.get('/api/tweet/all', (req, res) => {
    tweetController
        .getTweets()
        .then((embeds) => res.status(HttpStatusCodes.OK).json({embeds: embeds}))
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

export default router;