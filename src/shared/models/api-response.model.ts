export interface ApiResponse {
    message: string;
    status: number;
    data?: unknown;
    hasError?: boolean;
    methodName?: string;
    errorDetails?: unknown;
    errorType?: string;
}