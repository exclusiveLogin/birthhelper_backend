import {Context} from "../search/config";
import {Observable, of} from "rxjs";
import {Vote} from "./model";
import {escape} from "mysql";
import {Comment} from "../comment/model";

export class VoteEngine {
    context: Context
    constructor(context: Context) {
        context.voteEngine = this;
        this.context = context;
    }

    getVotesByContext(section?: string, utility?: string){
        let filters = {};
        if( section ) filters = {...filters, section}
        if( utility ) filters = {...filters, utility}

        return this.context.dictionaryEngine.getDict('dict_votes', filters);
    }

    getVotesByFeedback(id: number): Observable<Vote[]> {
        const q = `SELECT * FROM \`votes\` WHERE feedback_id=${escape(id)}`;
        return this.context.dbe.queryList<Vote>(q);
    }
}
