require('dotenv').config();
const express = require('express');
// const session = require('express-session'); finish task then comeback to this 
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
const limit = rateLimit({
    windowMs: 15 + 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({
			status: "fail",
			message: "Invalid JSON format",
		});
	}
	next(err);
});

// app.use(session({
//     secret: process.env.SESSION_SECRET || "your_session_secret",
// 	resave: false,
// 	saveUninitialized: false,
// 	cookie: {
// 		secure: process.env.NODE_ENV === "production",
// 		httpOnly: true,
// 		maxAge: 24 * 60 * 60 * 1000, // 24 hours
// 	},
// })); // if making it an available api for people to use or when making it a website or whatever
// app.use();

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
app.use('/api', limit);
app.use('/api', stringRouter);

// ====================
//    Error Handler
// ====================
app.use(notFoundHandler);
app.use(errorHandler);

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
            console.log(`   ...Api URL: http://localhost:${PORT}/api... `);
            console.log(`   ...Press Ctrl C to exit or stop server...   `);
        });

        const shutdown = async (signal) => {
            console.log(`   ...${signal} received. Shutting down gracefully...  `);

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
        console.error('Failed to start server:', error);
        process.exit(1);
    };
};

startServer();

module.exports = app;