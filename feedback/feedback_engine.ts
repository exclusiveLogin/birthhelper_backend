import * as express from "express";
import {NextFunction, Request, Response, Router} from "express";
import {Context} from "../search/config";
import {forkJoin, from, Observable, of} from "rxjs";
import {Feedback, FeedbackResponse, RateByVote, SummaryRateByTargetResponse, SummaryVotes} from "./models";
import {escape} from "mysql";
import {Comment} from "../comment/model";
import {Vote} from "../vote/model";
import {Like} from "../like/model";
import {map, switchMap, tap} from "rxjs/operators";
import bodyparser from "body-parser";
import {User} from "../models/user.interface";

const jsonparser = bodyparser.json();


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
    getUserById(id: number): Observable<User> {
        return  from(this.context.authorizationEngine.getUserById(id));
    }
    getFeedbackListByTarget(targetEntityKey: string, targetId: number): Observable<Feedback[]> {
        const q = `SELECT * FROM \`feedback\`
                    WHERE target_entity_key = ${escape(targetEntityKey)} 
                    AND target_entity_id = ${escape(targetId)}`;
        console.log('q:', q);
        return this.context.dbe.queryList<Feedback>(q);
    }

    getCommentByFeedback(id: number): Observable<Comment> {
        return this.context.commentEngine.getMasterCommentByFeedbackId(id);
    }
    getCommentsByMasterComment(commentId: number): Observable<Comment[]> {
        return this.context.commentEngine.getCommentsByParentId(commentId);
    }
    getVotesByFeedback(id: number): Observable<Vote[]> {
        return this.context.voteEngine.getVotesByFeedback(id);
    }
    getStatsByFeedback(id: number): Observable<{ likes: Like[], dislikes: Like[] }> {
        return this.context.likeEngine.getStatsByFeedback(id, 'feedback');
    }
    getFeedbackListWithData(targetKey: string, targetId: number): Observable<FeedbackResponse[]> {
        return this.getFeedbackListByTarget(targetKey, targetId).pipe(
            tap(list => console.log('List:', list)),
            switchMap(list => forkJoin(list.map(fb => this.getFeedbackWithData(fb.id))))
        )
    }
    getFeedbackWithData(id: number): Observable<FeedbackResponse> {
        const feedbackRequest = this.getFeedbackById(id);
        const feedbackVotesRequest = this.getVotesByFeedback(id);
        const feedbackCommentsRequest = this.getCommentByFeedback(id);
        const feedbackLikesRequest = this.getStatsByFeedback(id);

        return feedbackRequest.pipe(
            switchMap(feedback =>
                forkJoin([
                    of(feedback),
                    feedbackVotesRequest,
                    feedbackCommentsRequest,
                    feedbackLikesRequest,
                    this.getUserById(feedback.user_id)
                ])
            ),
            map((
                [
                    feedback, votes, comment, {likes, dislikes}, user
                ]) => feedback ? ({
                    id: feedback.id,
                    votes,
                    user,
                    likes,
                    dislikes,
                    action: 'ANSWER',
                    comment,
                    target_entity_id: feedback?.target_entity_id,
                    target_entity_key: feedback?.target_entity_key
                }) : null)
        );
    }

    getSummaryRateByTarget(targetKey: string, targetId: number): Observable<SummaryVotes> {
        const q = `SELECT COUNT(*) as total,  MAX(rate) as max, MIN(rate) as min, AVG(rate) as avr 
                    FROM votes 
                    WHERE feedback_id 
                    IN (SELECT id FROM feedback 
                        WHERE target_entity_key = "${targetKey}" 
                        AND target_entity_id = ${targetId}
                    )`;

        return this.context.dbe.query<SummaryVotes>(q);
    }

    getSummaryRateByTargetGrouped(targetKey: string, targetId: number): Observable<RateByVote[]> {
        const q = `SELECT COUNT(*) as total,  vote_slug as slug, MAX(rate) as max, MIN(rate) as min, AVG(rate) as avr 
                    FROM votes 
                    WHERE feedback_id 
                    IN (
                        SELECT id FROM feedback 
                        WHERE target_entity_key = "${targetKey}" 
                        AND target_entity_id = ${targetId}
                    ) GROUP BY vote_slug;`;

        return this.context.dbe.queryList<RateByVote>(q);
    }

    getAllStatsByTarget(targetKey: string, targetId: number): Observable<SummaryRateByTargetResponse> {
        return forkJoin([
            this.getSummaryRateByTarget(targetKey, targetId),
            this.getSummaryRateByTargetGrouped(targetKey, targetId)]
        ).pipe(
            map(([summary, summary_by_votes]) => ({summary, summary_by_votes}))
        );
    }

    getRouter(): Router {
        // feedback/stats?key=consultation&id=1
        this.feedback.get('/stats', async (req, res) => {
            try {
                const targetKey: string = req.query?.['key'] as string;
                const targetId = Number(req.query?.['id']);

                if (Number.isNaN(targetId) || !targetKey) this.sendError(res, 'Передан не валиднй target');

                const summary = await this.getAllStatsByTarget(targetKey, targetId).toPromise();

                res.send(summary);
            } catch (e) {
                this.sendError(res, e);
            }
        });

        this.feedback.get('/list', async (req, res) => {
            try {
                const targetKey: string = req.query?.['key'] as string;
                const targetId = Number(req.query?.['id']);

                if (Number.isNaN(targetId) || !targetKey) this.sendError(res, 'Передан не валиднй target');

                const summary = await this.getFeedbackListWithData(targetKey, targetId).toPromise();

                res.send(summary);
            } catch (e) {
                this.sendError(res, e);
            }
        });

        this.feedback.get('/:id', async (req, res) => {
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



        // feedback/stats BODY: entities: {key, id}[]
        this.feedback.post('/stats', jsonparser, async (req, res) => {
            try {
                const targets = req.body?.['targets'] as Array<{ key: string, id: number }>;
                if (!targets?.length) this.sendError(res, 'Передан не валиднй targets');

                const summary = await Promise.all(targets.map(({key, id}) =>
                    this.getAllStatsByTarget(key, id)
                        .pipe(map(r => ({...r, target_entity_key: key, target_entity_id: id})))
                        .toPromise()));

                res.send(summary);
            } catch (e) {
                this.sendError(res, e);
            }
        });

        return this.feedback;
    }
}
