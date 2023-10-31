import server from "./App";
import {config} from "dotenv";
import {APILogger} from "./logger/api.logger";

config();

const port = process.env.PORT || 5001;
server.listen(port);

const log = new APILogger();

server.on('listening', () => {
    const addr = server.address();
    const bind = (typeof addr === "string") ? `pipe ${addr}` : `port ${addr.port}`;
    log.info(`Listening on ${bind}`);
});

module.exports = server;