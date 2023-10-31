import {APILogger} from "../logger/api.logger";
import {TwitterApi} from "twitter-api-v2";
import {TempRepository} from "../repositories/temp.repository";
import {Temp} from "../entities/temp.entity";
import {HttpStatusCodes} from "../enums/httpStatusCodes.enum";
import {HttpError} from "../errors/http.error";
import {User} from "../entities/user.entity";
import {UserRepository} from "../repositories/user.repository";

const jwt = require('jsonwebtoken');

export class UserService {
    private log: APILogger;
    private twitterClient: TwitterApi;
    private tempRepository: TempRepository;
    private userRepository: UserRepository;

    private readonly callbackUrl: string;

    constructor() {
        this.log = new APILogger();

        this.twitterClient = new TwitterApi({
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
        });

        this.tempRepository = new TempRepository();
        this.userRepository = new UserRepository();

        this.callbackUrl = process.env.OAUTH_CALLBACK_URL;
    }

    public async getTwitterLoginUrl(): Promise<string> {
        this.log.info(`[UserService] Generating Twitter OAuth2 login URL`);

        try {
            const {url, codeVerifier, state} = this.twitterClient.generateOAuth2AuthLink(
                this.callbackUrl,
                {
                    scope: [
                        'tweet.read',
                        'tweet.write',
                        'users.read',
                        'offline.access'
                    ]
                }
            );

            if (!url || !codeVerifier || !state) {
                throw new Error("Data missing from Twitter OAuth2 login URL");
            }

            this.log.info(`[UserService] Saving codeVerifier and state to DB`);
            const tempObj = new Temp();

            tempObj.codeVerifier = codeVerifier;
            tempObj.state = state;

            const saveSuccess = await this.tempRepository.saveTempVerificationData(tempObj);
            if (!saveSuccess) {
                throw new Error("Code verifier and state unsuccessfully saved to DB");
            }

            this.log.info(`[UserService] Twitter OAuth2 login URL generation executed successfully`);
            return url;
        } catch (error) {
            this.log.error(`[UserService] Error generating Twitter OAuth2 login URL: ${error.message}`);
            throw new HttpError(error.message, HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    public async executeTwitterLogin(code: string, state: string): Promise<string> {
        if (!code || !state) {
            throw new HttpError("Code or state not provided", HttpStatusCodes.BAD_REQUEST);
        }

        try {
            // 1. Check if state exists in DB
            this.log.info(`[UserService] Checking if state exists in DB`);

            const temp = await this.tempRepository.getTempVerificationData(state);
            if (!temp || !temp.id) {
                throw new HttpError("State does not exist in DB", HttpStatusCodes.BAD_REQUEST);
            }

            const codeVerifier = temp.codeVerifier;
            this.log.info(`[UserService] Executing Twitter OAuth2 login`);

            // 2. Execute Twitter OAuth2 login
            const {
                client: authedClient,
                accessToken: accessToken,
                refreshToken: refreshToken
            } = await this.twitterClient.loginWithOAuth2({
                code: code,
                codeVerifier: codeVerifier,
                redirectUri: this.callbackUrl,
            });

            if (!accessToken || !refreshToken) {
                throw new HttpError(
                    "Access token or refresh token missing from Twitter OAuth2 login",
                    HttpStatusCodes.INTERNAL_SERVER_ERROR
                );
            }

            this.log.info(`[UserService] Twitter OAuth2 login executed successfully`);

            // 3. Get user accountId from Twitter API
            const userV2Result = await authedClient.v2.me();
            const accountId = userV2Result.data.id;

            let user = new User();
            user.accountId = accountId;
            user.accessToken = accessToken;
            user.refreshToken = refreshToken;

            // 4. Save user to DB
            user = await this.userRepository.saveUserByAccountId(user);
            if (!user && !user.id) {
                    throw new HttpError(
                        "User unsuccessfully saved to DB",
                        HttpStatusCodes.INTERNAL_SERVER_ERROR
                    );
            }

            this.log.info(`User with account id ${accountId} saved to DB successfully`);

            // 5. Delete temp from DB
            const deleteSuccess = await this.tempRepository.deleteTempVerificationData(state);
            if (!deleteSuccess) {
                this.log.warn(`[UserService] Temp with state ${state} unsuccessfully deleted from DB`);
            }

            this.log.info(`Temp with state ${state} deleted from DB successfully`);

            // 6. Return JWT token
            const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
            const payload = {id: user.id};

            return jwt.sign(payload, JWT_SECRET_KEY, {expiresIn: '30d'});
        } catch (error) {
            this.log.error(`[UserService] Error executing Twitter OAuth2 login URL: ${error.message}`);
            const code = (error instanceof HttpError) ? error.getHttpCode()
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
            throw new HttpError(error.message, code);
        }
    }

    public async validateUser(userId: number): Promise<User> {
        this.log.info(`[UserService] Validating and getting user`);

        try {
            const user = await this.userRepository.getUser(userId);

            if (!user) {
                throw new HttpError("User not found", HttpStatusCodes.NOT_FOUND);
            }

            this.log.info(`[UserService] User validated successfully`);

            return user;
        } catch (error) {
            this.log.error(`[UserService] Error validating and getting user: ${error.message}`);
            const code = (error instanceof HttpError) ? error.getHttpCode()
                : HttpStatusCodes.INTERNAL_SERVER_ERROR;
            throw new HttpError(error.message, code);
        }
    }
}