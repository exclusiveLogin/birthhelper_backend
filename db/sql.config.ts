import { PoolConfig } from "mysql";

const host = process.env.HOST || 'localhost';
const user = process.env.USER;
const database = process.env.DB;
const password = process.env.PASSWORD;
const acquireTimeout: number = process.env.QUERY_TIMEOUT ? parseInt(process.env.QUERY_TIMEOUT) : 30000;
const connectionLimit: number = process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10;

export const sqlConfig: PoolConfig = {
    connectionLimit,
    acquireTimeout, //30 secs
    host,
    user,
    password,
    database,
};
