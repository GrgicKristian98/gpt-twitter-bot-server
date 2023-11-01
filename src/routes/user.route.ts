import {Router} from "express";
import {UserController} from "../controllers/user.controller";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";
import {HttpError} from "../errors/http.error";
import {verifyToken} from "../middleware/verifyToken.middleware";
import {CustomRequest} from "../interfaces/customRequest.interface";

const router = Router();
const userController = new UserController();

router.post('/api/user/login/url', (req, res) => {
    userController
        .getTwitterLoginUrl()
        .then((url) => {
            res.status(HttpStatusCodes.OK).json({url: url});
        })
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

router.post('/api/user/login/callback', (req, res) => {
    userController
        .executeTwitterLogin(req.body.code, req.body.state)
        .then((token) => {
            res.status(HttpStatusCodes.OK).json({token: token});
        })
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

router.get('/api/user/validate', verifyToken, (req: CustomRequest, res) => {
    const userId = req.userId;
    userController
        .validateUser(userId)
        .then((user) => {
            res.status(HttpStatusCodes.OK).json({userId: user.id});
        })
        .catch((err: HttpError) => {
            res.status(err.getHttpCode()).json({message: err.message});
        });
});

export default router;