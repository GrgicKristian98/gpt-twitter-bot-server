import {Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {CustomRequest} from "../interfaces/customRequest.interface";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(HttpStatusCodes.FORBIDDEN).send({message: 'No token provided.'});
    }

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

    jwt.verify(token, JWT_SECRET_KEY, (err: any, decoded: any) => {
        if (err) {
            return res.status(HttpStatusCodes.UNAUTHORIZED).send({message: 'Unauthorized access.'});
        }

        if (decoded && decoded.hasOwnProperty('id')) {
            req.userId = Number(decoded.id);
            next();
        } else {
            return res.status(HttpStatusCodes.BAD_REQUEST).send({message: 'Invalid token.'});
        }
    });
}