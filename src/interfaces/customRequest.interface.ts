import {Request} from 'express';
import {Server as IOServer} from "socket.io";

export interface CustomRequest extends Request {
    userId?: number;
    io: IOServer;
}