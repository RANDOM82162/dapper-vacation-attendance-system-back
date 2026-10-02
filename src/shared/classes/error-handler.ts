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
    if (
        !(error instanceof BaseError) ||
        !error.isOperational ||
        error.internalCause !== undefined ||
        error.httpCode >= 500
    ) {
        return {
            hasError: true,
            status: 500,
            message: "Ocurrió un error interno.",
            errorType: "INTERNAL_ERROR"
        };
    }

    if (error instanceof ParametersError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorType: "PARAMETERS_ERROR"
        }
    }
    if (error instanceof NotFoundError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorType: "NOT_FOUND_ERROR"
        }
    }
    if (error instanceof UnauthorizedError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorType: "NOT_AUTHORIZED"
        }
    }
    if (error instanceof SwApiError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: "No se pudo completar la solicitud al servicio externo.",
            errorType: "SW_API_ERROR"
        }
    }

    if (error instanceof CertificateError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: "No se pudo validar el certificado.",
            errorType: "CERTIFICATE_ERROR"
        }
    }

    if (error instanceof BaseError) {
        return {
            hasError: true,
            status: error.httpCode,
            message: error.message,
            errorType: "BASE_ERROR",
        }
    }
    return {
        hasError: true,
        message: "Ocurrió un error interno.",
        errorType: "INTERNAL_ERROR",
        status: 500
    };

}
