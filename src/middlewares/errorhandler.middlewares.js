class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    };
};

class ValidationError extends AppError {
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

class ConflictError extends AppError {
    constructor (message) {
        super(message, 409);
        this.name = "ConflictError";
    };
};

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('Error: ', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
	next(new NotFoundError(`Endpoint ${req.method} ${req.originalUrl}`));
};

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError,
    errorHandler,
    asyncHandler,
    notFoundHandler,
};