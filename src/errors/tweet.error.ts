export class TweetError extends Error {
    private readonly id: number;

    constructor(message: string, id: number) {
        super(message);
        this.id = id;
    }

    public getId(): number {
        return this.id;
    }
}