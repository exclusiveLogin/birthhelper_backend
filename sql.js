let mysql = require('mysql');
let host = process.env.HOST || 'localhost';
let pool = mysql.createPool({
    connectionLimit: 100,
    host: host,
    user: 'birthhelper',
    password: 'q1w2e3r4t5y',
    database: 'birthhelper'
})

module.exports = pool;