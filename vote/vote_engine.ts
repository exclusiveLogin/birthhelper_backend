import {Context} from "../search/config";
import {forkJoin, Observable, of} from "rxjs";
import {Vote} from "./model";
import {escape, OkPacket} from "mysql";
import {Comment} from "../comment/model";
import {FeedbackVoteDTO} from "../feedback/dto";
import {mapTo} from "rxjs/operators";

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

    saveSingleVote(vote: FeedbackVoteDTO, feedbackId: number) {
        const q = `INSERT INTO votes 
                    (
                        feedback_id, 
                        vote_slug,
                        rate
                    )
                    VALUES (
                        ${escape(feedbackId)}, 
                        ${escape(vote.slug)},
                        ${escape(vote.rate)}
                    )`;

        return this.context.dbe.query<OkPacket>(q);
    }

    saveVoteList(votes: FeedbackVoteDTO[], feedbackId: number): Promise<void> {
        return forkJoin([...votes.map(v => this.saveSingleVote(v, feedbackId))]).pipe(mapTo(void 0)).toPromise()
    }
}
