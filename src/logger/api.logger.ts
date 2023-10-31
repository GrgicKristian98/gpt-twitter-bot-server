import * as winston from 'winston';

const {createLogger, format, transports} = winston;
const {combine, colorize, printf} = format;

export class APILogger {
    private logger: winston.Logger;

    constructor() {
        this.logger = createLogger({
            format: combine(
                colorize({all: true}),  // colorize will add color based on the level
                printf(info => {
                    return `${info.level}: ${info.message}`;
                })
            ),
            transports: [
                new transports.Console(),
                new transports.File({filename: './src/logger/combined.log'}),
            ],
        });
    }

    info(message: any, data = null) {
        const dataText = (data !== null) ? `, data::${JSON.stringify(data)}` : '';
        this.logger.info(`${message}` + dataText);
    }

    warn(message: any, data = null) {
        const dataText = (data !== null) ? `, data::${JSON.stringify(data)}` : '';
        this.logger.warn(`${message}` + dataText);
    }

    error(message: any, data = null) {
        const dataText = (data !== null) ? `, data::${JSON.stringify(data)}` : '';
        this.logger.error(`${message}` + dataText);
    }
}
