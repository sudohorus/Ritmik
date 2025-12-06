import { NextApiResponse } from 'next';

export interface ApiError {
    message: string;
    statusCode: number;
    code?: string;
}

export function handleApiError(
    error: unknown,
    res: NextApiResponse,
    customMessage?: string
): void {
    console.error('[API Error]', error);

    let statusCode = 500;
    let message = customMessage || 'An unexpected error occurred';
    let code = 'INTERNAL_ERROR';

    if (error instanceof Error) {
        if (error.message.includes('not found')) {
            statusCode = 404;
            message = 'Resource not found';
            code = 'NOT_FOUND';
        } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
            statusCode = 401;
            message = 'Unauthorized';
            code = 'UNAUTHORIZED';
        } else if (error.message.includes('forbidden')) {
            statusCode = 403;
            message = 'Forbidden';
            code = 'FORBIDDEN';
        } else if (error.message.includes('validation')) {
            statusCode = 400;
            message = 'Invalid input';
            code = 'VALIDATION_ERROR';
        }
    }

    const response: any = {
        error: message,
        code,
    };

    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        response.details = error.message;
    }

    res.status(statusCode).json(response);
}

export class CustomApiError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'API_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'CustomApiError';
    }
}

export class ValidationError extends CustomApiError {
    constructor(message: string = 'Invalid input') {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends CustomApiError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}

export class NotFoundError extends CustomApiError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
