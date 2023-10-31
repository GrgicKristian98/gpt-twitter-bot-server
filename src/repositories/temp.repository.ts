import {Temp} from "../entities/temp.entity";
import {AppDataSource} from "../dataSource";

export class TempRepository {
    private tempRepository: any;

    constructor() {
        this.tempRepository = AppDataSource.getRepository(Temp);
    }

    public async saveTempVerificationData(temp: Temp): Promise<boolean> {
        const newTemp = await this.tempRepository.save(temp);
        return !!(newTemp && newTemp.id);
    }

    public async getTempVerificationData(state: string): Promise<Temp> {
        return await this.tempRepository.findOne({
            where: {
                state: state
            }
        });
    }

    public async deleteTempVerificationData(state: string): Promise<boolean> {
        const temp = await this.tempRepository.findOne({
            where: {
                state: state
            }
        });

        if (temp && temp.id) {
            await this.tempRepository.remove(temp);
            return true;
        } else {
            return false;
        }
    }
}