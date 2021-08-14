import {sqlConfig} from "./sql.config";
import {Observable} from "rxjs";
import {Context} from "../search.engine/config";

let mysql = require('mysql');


export class DataBaseService {
    constructor(context: Context) {
        context.dbe = this;
    }

    pool = mysql.createPool(sqlConfig);

    query<T>(q: string): Observable<T[]> {
        return new Observable<T[]>(observer => {
            this.pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result);
                observer.complete();
            });
        });
    }
}
