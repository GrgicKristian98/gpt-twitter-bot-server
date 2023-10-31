import "reflect-metadata";

import * as bodyParser from "body-parser";
import {config} from "dotenv";
import {Application} from "express";
import {Server} from "http";
import {APILogger} from "./logger/api.logger";
import {AppDataSource} from "./dataSource";
import {scheduler} from "./utils/scheduler.utils";

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

    constructor() {
        this.express = express();
        this.server = new Server(this.express);
        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(cors({origin: "*"}));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({extended: false}));
    }

    private routes(): void {
        this.express.use(userRoutes);
        this.express.use(tweetRoutes);
        this.express.use(executionRoutes);
    }
}

export default new App().server;