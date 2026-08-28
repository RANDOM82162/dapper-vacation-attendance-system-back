import { BaseError } from './base-error';
import { HttpStatusCode } from '../models/http.model';

export class ParametersError extends BaseError {
    fields: string[];
    constructor(message: string, methodName = '', httpCode = HttpStatusCode.INTERNAL_SERVER, isOperational = true, fields?: string[]) {
        super('', message, methodName, httpCode, isOperational);
        this.fields = fields;
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message: string, methodName = '', httpCode = HttpStatusCode.NOT_AUTHORIZED, isOperational = true) {
        super('', message, methodName, httpCode, isOperational);
    }
}

export class CertificateError extends BaseError {
    constructor(message: string, methodName = '', httpCode = HttpStatusCode.NOT_AUTHORIZED, isOperational = true) {
        super('', message, methodName, httpCode, isOperational);
    }
}

export class TimbreError extends BaseError {
    constructor(message: string, methodName = '', httpCode = HttpStatusCode.NOT_AUTHORIZED, isOperational = true) {
        super('', message, methodName, httpCode, isOperational);
    }
}


export class NotFoundError extends BaseError {
    constructor(message: string, methodName = '', httpCode = HttpStatusCode.BAD_REQUEST, isOperational = true) {
        super('', message, methodName, httpCode, isOperational);
    }
}

export class SwApiError extends BaseError {
    details: any;
    constructor(message:string, methodName = '', details?: object , httpCode = HttpStatusCode.BAD_REQUEST, isOperational = true) {
        super('', message, methodName, httpCode, isOperational);
        this.details = details;
    }
}
