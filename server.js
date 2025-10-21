require('dotenv').config();
const express = require('express');
// const session = require('express-session');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const stringRouter = require('./src/routes/string.routes');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorhandler.middlewares');
const { testConnection, closeConnection } = require('./src/config/db.config');

const app = express();
const PORT = process.env.PORT || 5080;

// ====================
//    Middlewares
// ====================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrce: ["'self'", "https:", "'unsafe-inline'"],
			scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'", "https:"],
			fontSrc: ["'self'", "https:", "data:"],
			objectSrc: ["'none'"],
			upgradeInsecureRequests: [],
		},
	},
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limits: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(session({
//     secret: process.env.SESSION_SECRET || "your_session_secret",
// 	resave: false,
// 	saveUninitialized: false,
// 	cookie: {
// 		secure: process.env.NODE_ENV === "production",
// 		httpOnly: true,
// 		maxAge: 24 * 60 * 60 * 1000, // 24 hours
// 	},
// })); // if making it an available api
app.use(rateLimit({
    windowMs: 15 + 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
}));
// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Temporary debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    next();
});

// ====================
//      Routes
// ====================
app.use('/api', rateLimit);
app.use('/api', stringRouter);

// ====================
//    Error Handler
// ====================
app.use(errorHandler);
app.use(notFoundHandler);

// ====================
//      Server 
// ====================
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Failed to connect to database');
        }

        const server = app.listen(PORT, () => {
            console.log(`...Api URL: http://localhost:${PORT}/api...`);
            console.log(`...Press Ctrl C to exit or stop server...`);
        });

        const shutdown = async (signal) => {
            console.log(`...${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                await closeConnection();
                process.exit(0);
            });

            setTimeout(() => {
                console.error('All process closed');
                process.exit(1);
            }, 10000);
        };

        // Graceful shutdown
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    };
};

startServer();

module.exports = app;