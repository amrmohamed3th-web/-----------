const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ahwa_db',
  waitForConnections: true,
  connectionLimit: 10
});
