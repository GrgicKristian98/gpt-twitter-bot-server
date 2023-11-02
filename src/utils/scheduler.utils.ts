import * as schedule from 'node-schedule';
import {TweetService} from "../services/tweet.service";
import {ExecutionRepository} from "../repositories/execution.repository";
import {APILogger} from "../logger/api.logger";

class SchedulerUtils {
    private jobs: { [key: number]: schedule.Job } = {};

    private log: APILogger;
    private tweetService: TweetService;
    private executionRepository: ExecutionRepository;

    constructor() {
        this.log = new APILogger();
        this.tweetService = new TweetService();
        this.executionRepository = new ExecutionRepository();
    }

    public init(): void {
        this.executionRepository.getAllExecutions()
            .then((executions) => {
                executions.forEach((execution) => {
                    if (execution.enabled) {
                        this.scheduleJob(execution.id, execution.executionTime, async () => {
                            try {
                                await this.tweetService.postTweet(execution.userId, execution.topic);
                            } catch (error) {
                                this.log.error(`[SchedulerUtils] Error posting tweet for execution with id=${execution.id}: ${error.message}`);
                            }
                        });
                    }
                });
                const numberOfJobs = Object.keys(this.jobs).length;
                const jobString = numberOfJobs === 1 ? 'job' : 'jobs';
                this.log.info(`[SchedulerUtils] Scheduler initialized with ${numberOfJobs} ${jobString}`);
            })
            .catch((err) => {
                this.log.error(`[SchedulerUtils] Error initializing scheduler: ${err.message}`);
            });
    }

    public scheduleJob(key: number, time: string, action: () => void): void {
        this.cancelJob(key);
        if (!time) {
            return;
        }
        this.jobs[key] = schedule.scheduleJob(this.convertTimeToCron(time), action);
    }

    public cancelJob(key: number): void {
        const job = this.jobs[key];
        if (job) {
            job.cancel();
            delete this.jobs[key];
        }
    }

    private convertTimeToCron(time: string): string {
        const [hour, minute] = time.split(':');
        return `0 ${minute} ${hour} * * *`;
    }
}

export const scheduler = new SchedulerUtils();