import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from "typeorm";
import {User} from "./user.entity";

@Entity()
export class Execution {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'execution_time', type: 'time'})
    executionTime: string;

    @Column()
    topic: string;

    @Column()
    enabled: boolean;

    @Column({name: 'user_id'})
    userId: number;

    @ManyToOne(() => User, user => user.executions, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;
}