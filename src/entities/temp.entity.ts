import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Temp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'code_verifier'})
    codeVerifier: string;

    @Column()
    state: string;
}