require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "string_analyzer_db",
	port: process.env.DB_PORT || 3306,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	charset: "utf8mb4",
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('   ...Database connected successfully...   ');

        const [rows] = await connection.execute("SELECT 1 as test");
		console.log(`   ...Database query test successful: ${rows[0].test}...    `);

        connection.release();
        return true;
        
    } catch (error) {
       console.error(`  ...Database connection failed: ${error.message}...  `);
       return false; 
    };
};

const closeConnection = async () => {
    try {
        await pool.end();
        console.log('   ...Database connections closed successfully...  ');
        
    } catch (error) {
        console.error(` ...Error closing database connections: ${error.message}...   `);
    };
};

module.exports = {
    pool,
    testConnection,
    closeConnection,
};