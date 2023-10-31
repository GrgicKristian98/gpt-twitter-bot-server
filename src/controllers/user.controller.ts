import {APILogger} from "../logger/api.logger";
import {UserService} from "../services/user.service";
import {User} from "../entities/user.entity";

export class UserController {
    private log: APILogger;
    private userService: UserService;

    constructor() {
        this.log = new APILogger();
        this.userService = new UserService();
    }

    public async getTwitterLoginUrl(): Promise<string> {
        this.log.info("[UserController] getTwitterLoginUrl");
        return await this.userService.getTwitterLoginUrl();
    }

    public async executeTwitterLogin(code: string, state: string): Promise<string> {
        this.log.info(`[UserController] executeTwitterLogin(code: ${code}, state: ${state}))`);
        return await this.userService.executeTwitterLogin(code, state);
    }

    public async validateUser(userId: number): Promise<User> {
        this.log.info(`[UserController] getUser(userId: ${userId})`);
        return await this.userService.validateUser(userId);
    }
}