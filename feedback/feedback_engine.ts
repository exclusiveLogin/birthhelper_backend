import * as express from "express";
import {NextFunction, Request, Response, Router} from "express";
import {Context} from "../search/config";
import {Observable} from "rxjs";
import {Feedback} from "./models";
import {EscapeFunctions} from "mysql";
import {Comment} from "../comment/model";
import {Vote} from "../vote/model";
import {Like} from "../like/model";


export class FeedbackEngine {
    private feedback = express.Router();
    context: Context
    escape: EscapeFunctions['escape'];
    constructor(context: Context) {
        context.feedbackEngine = this;
        this.context = context;
        this.feedback.use(this.userCatcher);
        this.escape = context.dbe.pool.escape;
    }

    sendError = (res: Response, err): void => {
        console.log('FEEDBACK error: ', err);
        res.status(500);
        res.end(JSON.stringify({error: err}));
    }

    userCatcher = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = await this.context.authorizationEngine.getToken(req);
            res.locals.userId = await this.context.authorizationEngine.getUserIdByToken(token);

            next();
        } catch (e) {
            this.sendError(res, e);
        }
    }

    getFeedbackById(id: number): Observable<Feedback> {
        const q = `SELECT * FROM \`feedback\` WHERE id=${this.escape(id)}`;
        return this.context.dbe.queryList<Feedback>(q)?.[0] ?? null;
    }

    getFeedbackListByTarget(targetEntityKey: number, targetId: number): Observable<Feedback[]> {
        const q = `SELECT * FROM \`feedback\` 
                    WHERE target_entity_key = "${this.escape(targetEntityKey)}" 
                    AND target_entity_id = ${this.escape(targetId)}`;
        return this.context.dbe.queryList<Feedback>(q);
    }

    getCommentsByFeedback(id: number): Observable<Comment[]> {
        return this.context.commentEngine.getAllCommentsByFeedback(id);
    }
    getVotesByFeedback(id: number): Observable<Vote[]> {
        return this.context.voteEngine.getVotesByFeedback(id);
    }
    getStatsByFeedback(id: number): Observable<{ likes: Like[], dislikes: Like[] }> {
        return this.context.likeEngine.getStatsByFeedback(id, 'feedback');
    }
    getRouter(): Router {
        return this.feedback.get('/:id', (req, res) => {

            res.send(`<b>everything ok</b><p>UserId: ${res.locals.userId}</p>`);
        });
    }
}
