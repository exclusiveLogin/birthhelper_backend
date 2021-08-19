let host = process.env.HOST || 'localhost';

export const sqlConfig = {
    connectionLimit: 10,
    acquireTimeout: 30000, //30 secs
    host: host,
    user: 'birthhelper',
    password: 'q1w2e3r4t5y6',
    database: 'birthhelper'
};
