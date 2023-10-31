import {APILogger} from "../logger/api.logger";
import {ExecutionRepository} from "../repositories/execution.repository";
import {Execution} from "../entities/execution.entity";
import {ExecutionUtils} from "../utils/execution.utils";
import {HttpError} from "../errors/http.error";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";
import {UserService} from "./user.service";
import {TweetService} from "./tweet.service";
import {scheduler} from "../utils/scheduler.utils";

export class ExecutionService {
    private log: APILogger;
    private userService: UserService;
    private tweetService: TweetService;
    private executionRepository: ExecutionRepository;

    constructor() {
        this.log = new APILogger();
        this.userService = new UserService();
        this.tweetService = new TweetService();
        this.executionRepository = new ExecutionRepository();
    }

    public async saveExecution(userId: number, execution: Execution): Promise<Execution> {
        if (!ExecutionUtils.isExecutionValid(execution.topic, execution.executionTime)) {
            throw new HttpError("Execution properties not valid", HttpStatusCodes.BAD_REQUEST);
        }

        try {
            this.log.info(`[ExecutionService] Validating user with userId: ${userId}`);
            const user = await this.userService.validateUser(userId);

            this.log.info("[ExecutionService] Checking number of existing executions for user");
            const numberOfExecutions = await this.executionRepository.getNumberOfExecutionsForUser(userId);

            if (numberOfExecutions > 4) {
                throw new HttpError("Maximum number of executions reached", HttpStatusCodes.BAD_REQUEST);
            }

            execution.user = user;
            this.log.info(`[ExecutionService] Saving execution to the database for user with id=: ${user.id}`);
            const newExecution = await this.executionRepository.saveExecution(execution);

            if (!newExecution || !newExecution.id) {
                throw new HttpError("Execution could not be saved to the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            if (execution.enabled) {
                this.log.info(`[ExecutionService] Scheduling execution with id=${execution.id} at `
                    + `${execution.executionTime} for user with id=${user.id}`);
                scheduler.scheduleJob(execution.id, execution.executionTime, async () => {
                    await this.tweetService.postTweet(userId, execution.topic);
                });
            }

            return newExecution;
        } catch (error) {
            this.log.error(`[ExecutionService] Error saving execution to the database: ${error.message}`);
            throw new HttpError("Error saving execution to the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async updateExecution(userId: number, execution: Execution): Promise<Execution> {
        if (!ExecutionUtils.isExecutionValid(execution.topic, execution.executionTime) || !execution.id) {
            throw new HttpError("Execution properties not valid", HttpStatusCodes.BAD_REQUEST);
        }

        try {
            this.log.info(`[ExecutionService] Validating user with userId: ${userId}`);
            await this.userService.validateUser(userId);

            this.log.info(`[ExecutionService] Updating execution with id=${execution.id} in the database`);
            const updatedExecution = await this.executionRepository.updateExecution(userId, execution);

            if (!updatedExecution || !updatedExecution.id) {
                throw new HttpError("Execution not found", HttpStatusCodes.NOT_FOUND);
            }

            if (execution.enabled) {
                this.log.info(`[ExecutionService] Rescheduling execution with id=${execution.id} at `
                    + `${execution.executionTime} for user with id=${userId}`);
                scheduler.scheduleJob(execution.id, execution.executionTime, async () => {
                    await this.tweetService.postTweet(userId, execution.topic);
                });
            } else {
                this.log.info(`[ExecutionService] Cancelling scheduled execution with id=${execution.id}`);
                scheduler.cancelJob(execution.id);
            }

            return updatedExecution;
        } catch (error) {
            this.log.error(`[ExecutionService] Error updating execution in the database: ${error.message}`);
            throw new HttpError("Error updating execution in the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async deleteExecution(userId: number, executionId: number): Promise<boolean> {
        try {
            this.log.info(`[ExecutionService] Validating user with userId: ${userId}`);
            await this.userService.validateUser(userId);

            this.log.info(`[ExecutionService] Deleting execution with id=${executionId} from the database`);
            const result = await this.executionRepository.deleteExecution(userId, executionId);

            if (result) {
                this.log.info(`[ExecutionService] Cancelling scheduled execution with id=${executionId}`);
                scheduler.cancelJob(executionId);
            }

            return result;
        } catch (error) {
            this.log.error(`[ExecutionService] Error deleting execution from the database: ${error.message}`);
            throw new HttpError("Error deleting execution from the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async getExecutionsForUser(userId: number): Promise<Execution[]> {
        try {
            this.log.info(`[ExecutionService] Validating user with userId: ${userId}`);
            await this.userService.validateUser(userId);

            this.log.info(`[ExecutionService] Getting executions for user with id=${userId} from the database`);
            return await this.executionRepository.getExecutionsForUser(userId);
        } catch (error) {
            this.log.error(`[ExecutionService] Error getting executions from the database: ${error.message}`);
            throw new HttpError("Error getting executions from the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async getAllExecutions(): Promise<Execution[]> {
        try {
            return await this.executionRepository.getAllExecutions();
        } catch (error) {
            this.log.error(`[ExecutionService] Error getting executions from the database: ${error.message}`);
            throw new HttpError("Error getting executions from the database", HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}