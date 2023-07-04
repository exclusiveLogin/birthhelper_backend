import * as express from "express";
import { NextFunction, Request, Response, Router } from "express";
import { Context, SectionKeys } from "../search/config";
import { forkJoin, from, Observable, of } from "rxjs";
import {
  Feedback,
  FeedbackResponse,
  FeedbackResponseByContragent,
  FeedbackStatus,
  RateByVote,
  SummaryRateByTargetResponse,
  SummaryVotes,
} from "./models";
import { escape, OkPacket } from "mysql";
import { Comment } from "../comment/model";
import { Vote } from "../vote/model";
import { Like } from "../like/model";
import { map, switchMap, tap } from "rxjs/operators";
import bodyparser from "body-parser";
import { User } from "../models/user.interface";
import { FeedbackChangeStatus, FeedbackDTO } from "./dto";
import { FilterParams } from "entity/entity_engine";
import { getFiltersByRequest } from "../db/sql.helper";
import { EntityKeys } from "entity/entity_repo.model";
import { LKPermission, LKPermissionType } from "auth/lk.permissions.model";

const jsonparser = bodyparser.json();

export class FeedbackEngine {
  private feedback = express.Router();
  context: Context;
  constructor(context: Context) {
    context.feedbackEngine = this;
    this.context = context;
    this.feedback.use(this.userCatcher);
  }

  sendError = (res: Response, err): void => {
    console.log("FEEDBACK error: ", (err.message ? err.message : err) ?? "unknown error");
    res.status(500);
    res.end(
      JSON.stringify({
        error: (err.message ? err.message : err) ?? "unknown error",
      })
    );
  };

  userCatcher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await this.context.authorizationEngine.getToken(req);
      res.locals.userId =
        await this.context.authorizationEngine.getUserIdByToken(token);
      next();
    } catch (e) {
      this.sendError(res, e);
    }
  };

  feedbackRemoveGrantsCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.userId;
      if(!user) throw new Error('user not found');
      const feedbackID = Number(req?.params?.id);
      const existFeedback = await this.getFeedbackById(feedbackID).toPromise();
      if(!existFeedback) throw new Error('feedback not found');
      const isGranted = await this.context.authorizationEngine.hasPermissionByUser(user, 5)
      if(isGranted || existFeedback?.user_id === user) { 
        next();
      } else {
        throw new Error('Remove this Feedback not permited for you');
      }
    } catch (e) {
      this.sendError(res, e);
    }
  };

  feedbackEditGrantsCheck = async (userId: number, feedbackId: number) => {
    const user = await this.context.authorizationEngine.getUserById(userId);
    if(!user) throw new Error('user not found');
    const existFeedback = await this.getFeedbackById(feedbackId).toPromise();
    if(!existFeedback) throw new Error('feedback not found');
    if(existFeedback?.user_id !== user.id) throw new Error('Edit this Feedback not permited for you');
  };

  getFeedbackById(id: number): Observable<Feedback> {
    const q = `SELECT * FROM \`feedback\` WHERE id=${escape(id)}`;
    return this.context.dbe
      .queryList<Feedback>(q)
      .pipe(map(([feedback]) => feedback ?? null));
  }
  getUserById(id: number): Observable<User> {
    return from(this.context.authorizationEngine.getUserByIdSafetly(id));
  }

  getByUserId(userId: number,section?: SectionKeys, status?: FeedbackStatus, skip = 0, limit = 20): Observable<Feedback[]>{
    const sectionStr = `${section === "clinic" ? 'AND section = "clinic"' : ""}${section === "consultation" ? 'AND section = "consultation"': ""}`
    const statusStr = status ? ` AND status = ${escape(status)}` : "";
                        
    const limStr = `${
      skip ? " LIMIT " + limit + " OFFSET " + skip : " LIMIT " + limit
    }`;

    const q = `SELECT * FROM \`feedback\` 
                WHERE user_id=${escape(userId)}
                AND status NOT IN ("pending", "deleted")
                ${sectionStr}${statusStr}
                ${limStr}`;

    return this.context.dbe
      .queryList<Feedback>(q).pipe(
        switchMap((list) => list.length ? forkJoin([...list.map((fb) => this.getFeedbackWithData(fb.id))]) : of(list))
      );
  }
  getFeedbackListByTarget(
    targetEntityKey: string,
    targetId: number
  ): Observable<Feedback[]> {
    const q = `SELECT * FROM \`feedback\`
                    WHERE target_entity_key = ${escape(targetEntityKey)} 
                    AND target_entity_id = ${escape(targetId)}
                    AND status NOT IN ("pending", "deleted")`;
    return this.context.dbe.queryList<Feedback>(q);
  }

  async getFeedbackListByContragent(
    targetId: number,
    targetKey?: EntityKeys,
    section?: SectionKeys,
    status?: FeedbackStatus
  ): Promise<{ core: Feedback[]; slot: Feedback[] }> {

    if(targetKey = 'ent_contragents') {
      targetId = section ? (await this.context.entityEngine.getNestesContragent(targetId, section))?.id : targetId;
      if(section === 'clinic'){
        targetKey = 'ent_clinic_contragents';
        if(!targetId) throw new Error("У данного контрагента нет дочерней сущности в секции " + section);

      } 
      if(section === 'consultation') {
        targetKey = 'ent_consultation_contragents';
        if(!targetId) throw new Error("У данного контрагента нет дочерней сущности в секции " + section);
      } 
    }

    return forkJoin([
      this.getCoreFeedbackListByContragent(targetId, targetKey, status),
      this.getSlotsFeedbackListByContragent(targetId, section, status),
    ]).pipe(map(([core, slot]) => ({ core, slot }))).toPromise();
    
  }

  async getCoreFeedbackListByContragent(
    targetId: number,
    targetKey: EntityKeys,
    status?: FeedbackStatus
  ): Promise<Feedback[]> {
    const statusStr = status ? ` AND status = ${escape(status)}` : "";
    const contragentStr = ` AND target_entity_key = ${escape(targetKey)} `;
                                
    const q = `SELECT * FROM \`feedback\`
                    WHERE 1
                    ${statusStr}
                    ${contragentStr}
                    AND target_entity_id = ${escape(targetId)}`;

    return this.context.dbe.queryList<Feedback>(q).toPromise();
  }

  async getSlotsFeedbackListByContragent(
    contragentId: number,
    section?: SectionKeys,
    status?: FeedbackStatus
  ): Promise<Feedback[]> {
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
                        ${section === "clinic" ? 'AND section = "clinic"' : ""}
                        ${
                          section === "consultation"
                            ? 'AND section = "consultation"'
                            : ""
                        }
                        )
                    ${status ? ` AND status = ${escape(status)}` : ""};`;
    return this.context.dbe.queryList<Feedback>(q).toPromise();
  }

  getCommentByFeedback(id: number): Observable<Comment> {
    return this.context.commentEngine.getMasterCommentByFeedbackId(id);
  }
  getCommentsByMasterComment(
    commentId: number,
    filters?: FilterParams
  ): Observable<Comment[]> {
    return this.context.commentEngine.getCommentsByParentId(commentId, filters);
  }
  getVotesByFeedback(id: number): Observable<Vote[]> {
    return this.context.voteEngine.getVotesByFeedback(id);
  }
  getStatsByFeedback(
    id: number
  ): Observable<{ likes: Like[]; dislikes: Like[] }> {
    return this.context.likeEngine.getStatsByFeedback(id, "feedback");
  }

  getFeedbackListWithData(
    targetKey: string,
    targetId: number
  ): Observable<FeedbackResponse[]> {
    return this.getFeedbackListByTarget(targetKey, targetId).pipe(
      switchMap((list) => list.length ? 
        forkJoin([...list.map((fb) => this.getFeedbackWithData(fb.id))]) : of([])
      )
    );
  }

  getFeedbackWithData(id: number): Observable<FeedbackResponse> {
    const feedbackRequest = this.getFeedbackById(id);
    const feedbackVotesRequest = this.getVotesByFeedback(id);
    const feedbackCommentsRequest = this.getCommentByFeedback(id);
    const feedbackLikesRequest = this.getStatsByFeedback(id);

    return feedbackRequest.pipe(
      switchMap((feedback) =>
        forkJoin([
          of(feedback),
          feedbackVotesRequest,
          feedbackCommentsRequest,
          feedbackLikesRequest,
          this.getUserById(feedback.user_id),
        ])
      ),
      map(([feedback, votes, comment, { likes, dislikes }, user]) =>
        feedback
          ? {
              ...feedback,
              votes,
              user,
              likes,
              dislikes,
              action: "ANSWER",
              comment,
            }
          : null
      )
    );
  }

  getSummaryRateByTarget(
    targetKey: string,
    targetId: number
  ): Observable<SummaryVotes> {
    const q = `SELECT COUNT(DISTINCT feedback_id) as total,  
                        MAX(rate) as max, 
                        MIN(rate) as min, 
                        AVG(rate) as avr 
                    FROM votes 
                    WHERE feedback_id 
                    IN (SELECT id FROM feedback 
                        WHERE target_entity_key = "${targetKey}" 
                        AND target_entity_id = ${targetId}
                        AND status NOT IN ("pending", "deleted")
                    )`;

    return this.context.dbe.queryList<SummaryVotes>(q).pipe(map((_) => _?.[0]));
  }

  getSummaryRateByTargetGrouped(
    targetKey: string,
    targetId: number
  ): Observable<RateByVote[]> {
    const q = `SELECT 
                COUNT(DISTINCT feedback_id) as total,  
                vote_slug as slug, 
                vote_type.title, 
                MAX(rate) as max, 
                MIN(rate) as min, 
                AVG(rate) as avr 
                FROM votes
                JOIN vote_type ON vote_type.slug = votes.vote_slug
                WHERE feedback_id 
                IN (
                    SELECT id FROM feedback 
                    WHERE target_entity_key = ${escape(targetKey)} 
                    AND target_entity_id = ${escape(targetId)} 
                    AND status NOT IN ("pending", "deleted")
                ) GROUP BY vote_slug, title;`;

    return this.context.dbe.queryList<RateByVote>(q);
  }

  getAllStatsByTarget(
    targetKey: string,
    targetId: number
  ): Observable<SummaryRateByTargetResponse> {
    return forkJoin([
      this.getSummaryRateByTarget(targetKey, targetId),
      this.getSummaryRateByTargetGrouped(targetKey, targetId),
    ]).pipe(
      map(([summary, summary_by_votes]) => ({ summary, summary_by_votes }))
    );
  }

  validateDTO(feedbackDTO: FeedbackDTO): void {
    if (!feedbackDTO.action) {
      throw new Error("Request not valid non action");
    }

    // todo: validate target
    if (feedbackDTO.action === "CREATE" && !feedbackDTO?.votes?.length) {
      throw new Error("Request not valid non votes");
    }

    if (feedbackDTO.action === "STATUS_CHANGE" && !feedbackDTO.status) {
      throw new Error("Request not valid status data");
    }

    if (feedbackDTO.action === "STATUS_CHANGE" && !feedbackDTO.id) {
      throw new Error("Request not valid, not id of modified feedback");
    }

    if (feedbackDTO.action === "EDIT" && !feedbackDTO.id) {
      throw new Error("Request not valid, not id of modified feedback");
    }
  }

  createFeedback(feedback: FeedbackDTO, userId: number): Promise<OkPacket> {

    // const config = this.context.entityEngine.getEntitiesConfig();
    // let contragentId: number;

    // if(feedback.target_entity_key === "ent_contragents") {

    //   // core contragent entity
    //   contragentId = feedback.target_entity_id;
    // } else if (config?.[feedback.target_entity_key].isContragent)  {

    //   // section contragent entity
    //   contragentId = await this.context.entityEngine.getCoreContragent(target_entity_id, target_entity_key as EntityKeys).then(contragent => contragent.contragent);
    // } else {

    //   // slot entity
    //   contragentId = await this.context.slotEngine.getContragentIdBySlot(target_entity_id, target_entity_key as EntityKeys);
    // }

    const q = `INSERT INTO \`feedback\` 
                   (section, target_entity_key, target_entity_id, user_id) VALUES (
                    ${escape(feedback.section)}, 
                    ${escape(feedback.target_entity_key)}, 
                    ${escape(feedback.target_entity_id)}, 
                    ${escape(userId)}
                   )`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  updateFeedback(feedbackId: number): Promise<OkPacket> {
    const q = `UPDATE \`feedback\` SET \`datetime_update\` = NOW() WHERE \`feedback\`.\`id\` = ${escape(feedbackId)};`
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  removeFeedback(feedbackId: number): Promise<OkPacket> {
    const q = `UPDATE \`feedback\` SET \`status\` = "deleted" WHERE \`feedback\`.\`id\` = ${escape(feedbackId)};`
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  sectionKeyMapper(key: string): SectionKeys | null {
    const SMap: { [key: string]: SectionKeys } = {
      clinic: "clinic",
      consultation: "consultation",
    };

    return SMap[key];
  }

  targetKeyMapper(key: string): EntityKeys | null {
    const SMap: { [key: string]: EntityKeys } = {
      clinic: "ent_clinic_contragents",
      consultation: "ent_consultation_contragents",
    };

    return SMap[key] ?? 'ent_contragents';
  }

  statusKeyMapper(key: string): FeedbackStatus | null {
    const SMap: { [key: string]: FeedbackStatus } = {
      pending: "pending",
      approved: "approved",
      verified: "verified",
      blocked: "blocked",
      reject: "reject",
      official: "official",
    };

    return SMap[key];
  }

  changeStatusByFeedbackID(
    id: number,
    status: FeedbackStatus
  ): Observable<FeedbackChangeStatus> {
    const q = `UPDATE feedback SET status = ${escape(
      status
    )} WHERE id = ${escape(id)}`;
    return this.context.dbe
      .query(q)
      .pipe(map(() => ({ status, id, result: "ok" })));
  }

  async hasOfficialPermissions(userId: number, feedback: FeedbackResponse): Promise<boolean> {
    const config = this.context.entityEngine.getEntitiesConfig();
    const {target_entity_id, target_entity_key} =  feedback;

    let contragentId: number;

    if(target_entity_key === "ent_contragents") {

      // core contragent entity
      contragentId = target_entity_id;
    } else if (config?.[target_entity_key].isContragent)  {

      // section contragent entity
      contragentId = await this.context.entityEngine.getCoreContragent(target_entity_id, target_entity_key as EntityKeys).then(contragent => contragent.contragent);
    } else {

      // slot entity
      contragentId = await this.context.slotEngine.getContragentIdBySlot(target_entity_id, target_entity_key as EntityKeys);
    }

    const permittionsByUser = await this.context.entityEngine.getEntities<LKPermission>("ent_lk_permissions", null, {user_id: userId.toString()}).toPromise();

    return permittionsByUser?.filter(permittionsByUser => permittionsByUser.contragent_entity_id === contragentId).some(permittionsByUser => permittionsByUser.permission_id === LKPermissionType.FEEDBACK);
  }

  async replyByFeedbackComment(
    commentId: number,
    text: string,
    feedbackId: number,
    userId: number,
    official?: boolean
  ): Promise<number> {
    if (!(commentId || text || feedbackId || userId)) throw "not valid request items";
    const feedback = await this.getFeedbackWithData(feedbackId).toPromise();
    if(!feedback) throw "not exist feedback for reply";

    if(official) {
      const hasOfficialPermission = await this.hasOfficialPermissions(userId, feedback);
      if(!hasOfficialPermission) throw "not permission fo official";
    }

    return this.context.commentEngine.addCommentToFeedback(
      feedbackId,
      text,
      userId,
      commentId,
      official
    );
  }

  async feedbackCreateAction(
    feedback: FeedbackDTO,
    userId: number
  ): Promise<number> {

    const createResult = await this.createFeedback(feedback, userId);
    const feedbackId = createResult.insertId;

    if (feedback?.comment)
      await this.context.commentEngine.addCommentToFeedback(
        feedbackId,
        feedback.comment,
        userId
      );
    if (feedback?.votes?.length)
      await this.context.voteEngine.saveVoteList(feedback.votes, feedbackId);

    return feedbackId;
  }

  async feedbackDelete(feedbackId: number): Promise<void> {
    if(!feedbackId) throw "not id by feedback in request";
    await this.context.voteEngine.removeVotesByFeedbackId(feedbackId);
    await this.removeFeedback(feedbackId);
  }

  async feedbackEdit(feedback: FeedbackDTO, userID: number): Promise<void> {
    if(!feedback?.id) throw "not id by feedback in request";
    const oldFeedback = await this.getFeedbackWithData(feedback?.id).toPromise();
    if(!oldFeedback) throw "feedback not exist";

    // remove old artifacts from feedback
    if(JSON.stringify(oldFeedback?.votes ?? []) !== JSON.stringify(feedback?.votes ?? [])) {
      await this.context.voteEngine.removeVotesByFeedbackId(feedback.id);
      await this.context.voteEngine.saveVoteList(feedback.votes ?? [], oldFeedback.id);
    }

    if(oldFeedback?.comment?.text !== feedback?.comment && !!oldFeedback?.comment) {
      await this.context.commentEngine.branchComment(oldFeedback?.comment?.id);
      // non critical action
      this.context.likeEngine.removeReactionsByComment(oldFeedback?.comment?.id);
    }

    // non critical action
    this.context.likeEngine.removeReactionsByFeedback(oldFeedback.id);

    // update fb
    await this.updateFeedback(oldFeedback.id);

    // add new changes
    if(!!feedback?.comment){
      await this.context.commentEngine.addCommentToFeedback(oldFeedback.id, feedback.comment, userID);
    }

  }

  getRouter(): Router {
    // feedback/stats?key=consultation&id=1
    this.feedback.get("/stats", async (req, res) => {
      try {
        const targetKey: string = req.query?.["key"] as string;
        const targetId = Number(req.query?.["id"]);

        if (Number.isNaN(targetId) || !targetKey)
          this.sendError(res, "Передан не валиднй target");

        const summary = await this.getAllStatsByTarget(
          targetKey,
          targetId
        ).toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    // feedback/stats BODY: entities: {key, id}[]
    this.feedback.post("/stats", jsonparser, async (req, res) => {
      try {
        const targets = req.body as Array<{ key: string; id: number }>;
        if (!targets?.length) this.sendError(res, "Передан не валиднй targets");

        const summary = await Promise.all(
          targets.map(({ key, id }) =>
            this.getAllStatsByTarget(key, id)
              .pipe(
                map((r) => ({
                  ...r,
                  target_entity_key: key,
                  target_entity_id: id,
                }))
              )
              .toPromise()
          )
        );

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/list", async (req, res) => {
      try {
        const targetKey: string = req.query?.["key"] as string;
        const targetId = Number(req.query?.["id"]);

        if (Number.isNaN(targetId) || !targetKey)
          this.sendError(res, "Передан не валиднй target");

        const summary = await this.getFeedbackListWithData(targetKey, targetId).toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/listbyuser", async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;

        const skip =  req.query?.["skip"] ? 
                      Number(req.query?.["skip"]) : 
                      undefined;

        const limit = req.query?.["limit"] ? 
                      Number(req.query?.["limit"]) : 
                      undefined;

        const sectionKey: SectionKeys = this.sectionKeyMapper(
          req.query?.["section"] as string
        );
        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        if (!userId)
          this.sendError(res, "User ID is not required");

        const cacheKey = `feedback_by_user_${userId}.skip_${skip}.limit_${limit}.status_${statusKey}.section_${sectionKey}`;

        const summary: Feedback[] = this.context.cacheEngine.checkCache(cacheKey) ?
          await this.context.cacheEngine.getCachedByKey<Feedback[]>(cacheKey).toPromise() :
          await this.getByUserId(userId, sectionKey, statusKey, skip, limit).pipe(
            tap(data => this.context.cacheEngine.saveCacheData(cacheKey, data))).toPromise();

        res.send(summary);

      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/replies/:commentID", async (req, res) => {
      try {
        const commentID = Number(req.params?.["commentID"]);

        if (Number.isNaN(commentID) || !commentID)
          this.sendError(res, "Передан не валиднй commentID");

        const comments = await this.getCommentsByMasterComment(
          commentID,
          getFiltersByRequest(req)
        ).toPromise();

        res.send(comments);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/listbycontragent/:contragentID", async (req, res) => {
      try {
        const sectionKey: SectionKeys = this.sectionKeyMapper(
          req.query?.["section"] as string
        );

        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        const targetKey: EntityKeys = this.targetKeyMapper(
          req.query?.["target_key"] as string
        );

        const contragentId = Number(req.params?.["contragentID"]);

        if (Number.isNaN(contragentId))
          this.sendError(res, "Передан не валиднй contragent");

        const summary: { core: Feedback[]; slot: Feedback[] } = await this.getFeedbackListByContragent(contragentId, targetKey, sectionKey, statusKey);

        const core = await Promise.all(summary?.core.map((cfb) => this.getFeedbackWithData(cfb.id).toPromise()) ?? []);
        const slot = await Promise.all(summary?.slot.map((cfb) => this.getFeedbackWithData(cfb.id).toPromise()) ?? []);

        const result: FeedbackResponseByContragent = {
          total: (summary?.core?.length ?? 0) + (summary?.slot?.length ?? 0),
          byCore: core ?? [],
          bySlots: slot ?? [],
          contragentId,
        };

        res.send(result);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/:id", async (req, res) => {
      try {
        const feedbackId = Number(req.params.id);
        if (Number.isNaN(feedbackId))
          this.sendError(res, "Передан не валиднй feedback id");
        const feedback = await this.getFeedbackWithData(feedbackId).toPromise();
        if (!feedback) {
          this.sendError(res, "Отзыв не найден");
          return;
        }
        res.send(feedback);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.delete("/:id",
      jsonparser,
      this.feedbackRemoveGrantsCheck,
    async (req, res) => {
      try {
        const feedbackID = Number(req?.params?.id);

        await this.feedbackDelete(feedbackID);
        res.send({feedbackID, result: 'success'});
      }
      catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.post("/", jsonparser, async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;
        // get body and typing to DTO

        const cacheKey = `feedback_by_user_${userId}`;
        this.context.cacheEngine.softClearByKey(cacheKey);
        
        const feedback: FeedbackDTO = req.body;
        this.validateDTO(feedback);

        let returnedId: number = null;
        let result = "nope";
        switch (feedback.action) {
          case "CREATE":
            returnedId = await this.feedbackCreateAction(feedback, userId);
            result = "ok";
            break;
          case "EDIT":
            await this.feedbackEditGrantsCheck(userId, feedback.id);
            await this.feedbackEdit(feedback, userId);
            result = "ok";
            break;
          case "REMOVE_FEEDBACK":
            await this.feedbackDelete(feedback?.id);
            returnedId = feedback?.id;
            result = "ok";
            break;
          case "LIKE":
            feedback.comment_id
              ? this.context.likeEngine.insertLike(
                  "comment",
                  userId,
                  feedback.comment_id
                )
              : this.context.likeEngine.insertLike(
                  "feedback",
                  userId,
                  feedback.id
                );
            result = "ok";
            break;
          case "DISLIKE":
            feedback.comment_id
              ? this.context.likeEngine.insertDislike(
                  "comment",
                  userId,
                  feedback.comment_id
                )
              : this.context.likeEngine.insertDislike(
                  "feedback",
                  userId,
                  feedback.id
                );
            result = "ok";
            break;
          case "UNLIKE":
            feedback.comment_id
              ? this.context.likeEngine.removeAllReactionOfUserByEntity(
                  userId,
                  feedback.comment_id,
                  "comment"
                )
              : this.context.likeEngine.removeAllReactionOfUserByEntity(
                  userId,
                  feedback.id,
                  "feedback"
                );
            break;
          case "ANSWER":
            break;
          case "ISSUES":
            break;
          case "REPLY":
            // eslint-disable-next-line no-case-declarations
            const { comment_id, comment, status } = feedback;
            const repliedComment = await this.context.commentEngine.getCommentById(comment_id).toPromise();
            if (!repliedComment) throw "not replyable comment, comment_id not found";
          
            console.log("repliedComment:", repliedComment);
            returnedId =  await this.replyByFeedbackComment(repliedComment.id, comment, repliedComment.feedback_id, userId, status === "official");
            result = "ok";
            break;
          case "REMOVE_FEEDBACK":
            break;
          case "REMOVE_COMMENT":
            break;
        }

        res.send({ result, returnedId });
      } catch (e) {
        this.sendError(res, e);
      }
    });

    // change status only
    this.feedback.put(
      "/",
      jsonparser,
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        7
      ),
      async (req, res) => {
        try {
          // get body and typing to DTO
          const feedback: FeedbackDTO = req.body;
          const newStatus: FeedbackStatus =
            this.statusKeyMapper(feedback.status) ?? "pending";
          this.validateDTO(feedback);
          const result = await this.changeStatusByFeedbackID(
            feedback.id,
            newStatus
          ).toPromise();
          res.send(result);
        } catch (e) {
          this.sendError(res, e);
        }
      }
    );

    return this.feedback;
  }
}
