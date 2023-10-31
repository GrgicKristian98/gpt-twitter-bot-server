import {DataSource} from "typeorm";
import {User} from "./entities/user.entity";
import {Execution} from "./entities/execution.entity";
import {Temp} from "./entities/temp.entity";
import {config} from "dotenv";
import {Tweet} from "./entities/tweet.entity";

config();

export const AppDataSource = new DataSource({
    type: process.env.POSTGRES_TYPE as any,
    host: process.env.POSTGRES_HOST as string,
    port: process.env.POSTGRES_PORT as any,
    username: process.env.POSTGRES_USERNAME as string,
    password: process.env.POSTGRES_PASSWORD as string,
    database: process.env.POSTGRES_DATABASE as string,
    synchronize: true,
    logging: false,
    entities: [User, Execution, Temp, Tweet],
    subscribers: [],
    migrations: [],
});