import * as express from "express";
import {NextFunction, Request, Response, Router} from "express";
import {Context} from "../search/config";
import {forkJoin, Observable, of} from "rxjs";
import {Feedback, FeedbackResponse} from "./models";
import {escape} from "mysql";
import {Comment} from "../comment/model";
import {Vote} from "../vote/model";
import {Like} from "../like/model";
import {map} from "rxjs/operators";


export class FeedbackEngine {
    private feedback = express.Router();
    context: Context
    constructor(context: Context) {
        context.feedbackEngine = this;
        this.context = context;
        this.feedback.use(this.userCatcher);
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
        const q = `SELECT * FROM \`feedback\` WHERE id=${escape(id)}`;
        return this.context.dbe.queryList<Feedback>(q).pipe(map(([feedback]) => feedback ?? null));
    }

    getFeedbackListByTarget(targetEntityKey: number, targetId: number): Observable<Feedback[]> {
        const q = `SELECT * FROM \`feedback\` 
                    WHERE target_entity_key = "${escape(targetEntityKey)}" 
                    AND target_entity_id = ${escape(targetId)}`;
        return this.context.dbe.queryList<Feedback>(q);
    }

    getCommentByFeedback(id: number): Observable<Comment> {
        return this.context.commentEngine.getMasterCommentByFeedbackId(id);
    }
    getVotesByFeedback(id: number): Observable<Vote[]> {
        return this.context.voteEngine.getVotesByFeedback(id);
    }
    getStatsByFeedback(id: number): Observable<{ likes: Like[], dislikes: Like[] }> {
        return this.context.likeEngine.getStatsByFeedback(id, 'feedback');
    }

    getFeedbackWithData(id: number): Observable<FeedbackResponse> {
        const feedbackRequest = this.getFeedbackById(id);
        const feedbackVotesRequest = this.getVotesByFeedback(id);
        const feedbackCommentsRequest = this.getCommentByFeedback(id);
        const feedbackLikesRequest = this.getStatsByFeedback(id);
        return forkJoin(
            [feedbackRequest,
                feedbackVotesRequest,
                feedbackCommentsRequest,
                feedbackLikesRequest]).pipe(
                    map((
                        [
                            feedback,
                            votes,
                            comment,
                            {likes, dislikes}
                        ]) => feedback ?
                        ({
                            id: feedback.id,
                            votes,
                            likes,
                            dislikes,
                            action: 'ANSWER',
                            comment,
                            target_entity_id: feedback?.target_entity_id,
                            target_entity_key: feedback?.target_entity_key
                        }) : null)
        );
    }
    getRouter(): Router {
        return this.feedback.get('/:id', async (req, res) => {
            try {
                const feedbackId = Number(req.params.id);
                if (Number.isNaN(feedbackId)) this.sendError(res, 'Передан не валиднй feedback id');
                const feedback = await this.getFeedbackWithData(feedbackId).toPromise();
                if(!feedback) {
                    this.sendError(res, 'Отзыв не найден');
                    return;
                }
                res.send(feedback);
            } catch (e) {
                this.sendError(res, e);
            }
        });
    }
}
