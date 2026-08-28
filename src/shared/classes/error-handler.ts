import bunyuan from 'bunyan';
import { logger } from './logger';
import { BaseError } from './base-error';
import { ApiResponse } from '../../shared/models/api-response.model';
import { CertificateError, NotFoundError, ParametersError, SwApiError, UnauthorizedError } from './api-errors';

export class ErrorHandler {
    logger: bunyuan;
    constructor(logger: bunyuan) {
        this.logger = logger;
    }

    public async handleError(err: Error): Promise<void> {
        logger.error(err);
    }

    public isTrustedError(error: unknown) {
        return error instanceof BaseError && error.isOperational;
    }
}

export function buildErrorMessage(error: BaseError | unknown): ApiResponse {
    if (error instanceof ParametersError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorDetails: error?.fields?.length > 0 ? { "missingFields": error.fields } : {},
            methodName: error.methodName,
            errorType: "PARAMETERS_ERROR"
        }
    }
    if (error instanceof NotFoundError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            methodName: error.methodName,
            errorType: "NOT_FOUND_ERROR"
        }
    }
    if (error instanceof UnauthorizedError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            methodName: error.methodName,
            errorType: "NOT_AUTHORIZED"
        }
    }
    if (error instanceof SwApiError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorDetails: error.details,
            methodName: error.methodName,
            errorType: "SW_API_ERROR"
        }
    }

    if (error instanceof CertificateError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            methodName: error.methodName,
            errorType: "CERTIFICATE_ERROR"
        }
    }

    if (error instanceof BaseError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorType: "BASE_ERROR",
            methodName: error.methodName,
            errorDetails: error,
        }
    }
    if (error instanceof Error) {
        return {
            hasError: true,
            message: "UNEXPECTED_ERROR",
            errorType: "UNEXPECTED_ERROR",
            status: 500,
            errorDetails: error.message
        };
    }
    return {
        hasError: true,
        message: "UNKNOWN_ERROR",
        errorType: "UNKNOWN_ERROR",
        status: 500,
    };

}