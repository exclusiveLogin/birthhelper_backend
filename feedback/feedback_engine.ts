import * as express from "express";
import {NextFunction, Request, Response, Router} from "express";
import {Context, SectionKeys} from "../search/config";
import {forkJoin, from, Observable, of} from "rxjs";
import {
    Feedback,
    FeedbackResponse,
    FeedbackResponseByContragent, FeedbackStatus,
    RateByVote,
    SummaryRateByTargetResponse,
    SummaryVotes
} from "./models";
import {escape, OkPacket} from "mysql";
import {Comment} from "../comment/model";
import {Vote} from "../vote/model";
import {Like} from "../like/model";
import {map, mergeMap, switchMap, tap} from "rxjs/operators";
import bodyparser from "body-parser";
import {User} from "../models/user.interface";
import {FeedbackChangeStatus, FeedbackDTO} from "./dto";

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
        console.log('FEEDBACK error: ', err.message);
        res.status(500);
        res.end(JSON.stringify({error: (err.message ? err.message : err) ?? 'unknown error'}));
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
        return this.context.dbe.queryList<Feedback>(q);
    }

    getFeedbackListByContragent(targetId: number, section?: SectionKeys, status?: FeedbackStatus): Observable<{core: Feedback[], slot: Feedback[]}> {
        return forkJoin([
            this.getCoreFeedbackListByContragent(targetId, section, status),
            this.getSlotsFeedbackListByContragent(targetId, section, status)
        ]).pipe(map(([core, slot]) => ({core, slot})))
    }

    getCoreFeedbackListByContragent(targetId: number, section?: SectionKeys, status?: FeedbackStatus): Observable<Feedback[]> {
        const sectionStr = (section ? ` section = "${section}" AND ` : '');
        const q = `SELECT * FROM \`feedback\`
                    WHERE 1 AND
                    ${sectionStr}
                    ${status ? ` status = ${escape(status)}  AND ` : ''}
                    target_entity_id = ${escape(targetId)}`;
        return this.context.dbe.queryList<Feedback>(q);
    }

    getSlotsFeedbackListByContragent(contragentId: number, section?: SectionKeys, status?: FeedbackStatus): Observable<Feedback[]> {
        const q = `SELECT \`feedback\`.* 
                    FROM \`feedback\`
                    INNER JOIN \`service_slot\` 
                    ON \`feedback\`.\`target_entity_id\` = \`service_slot\`.\`id\`
                    AND \`feedback\`.\`target_entity_key\` = \`service_slot\`.\`entity_key\` 
                    WHERE \`service_slot\`.\`id\` 
                    IN (
                        SELECT \`id\` 
                        FROM \`service_slot\` 
                        WHERE \`contragent_id\` = ${contragentId}
                        ${section === 'clinic' ? 'AND section = "clinic"' : ""}
                        ${section === 'consultation' ? 'AND section = "consultation"' : ""}
                        )
                    ${status ? ` AND status = ${escape(status)}` : ''};`
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
            switchMap(list => forkJoin([...list.map(fb => this.getFeedbackWithData(fb.id))]))
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
                    ...feedback,
                    votes,
                    user,
                    likes,
                    dislikes,
                    action: 'ANSWER',
                    comment,
                }) : null)
        );
    }

    getSummaryRateByTarget(targetKey: string, targetId: number): Observable<SummaryVotes> {
        const q = `SELECT (SELECT COUNT(*) FROM feedback 
                        WHERE target_entity_key = "${targetKey}" 
                        AND target_entity_id = ${targetId} ) as total,  MAX(rate) as max, MIN(rate) as min, AVG(rate) as avr 
                    FROM votes 
                    WHERE feedback_id 
                    IN (SELECT id FROM feedback 
                        WHERE target_entity_key = "${targetKey}" 
                        AND target_entity_id = ${targetId}
                    )`;

        return this.context.dbe.queryList<SummaryVotes>(q).pipe(
            map(_ => _?.[0]),
        );
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

    validateDTO(feedbackDTO: FeedbackDTO): void {
        if(!feedbackDTO.action) {
            throw new Error('Request not valid non action');
        }

        if(feedbackDTO.action === "CREATE" && !feedbackDTO?.votes?.length) {
            throw new Error('Request not valid non votes');
        }

        if (feedbackDTO.action === 'STATUS_CHANGE' && !feedbackDTO.status) {
            throw new Error('Request not valid status data');
        }

        if (feedbackDTO.action === 'STATUS_CHANGE' && !feedbackDTO.id) {
            throw new Error('Request not valid, not id of modified feedback');
        }
    }

    createFeedback(feedback: FeedbackDTO, userId: number): Promise<OkPacket> {
        const q = `INSERT INTO \`feedback\` 
                   (target_entity_key, target_entity_id, user_id) VALUES (
                    ${escape(feedback.target_entity_key)}, 
                    ${escape(feedback.target_entity_id)}, 
                    ${escape(userId)}
                   )`;
        return this.context.dbe.query<OkPacket>(q).toPromise();
    }

    sectionKeyMapper(key: string): SectionKeys | null {
        const SMap: { [key: string]: SectionKeys } = {
            "clinic": "clinic",
            "consultation": "consultation",
        }

        return SMap[key];
    }

    statusKeyMapper(key: string): FeedbackStatus | null {
        const SMap: { [key: string]: FeedbackStatus } = {
            "pending": "pending",
            "approved": "approved",
            "verified": "verified",
            "blocked": "blocked",
            "reject": "reject",
            "official": "official",
        }

        return SMap[key];
    }

    changeStatusByFeedbackID(id: number, status: FeedbackStatus): Observable<FeedbackChangeStatus> {
       const q = `UPDATE feedback SET status = ${escape(status)} WHERE id = ${escape(id)}`;
       return this.context.dbe.query(q).pipe(map( _ => ({status, id, result: 'ok'})));
    }

    async feedbackCreateAction(feedback: FeedbackDTO, userId: number): Promise<number> {
        const createResult = await this.createFeedback(feedback, userId);
        const feedbackId = createResult.insertId;

        if (feedback?.comment) await this.context.commentEngine.addCommentToFeedback(feedbackId, feedback.comment, userId);
        if (feedback?.votes?.length) await this.context.voteEngine.saveVoteList(feedback.votes, feedbackId);

        return feedbackId
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

        // feedback/stats BODY: entities: {key, id}[]
        this.feedback.post('/stats', jsonparser, async (req, res) => {
            try {
                const targets = req.body as Array<{ key: string, id: number }>;
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

        this.feedback.get('/replies/:commentID', async (req, res) => {
            try {
                const commentID = Number(req.params?.['commentID']);

                if (Number.isNaN(commentID) || !commentID) this.sendError(res, 'Передан не валиднй commentID');

                const comments = await this.getCommentsByMasterComment(commentID).toPromise();

                res.send(comments);
            } catch (e) {
                this.sendError(res, e);
            }
        });

        this.feedback.get('/listbycontragent/:contragentID', async (req, res) => {
            try {
                const sectionKey: SectionKeys = this.sectionKeyMapper(req.query?.['section'] as string);
                const statusKey: FeedbackStatus = this.statusKeyMapper(req.query?.['status'] as string);
                const contragentId = Number(req.params?.['contragentID']);

                if (Number.isNaN(contragentId)) this.sendError(res, 'Передан не валиднй contragent');

                const summary: {core: FeedbackResponse[], slot: FeedbackResponse[]} = await this.getFeedbackListByContragent(contragentId, sectionKey, statusKey).pipe(
                    mergeMap(fb => forkJoin([
                            (fb.core?.length ? forkJoin(fb.core?.map(cfb => this.getFeedbackWithData(cfb.id))) : of([])),
                            (fb.slot?.length ? forkJoin(fb.slot?.map(cfb => this.getFeedbackWithData(cfb.id))) : of([])),
                    ]).pipe(map(([core, slot]) => ({core, slot})))
                    )
                ).toPromise();

                const result: FeedbackResponseByContragent = {
                    total: (summary?.core?.length ?? 0) + (summary?.slot?.length ?? 0),
                    byCore: summary?.core ?? [],
                    bySlots: summary?.slot ?? [],
                    contragentId,
                }

                res.send(result);
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

        this.feedback.post('/', jsonparser, async (req, res) => {
            try {
                // get userID
                const userId = res.locals?.userId;
                // get body and typing to DTO
                const feedback: FeedbackDTO = req.body;
                this.validateDTO(feedback);

                let feedbackId: number = null;
                let result = 'nope'
                switch (feedback.action) {
                    case "CREATE":
                        feedbackId = await this.feedbackCreateAction(feedback, userId);
                        result = 'ok';
                        break;
                    case "LIKE":
                        this.context.likeEngine.insertLike('feedback', userId, feedback.id);
                        result = 'ok';
                        break;
                    case "DISLIKE":
                        this.context.likeEngine.insertDislike('feedback', userId, feedback.id);
                        result = 'ok';
                        break;
                }

                res.send({result, feedbackId});
            } catch (e) {
                this.sendError(res, e);
            }
        });

        // change status only
        this.feedback.put('/', jsonparser, this.context.authorizationEngine.checkAccess.bind(this.context.authorizationEngine, 7), async (req, res) => {
            try {
                // get body and typing to DTO
                const feedback: FeedbackDTO = req.body;
                const newStatus: FeedbackStatus = this.statusKeyMapper(feedback.status) ?? 'pending';
                this.validateDTO(feedback);
                const result = await this.changeStatusByFeedbackID(feedback.id, newStatus).toPromise();
                res.send(result);
            } catch (e) {
                this.sendError(res, e);
            }
        });

        return this.feedback;
    }
}
