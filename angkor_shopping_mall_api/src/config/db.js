const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';

const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,          // Keep low (max 5) to prevent exhausting Supabase connection quota (limit 15 on free tier)
        min: 0,
        acquire: 45000,
        idle: 5000,      // Release idle connections quickly
        evict: 5000
    },
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        keepAlive: true,
        statement_timeout: 45000
    },
    retry: {
        max: 3,
        match: [
            /out of shared memory/i,
            /ConnectionAcquireTimeoutError/i,
            /SequelizeConnectionError/i,
            /SequelizeConnectionRefusedError/i,
            /SequelizeHostNotFoundError/i,
            /SequelizeHostNotReachableError/i,
            /SequelizeInvalidConnectionError/i,
            /SequelizeConnectionTimedOutError/i,
            /TimeoutError/i,
            /timeout/i,
            /08006/i,
            /{:error, :timeout}/i,
            /Failed to connect to database/i,
            /ECONNRESET/i,
            /ETIMEDOUT/i
        ]
    }
});

// Guard against dirty/aborted transaction connections in the pool
// When any statement errors inside a transaction block, PostgreSQL marks the connection as aborted ('E')
// This hook ensures every acquired connection is cleanly rolled back and ready for queries
sequelize.addHook('afterPoolAcquire', async (connection) => {
    if (connection && (connection._txStatus === 'E' || connection._txStatus === 'T')) {
        try {
            await connection.query('ROLLBACK;');
        } catch (_) {}
    }
});

module.exports = sequelize;
