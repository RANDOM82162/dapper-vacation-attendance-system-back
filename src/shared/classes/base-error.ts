import { HttpStatusCode } from "../models/http.model";

export class BaseError extends Error {
    public readonly log: string;
    public readonly methodName: string;
    public readonly httpCode: number;
    public readonly isOperational: boolean;
    public readonly internalCause?: unknown;

    constructor(
        log: string,
        message: string | unknown = log,
        methodName?: string,
        httpCode = HttpStatusCode.INTERNAL_SERVER,
        isOperational = true
    ) {
        const hasSafeMessage = typeof message === "string";
        super(hasSafeMessage ? message as string : "Ocurrió un error interno.");
        Object.setPrototypeOf(this, new.target.prototype);
        this.log = log;
        if (methodName) this.methodName = methodName;
        this.httpCode = httpCode;
        this.isOperational = isOperational && hasSafeMessage;
        this.internalCause = hasSafeMessage ? undefined : message;
        Error.captureStackTrace(this);
    }

    static buildErrorMessage(error: BaseError | unknown):object{
        if (
            !(error instanceof BaseError) ||
            !error.isOperational ||
            error.internalCause !== undefined ||
            error.httpCode >= 500
        ) {
            return {
                status: 500,
                message: "Ocurrió un error interno."
            };
        }
        return {
            code: error?.httpCode || 500,
            message: error?.message || "Ocurrió un error interno."
        };
    }
}
