import "reflect-metadata";

import * as bodyParser from "body-parser";
import {config} from "dotenv";
import {Application} from "express";
import {Server} from "http";
import {APILogger} from "./logger/api.logger";
import {AppDataSource} from "./dataSource";
import {scheduler} from "./utils/scheduler.utils";
import {Server as IOServer} from "socket.io";
import {CustomRequest} from "./interfaces/customRequest.interface";

const cors = require("cors");
const express = require("express");

config();

const log = new APILogger();

AppDataSource.initialize()
    .then(() => {
        log.info("Database initialized");
        scheduler.init();
    }).catch((err: any) => log.error(`Database initialization failed with error: ${err}`));

import userRoutes from "./routes/user.route";
import tweetRoutes from "./routes/tweet.route";
import executionRoutes from "./routes/execution.route";

class App {
    public express: Application;
    public server: Server;
    public io: IOServer;

    constructor() {
        this.express = express();
        this.server = new Server(this.express);

        this.io = new IOServer(this.server, {
            cors: {
                origin: "https://www.creategptbot.com",
                methods: ["GET", "POST"]
            }
        });

        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(cors({origin: "https://www.creategptbot.com"}));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({extended: false}));
    }

    private routes(): void {
        this.express.use((req: CustomRequest, res, next) => {
            req.io = this.io;
            next();
        });

        this.express.use(userRoutes);
        this.express.use(tweetRoutes);
        this.express.use(executionRoutes);
    }
}

export default new App().server;