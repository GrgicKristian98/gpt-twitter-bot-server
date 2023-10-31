import {User} from "../entities/user.entity";
import {AppDataSource} from "../dataSource";

export class UserRepository {
    private userRepository: any;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    public async saveUserByAccountId(user: User): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: {
                accountId: user.accountId
            }
        });

        if (existingUser && existingUser.id) {
            existingUser.accessToken = user.accessToken;
            existingUser.refreshToken = user.refreshToken;
            return await this.userRepository.save(existingUser);
        } else {
            return await this.userRepository.save(user);
        }
    }

    public async updateUser(id: number, newAccessToken: string, newRefreshToken: string): Promise<boolean> {
        const existingUser = await this.userRepository.findOne({
            where: {
                id: id
            }
        });

        if (existingUser && existingUser.id) {
            existingUser.accessToken = newAccessToken;
            existingUser.refreshToken = newRefreshToken;
            return await this.userRepository.save(existingUser);
        } else {
            return false;
        }
    }

    public async getUser(userId: number): Promise<User> {
        return await this.userRepository.findOne({
            where: {
                id: userId
            }
        });
    }
}