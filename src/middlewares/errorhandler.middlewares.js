class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    };
};

class ValidatorError extends AppError {
    constructor (message) {
        super(message, 400);
        this.name = 'ValidatorError';
    };
};

class NotFoundError extends AppError {
    constructor (resource) {
        super(`${resource} not found`, 404);
        this.name = "NotFoundError";
    };
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('Error: ', {
        message: err.message,
        stack: err.stack,
        url: err.originalUrl,
        method: err.method,
        ip: err.ip,
        timestamp: new Date().toISOString(),
    });
};

const asyncHandler = (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
	next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl}`));
};

module.exports = {
    AppError,
    ValidatorError,
    NotFoundError,
    errorHandler,
    asyncHandler,
    notFoundHandler,
};