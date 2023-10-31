import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Execution} from "./execution.entity";
import {Tweet} from "./tweet.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'account_id'})
    accountId: string;

    @Column({name: 'access_token'})
    accessToken: string;

    @Column({name: 'refresh_token'})
    refreshToken: string;

    @OneToMany(() => Execution, execution => execution.user)
    executions: Execution[];

    @OneToMany(() => Tweet, tweet => tweet.user)
    tweets: Tweet[];
}