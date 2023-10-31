import {ExecutionService} from "../services/execution.service";
import {APILogger} from "../logger/api.logger";
import {Execution} from "../entities/execution.entity";

export class ExecutionController {
    private log: APILogger;
    private executionService: ExecutionService;

    constructor() {
        this.log = new APILogger();
        this.executionService = new ExecutionService();
    }

    public async saveExecution(userId: number, execution: Execution): Promise<Execution> {
        this.log.info(`[ExecutionController] saveExecution(userId: ${userId}, execution: ${JSON.stringify(execution)})`);
        return await this.executionService.saveExecution(userId, execution);
    }

    public async updateExecution(userId: number, execution: Execution): Promise<Execution> {
        this.log.info(`[ExecutionController] updateExecution(userId: ${userId}, execution: ${JSON.stringify(execution)})`);
        return await this.executionService.updateExecution(userId, execution);
    }

    public async deleteExecution(userId: number, executionId: string): Promise<boolean> {
        this.log.info(`[ExecutionController] deleteExecution(userId: ${userId}, executionId: ${executionId})`);
        return await this.executionService.deleteExecution(userId, Number(executionId));
    }

    public async getExecutionsForUser(userId: number): Promise<Execution[]> {
        this.log.info(`[ExecutionController] getExecutionsForUser(userId: ${userId})`);
        return await this.executionService.getExecutionsForUser(userId);
    }
}