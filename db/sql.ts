import {sqlConfig} from "./sql.config";
import {Observable} from "rxjs";
import {Context} from "../search/config";
import { createPool } from "mysql";

export class DataBaseService {
    constructor(context: Context) {
        context.dbe = this;
    }

    pool = createPool(sqlConfig);

    queryList<T>(q: string): Observable<T[]> {
        return new Observable<T[]>(observer => {
            this.pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result as T[]);
                observer.complete();
            });
        });
    }

    query<T>(q: string): Observable<T> {
        return new Observable<T>(observer => {
            this.pool.query(q, (err, result) => {
                // console.log('query raw: ', err, result, q);
                if (err) {
                    observer.error(err);
                }
                observer.next(result as T);
                observer.complete();
            });
        });
    }
}
