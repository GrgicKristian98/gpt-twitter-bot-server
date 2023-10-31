export class HttpError extends Error {
    private readonly httpCode: number;

    constructor(message: string, httpCode: number) {
        super(message);
        this.httpCode = httpCode;
    }

    public getHttpCode(): number {
        return this.httpCode;
    }
}