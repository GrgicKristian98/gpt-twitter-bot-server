import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn} from "typeorm";
import {User} from "./user.entity";

@Entity()
export class Tweet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'tweet_id'})
    tweetId: string;

    @CreateDateColumn({name: 'tweet_published', type: 'timestamp'})
    tweetPublished: Date;

    @ManyToOne(() => User, user => user.tweets, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;
}