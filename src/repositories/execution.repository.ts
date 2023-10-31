import {Execution} from "../entities/execution.entity";
import {AppDataSource} from "../dataSource";

export class ExecutionRepository {
    private executionRepository: any;

    constructor() {
        this.executionRepository = AppDataSource.getRepository(Execution);
    }

    public async saveExecution(execution: Execution): Promise<Execution> {
        return await this.executionRepository.save(execution);
    }

    public async updateExecution(userId: number, execution: Execution): Promise<Execution> {
        const existingExecution = await this.executionRepository.findOne({
            where: {
                id: execution.id,
                user: userId
            }
        });

        if (existingExecution && existingExecution.id) {
            return await this.executionRepository.save(execution);
        } else {
            return null;
        }
    }

    public async deleteExecution(userId: number, executionId: number): Promise<boolean> {
        const existingExecution = await this.executionRepository.findOne({
            where: {
                id: executionId,
                user: userId
            }
        });

        if (existingExecution && existingExecution.id) {
            await this.executionRepository.remove(existingExecution);
            return true;
        } else {
            return false;
        }
    }

    public async getNumberOfExecutionsForUser(userId: number): Promise<number> {
        return await this.executionRepository.count({
            where: {
                user: userId
            }
        });
    }

    public async getExecutionsForUser(userId: number): Promise<Execution[]> {
        return await this.executionRepository.find({
            where: {
                user: userId
            }
        });
    }

    public async getAllExecutions(): Promise<Execution[]> {
        return await this.executionRepository.find();
    }
}