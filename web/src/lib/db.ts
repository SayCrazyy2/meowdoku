import mysql from 'mysql2/promise';

// Create a singleton connection pool for Next.js API routes
const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

export const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST || '163.245.208.27',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'meowdoku',
    password: process.env.DB_PASS || 'H82ejWWrxGbWmFyy',
    database: process.env.DB_NAME || 'meowdoku',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.mysqlPool = pool;
}
