import * as express from "express";
import moment from "moment";
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
import { Reactions } from "../like/model";
import { map, switchMap, tap } from "rxjs/operators";
import bodyparser from "body-parser";
import { User } from "../models/user.interface";
import { FeedbackChangeStatus, FeedbackDTO } from "./dto";
import { EntityKeys } from "entity/entity_repo.model";
import { LKPermission, LKPermissionType } from "auth/lk.permissions.model";

const jsonparser = bodyparser.json();

export class FeedbackEngine {
  context: Context;
  private feedback = express.Router();

  constructor(context: Context) {
    context.feedbackEngine = this;
    this.context = context;
    this.feedback.use(this.userCatcher);
  }

  sendError = (res: Response, err, code?: number): void => {
    console.log(
      "FEEDBACK error: ",
      (err.message ? err.message : err) ?? "unknown error"
    );
    if (res.statusCode === 200) {
      res.status(code ?? 500);
    }

    res.end(
      JSON.stringify({
        error:
          res.statusMessage ??
          (err.message ? err.message : err) ??
          "unknown error",
      })
    );
  };

  userCatcher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = await this.context.authorizationEngine.getToken(req);
      res.locals.userId =
        await this.context.authorizationEngine.getUserIdByToken(token);

      if (!res.locals.userId) throw "user not defined by token" + token;
      // console.log("userCatcher: ", res.locals.userId, " -> by token: ", token);
      next();
    } catch (e) {
      this.sendError(res, e);
    }
  };

  feedbackRemoveGrantsCheck = async (feedbackId: number, res: Response) => {
    const userId = res.locals.userId;

    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }

    const existFeedback = await this.getFeedbackById(feedbackId).toPromise();
    if (!existFeedback) {
      res.status(404);
      throw new Error("feedback not found");
    }

    const isGranted =
      await this.context.authorizationEngine.hasPermissionByUser(userId, 3);
    if (!(isGranted || existFeedback?.user_id === userId)) {
      res.status(401);
      throw new Error("Remove this Feedback not permited for you");
    }
  };

  replyGrantsCheck = async (feedbackId: number, replyId: number, res: Response) => {
    const userId = res.locals.userId;

    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }

    const existFeedback = await this.getFeedbackById(feedbackId).toPromise();
    if (!existFeedback) {
      res.status(404);
      throw new Error("feedback not found");
    }

    const existReply = await this.context.commentEngine.getCommentById(replyId).toPromise();
    if (!existReply) {
      res.status(404);
      throw new Error("reply not found");
    }

    const isGranted =
      await this.context.authorizationEngine.hasPermissionByUser(userId,3);
    if (!(isGranted || existReply?.user_id === userId)) {
      res.status(401);
      throw new Error("Remove this Reply not permited for you");
    }
  };

  feedbackEditGrantsCheck = async (feedbackId: number, res: Response) => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }
    const user = await this.context.authorizationEngine.getUserById(userId);
    if (!user) {
      res.status(401);
      throw new Error("user not found");
    }
    const existFeedback = await this.getFeedbackById(feedbackId).toPromise();
    if (!existFeedback) {
      res.status(401);
      throw new Error("feedback not found");
    }
    if (existFeedback?.user_id !== user.id) {
      res.status(401);
      throw new Error("Edit this Feedback not permited for you");
    }
    if (
      moment(existFeedback.datetime_create).isBefore(
        moment().subtract(5, "days")
      )
    ) {
      res.status(401);
      throw new Error("Edit is not allowed, more than 5 days have passed");
    }
  };

  feedbackCreateGrantsCheck = async (res: Response) => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }
    const user = await this.context.authorizationEngine.getUserById(userId);
    if (!user) {
      res.status(401);
      throw new Error("user not found");
    }

    const isGranted =
      await this.context.authorizationEngine.hasPermissionByUser(userId, 3);
    if (!isGranted) {
      res.status(401);
      throw new Error("Create Feedback not permited for you");
    }
  };

  reactionAddCheck = async (res: Response) => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }
    const user = await this.context.authorizationEngine.getUserById(userId);
    if (!user) {
      res.status(401);
      throw new Error("user not found");
    }

    const isGranted =
      await this.context.authorizationEngine.hasPermissionByUser(userId, 3);
    if (!isGranted) {
      res.status(401);
      throw new Error("Add reaction not permited for you");
    }
  };

  reactionUnsetCheck = async (res: Response) => {
    const userId = res.locals.userId;
    if (!userId) {
      res.status(401);
      throw new Error("user not found");
    }
    const user = await this.context.authorizationEngine.getUserById(userId);
    if (!user) {
      res.status(401);
      throw new Error("user not found");
    }

    const isGranted =
      await this.context.authorizationEngine.hasPermissionByUser(userId, 3);
    if (!isGranted) {
      res.status(401);
      throw new Error("Remove reaction not permited for you");
    }
  };

  feedbackCreateRateLimitCheck = async (
    userId: number,
    targetKey: EntityKeys,
    targetId: number,
    res: Response
  ) => {
    const existFeedback = await this.getLastFeedbackByUserAndTarget(
      targetKey,
      targetId,
      userId
    ).toPromise();
    if (existFeedback) {
      // check dates
      res.status(429);
      res.statusMessage =
        "Found review less than 5 days old. Please edit or delete it before posting a new one.";
      throw new Error("429 too many request of create feedback");
    }
  };

  feedbackReplyRateLimitCheck = async (
    userId: number,
    commentId: number,
    res: Response
  ) => {
    const exist = await this.getLastRepliesByComment(
      commentId,
      userId
    ).toPromise();
    if (exist) {
      // check dates
      res.status(429);
      res.statusMessage =
        "Found review less than 5 days old. Please edit or delete it before posting a new one.";
      throw new Error("429 too many request of create reply");
    }
  };

  getFeedbackById(id: number): Observable<Feedback> {
    const q = `SELECT * FROM \`feedbacks\` WHERE id=${escape(id)}`;
    return this.context.dbe
      .queryList<Feedback>(q)
      .pipe(map(([feedback]) => feedback ?? null));
  }

  getUserById(id: number): Observable<User> {
    return from(this.context.authorizationEngine.getUserByIdSafetly(id));
  }

  getLastFeedbackByUserAndTarget(
    targetKey: EntityKeys,
    targetID: number,
    userID: number
  ): Observable<Feedback> {
    const addQ = " ORDER BY datetime_create DESC LIMIT 1";

    const q = `SELECT * FROM \`feedbacks\` 
                WHERE user_id=${escape(userID)}
                AND status NOT IN ("deleted")
                AND target_entity_id=${escape(targetID)}
                AND target_entity_key=${escape(targetKey)}
                AND datetime_update >= NOW() - INTERVAL 5 DAY
                ${addQ}`;

    // console.log("getLastFeedbackByUserAndTarget: ", q);
    return this.context.dbe.queryOnceOfList<Feedback>(q).pipe();
  }

  getLastRepliesByComment(
    parentCommentId: number,
    userId: number
  ): Observable<Comment> {
    const addQ = " ORDER BY datetime_create DESC LIMIT 1";

    const q = `SELECT * FROM \`comments\` 
                WHERE user_id=${escape(userId)}
                AND status NOT IN ("deleted", "branched")
                AND comment_id=${escape(parentCommentId)}
                AND datetime_update >= NOW() - INTERVAL 5 DAY
                ${addQ}`;

    // console.log("getLastFeedbackByUserAndTarget: ", q);
    return this.context.dbe.queryOnceOfList<Comment>(q).pipe();
  }

  getByUserId(
    userId: number,
    section?: SectionKeys,
    status?: FeedbackStatus,
    skip = 0,
    limit = 20
  ): Observable<Feedback[]> {
    const sectionStr = `${
      section === "clinic" ? 'AND section = "clinic"' : ""
    }${section === "consultation" ? 'AND section = "consultation"' : ""}`;
    const statusStr = status ? ` AND status = ${escape(status)}` : "";

    const limStr = `${
      skip ? " LIMIT " + limit + " OFFSET " + skip : " LIMIT " + limit
    }`;

    const q = `SELECT * FROM \`feedbacks\` 
                WHERE user_id=${escape(userId)}
                AND status NOT IN ("pending", "deleted")
                ${sectionStr}
                ${statusStr}
                ${limStr}`;

    return this.context.dbe
      .queryList<Feedback>(q)
      .pipe(
        switchMap((list) =>
          list.length
            ? forkJoin([
                ...list.map((fb) => this.getFeedbackWithData(fb.id, userId)),
              ])
            : of(list)
        )
      );
  }

  getFeedbackListByTarget(
    targetEntityKey: string,
    targetId: number,
    status?: FeedbackStatus,
    skip = 0,
    limit = 20
  ): Observable<Feedback[]> {
    const statusStr = status ? ` AND status = ${escape(status)}` : "";
    const limStr = `${
      skip ? " LIMIT " + limit + " OFFSET " + skip : " LIMIT " + limit
    }`;

    const q = `SELECT * FROM \`feedbacks\`
                WHERE target_entity_key = ${escape(targetEntityKey)} 
                AND target_entity_id = ${escape(targetId)}
                AND status NOT IN ("pending", "deleted")
                ${statusStr}
                ${limStr}`;

    return this.context.dbe.queryList<Feedback>(q);
  }

  async getFeedbackListByContragent(
    targetId: number,
    targetKey?: EntityKeys,
    section?: SectionKeys,
    status?: FeedbackStatus
  ): Promise<{ core: Feedback[]; slot: Feedback[] }> {
    if (targetKey === "ent_contragents") {
      targetId = section
        ? (
            await this.context.entityEngine.getNestesContragent(
              targetId,
              section
            )
          )?.id
        : targetId;
      if (section === "clinic") {
        targetKey = "ent_clinic_contragents";
        if (!targetId)
          throw new Error(
            "У данного контрагента нет дочерней сущности в секции " + section
          );
      }
      if (section === "consultation") {
        targetKey = "ent_consultation_contragents";
        if (!targetId)
          throw new Error(
            "У данного контрагента нет дочерней сущности в секции " + section
          );
      }
    }

    return forkJoin([
      this.getCoreFeedbackListByContragent(targetId, targetKey, status),
      this.getSlotsFeedbackListByContragent(targetId, section, status),
    ])
      .pipe(map(([core, slot]) => ({ core, slot })))
      .toPromise();
  }

  async getCoreFeedbackListByContragent(
    targetId: number,
    targetKey: EntityKeys,
    status?: FeedbackStatus
  ): Promise<Feedback[]> {
    const statusStr = status ? ` AND status = ${escape(status)}` : "";
    const contragentStr = ` AND target_entity_key = ${escape(targetKey)} `;

    const q = `SELECT * FROM \`feedbacks\`
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
    const q = `SELECT \`feedbacks\`.* 
                    FROM \`feedbacks\`
                    INNER JOIN \`service_slot\` 
                    ON \`feedbacks\`.\`target_entity_id\` = \`service_slot\`.\`id\`
                    AND \`feedbacks\`.\`target_entity_key\` = \`service_slot\`.\`entity_key\` 
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

  getCommentByFeedback(id: number, userId: number): Observable<Comment> {
    return this.context.commentEngine.getMasterCommentByFeedbackId(id, userId);
  }

  getCommentsByMasterComment(
    commentId: number,
    userId?: number
  ): Observable<Comment[]> {
    return this.context.commentEngine.getCommentsByParentId(commentId, userId);
  }

  getVotesByFeedback(id: number): Observable<Vote[]> {
    return this.context.voteEngine.getVotesByFeedback(id);
  }

  getStatsByFeedback(id: number, userId?: number): Observable<Reactions> {
    return this.context.likeEngine.getStatsByFeedback(id, "feedback", userId);
  }

  getFeedbackListSetByTarget(
    targetKey: string,
    targetId: number,
    status?: string
  ): Observable<{ total: number; perpage: number }> {
    const statusStr = status ? ` AND status = ${escape(status)}` : "";

    const q = `SELECT COUNT(*) as total, 20 as portion FROM feedbacks 
              WHERE target_entity_key = ${escape(targetKey)} 
              AND target_entity_id = ${escape(targetId)}
              AND status NOT IN ("pending", "deleted")
              ${statusStr}`;

    return this.context.dbe.queryOnceOfList(q);
  }

  getFeedbackListSetByUser(
    userId: number,
    status?: string,
    section?: string
  ): Observable<{ total: number; perpage: number }> {
    const statusStr = status ? ` AND status = ${escape(status)}` : "";
    const sectionStr = `${
      section === "clinic" ? 'AND section = "clinic"' : ""
    }${section === "consultation" ? 'AND section = "consultation"' : ""}`;

    const q = `SELECT COUNT(*) as total, 20 as portion FROM feedbacks 
              WHERE user_id = ${escape(userId)}
              AND status NOT IN ("pending", "deleted")
              ${statusStr}
              ${sectionStr}`;

    return this.context.dbe.queryOnceOfList(q);
  }

  getFeedbackListWithDataByTarget(
    targetKey: string,
    targetId: number,
    status?: FeedbackStatus,
    skip?: number,
    limit?: number,
    userId?: number
  ): Observable<FeedbackResponse[]> {
    return this.getFeedbackListByTarget(
      targetKey,
      targetId,
      status,
      skip,
      limit
    ).pipe(
      switchMap((list) =>
        list.length
          ? forkJoin([
              ...list.map((fb) => this.getFeedbackWithData(fb.id, userId)),
            ])
          : of([])
      )
    );
  }

  getFeedbackWithData(
    id: number,
    userId: number
  ): Observable<FeedbackResponse> {
    const feedbackRequest = this.getFeedbackById(id);
    const feedbackVotesRequest = this.getVotesByFeedback(id);
    const feedbackCommentsRequest = this.getCommentByFeedback(id, userId);
    const feedbackLikesRequest = this.getStatsByFeedback(id, userId);

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
      map(
        ([
          feedback,
          votes,
          comment,
          { likes, dislikes, likeOwner, dislikeOwner },
          user,
        ]) =>
          feedback
            ? ({
                ...feedback,
                canEdit: moment(feedback.datetime_create).isAfter(
                  moment().subtract(1, "days")
                ),
                canRemove: true,
                votes,
                user,
                likes,
                dislikes,
                likeOwner,
                dislikeOwner,
                action: "ANSWER",
                comment,
              } as FeedbackResponse)
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
                    IN (SELECT id FROM feedbacks 
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
                    SELECT id FROM feedbacks 
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

  createFeedback(
    feedback: FeedbackDTO,
    userId: number,
    toModeration: boolean
  ): Promise<OkPacket> {
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

    const q = `INSERT INTO \`feedbacks\` 
                   (section, target_entity_key, target_entity_id, user_id, status) VALUES (
                    ${escape(feedback.section)}, 
                    ${escape(feedback.target_entity_key)}, 
                    ${escape(feedback.target_entity_id)}, 
                    ${escape(userId)},
                    ${escape(toModeration ? "pending" : "approved")}
                   )`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  updateFeedback(feedbackId: number): Promise<OkPacket> {
    const q = `UPDATE \`feedbacks\` SET \`datetime_update\` = NOW() WHERE \`feedbacks\`.\`id\` = ${escape(
      feedbackId
    )};`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  removeFeedback(feedbackId: number): Promise<OkPacket> {
    const q = `UPDATE \`feedbacks\` SET \`status\` = "deleted" WHERE \`feedbacks\`.\`id\` = ${escape(
      feedbackId
    )};`;
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

    return SMap[key] ?? "ent_contragents";
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
    const q = `UPDATE feedbacks SET status = ${escape(
      status
    )} WHERE id = ${escape(id)}`;
    return this.context.dbe
      .query(q)
      .pipe(map(() => ({ status, id, result: "ok" })));
  }

  async hasOfficialPermissions(
    userId: number,
    feedback: FeedbackResponse
  ): Promise<boolean> {
    const config = this.context.entityEngine.getEntitiesConfig();
    const { target_entity_id, target_entity_key } = feedback;

    let contragentId: number;

    if (target_entity_key === "ent_contragents") {
      // core contragent entity
      contragentId = target_entity_id;
    } else if (config?.[target_entity_key].isContragent) {
      // section contragent entity
      contragentId = await this.context.entityEngine
        .getCoreContragent(target_entity_id, target_entity_key as EntityKeys)
        .then((contragent) => contragent.contragent);
    } else {
      // slot entity
      contragentId = await this.context.slotEngine.getContragentIdBySlot(
        target_entity_id,
        target_entity_key as EntityKeys
      );
    }

    const permittionsByUser = await this.context.entityEngine
      .getEntities<LKPermission>("ent_lk_permissions", null, {
        user_id: userId.toString(),
      })
      .toPromise();

    return permittionsByUser
      ?.filter(
        (permittionsByUser) =>
          permittionsByUser.contragent_entity_id === contragentId
      )
      .some(
        (permittionsByUser) =>
          permittionsByUser.permission_id === LKPermissionType.FEEDBACK
      );
  }

  async replyByFeedbackComment(
    commentId: number,
    comment: string,
    feedbackId: number,
    userId: number,
    official?: boolean
  ): Promise<number> {
    if (!(commentId || comment || feedbackId || userId))
      throw "not valid request items";
    const feedback = await this.getFeedbackWithData(
      feedbackId,
      userId
    ).toPromise();
    if (!feedback) throw "not exist feedback for reply";

    if (official) {
      const hasOfficialPermission = await this.hasOfficialPermissions(
        userId,
        feedback
      );
      if (!hasOfficialPermission) throw "not permission fo official";
    }

    return this.context.commentEngine.addCommentToFeedback(
      feedbackId,
      comment,
      userId,
      commentId,
      official
    );
  }

  async editReplyFeedbackComment(
    commentId: number,
    text: string,
    userId: number
  ): Promise<number> {
    if (!(commentId || text || userId)) throw "not valid request items";

    return await this.context.commentEngine.editComment(
      commentId,
      text,
      userId
    );
  }

  async feedbackCreateAction(
    feedback: FeedbackDTO,
    userId: number
  ): Promise<number> {
    const createResult = await this.createFeedback(
      feedback,
      userId,
      !!feedback.comment
    );
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
    if (!feedbackId) throw "not id by feedback in request";
    await this.context.voteEngine.removeVotesByFeedbackId(feedbackId);
    await this.removeFeedback(feedbackId);
  }

  async replyDelete(replyId: number) {
    if (!replyId) throw "not id by reply or comment in request";
    return this.context.commentEngine.deleteCommentById(replyId).toPromise();
  }

  async feedbackEdit(feedback: FeedbackDTO, userID: number): Promise<void> {
    if (!feedback?.id) throw "not id by feedback in request";
    const oldFeedback = await this.getFeedbackWithData(
      feedback?.id,
      userID
    ).toPromise();
    if (!oldFeedback) throw "feedback not exist";

    // remove old artifacts from feedback
    await this.context.voteEngine.removeVotesByFeedbackId(feedback.id);
    await this.context.voteEngine.saveVoteList(
      feedback.votes ?? [],
      oldFeedback.id
    );

    if (
      oldFeedback?.comment?.text !== feedback?.comment &&
      !!oldFeedback?.comment
    ) {
      await this.context.commentEngine.branchComment(oldFeedback?.comment?.id);
      // non critical action
      this.context.likeEngine.removeReactionsByComment(
        oldFeedback?.comment?.id
      );
      // add new changes
      if (feedback?.comment) {
        await this.context.commentEngine.addCommentToFeedback(
          oldFeedback.id,
          feedback.comment,
          userID
        );
      }
    }

    // non critical action
    this.context.likeEngine.removeReactionsByFeedback(oldFeedback.id);

    // update fb
    await this.updateFeedback(oldFeedback.id);
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
        // get userID
        const userId = res.locals?.userId;
        const targetKey: string = req.query?.["key"] as string;
        const targetId = Number(req.query?.["id"]);
        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        const skip = req.query?.["skip"]
          ? Number(req.query?.["skip"])
          : undefined;

        const limit = req.query?.["limit"]
          ? Number(req.query?.["limit"])
          : undefined;

        if (Number.isNaN(targetId) || !targetKey)
          this.sendError(res, "Передан не валиднй target");

        const summary = await this.getFeedbackListWithDataByTarget(
          targetKey,
          targetId,
          statusKey,
          skip,
          limit,
          userId
        ).toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/list/set", async (req, res) => {
      try {
        const targetKey: string = req.query?.["key"] as string;
        const targetId = Number(req.query?.["id"]);
        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        if (Number.isNaN(targetId) || !targetKey)
          this.sendError(res, "Передан не валиднй target");

        const summary = await this.getFeedbackListSetByTarget(
          targetKey,
          targetId,
          statusKey
        ).toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/listbyuser", async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;

        const skip = req.query?.["skip"]
          ? Number(req.query?.["skip"])
          : undefined;

        const limit = req.query?.["limit"]
          ? Number(req.query?.["limit"])
          : undefined;

        const sectionKey: SectionKeys = this.sectionKeyMapper(
          req.query?.["section"] as string
        );
        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        if (!userId) this.sendError(res, "User ID is not required");

        const cacheKey = `feedback_by_user_${userId}.skip_${skip}.limit_${limit}.status_${statusKey}.section_${sectionKey}`;

        const summary: Feedback[] = this.context.cacheEngine.checkCache(
          cacheKey
        )
          ? await this.context.cacheEngine
              .getCachedByKey<Feedback[]>(cacheKey)
              .toPromise()
          : await this.getByUserId(userId, sectionKey, statusKey, skip, limit)
              .pipe(
                tap((data) =>
                  this.context.cacheEngine.saveCacheData(cacheKey, data)
                )
              )
              .toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/listbyuser/set", async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;
        const sectionKey: SectionKeys = this.sectionKeyMapper(
          req.query?.["section"] as string
        );
        const statusKey: FeedbackStatus = this.statusKeyMapper(
          req.query?.["status"] as string
        );

        if (!userId) this.sendError(res, "User ID is not required");

        const summary = await this.getFeedbackListSetByUser(
          userId,
          statusKey,
          sectionKey
        ).toPromise();

        res.send(summary);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/replies/:commentID", async (req, res) => {
      try {
        const commentID = Number(req.params?.["commentID"]);
        const userId = res.locals?.userId;

        if (Number.isNaN(commentID) || !commentID)
          this.sendError(res, "Передан не валиднй commentID");

        const comments = await this.getCommentsByMasterComment(
          commentID, userId
        ).toPromise();

        res.send(comments);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.get("/listbycontragent/:contragentID", async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;

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

        const summary: {
          core: Feedback[];
          slot: Feedback[];
        } = await this.getFeedbackListByContragent(
          contragentId,
          targetKey,
          sectionKey,
          statusKey
        );

        const core = await Promise.all(
          summary?.core.map((cfb) =>
            this.getFeedbackWithData(cfb.id, userId).toPromise()
          ) ?? []
        );
        const slot = await Promise.all(
          summary?.slot.map((cfb) =>
            this.getFeedbackWithData(cfb.id, userId).toPromise()
          ) ?? []
        );

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
        // get userID
        const userId = res.locals?.userId;

        const feedbackId = Number(req.params.id);
        if (Number.isNaN(feedbackId))
          this.sendError(res, "Передан не валиднй feedback id");
        const feedback = await this.getFeedbackWithData(
          feedbackId,
          userId
        ).toPromise();
        if (!feedback) {
          this.sendError(res, "Отзыв не найден");
          return;
        }
        res.send(feedback);
      } catch (e) {
        this.sendError(res, e);
      }
    });

    this.feedback.delete("/:id", jsonparser, async (req, res) => {
      try {
        // get userID
        const userId = res.locals?.userId;
        // get body and typing to DTO

        const cacheKey = `feedback_by_user_${userId}`;
        this.context.cacheEngine.softClearByKey(cacheKey);

        const feedbackID = Number(req?.params?.id);
        await this.feedbackRemoveGrantsCheck(feedbackID, res);
        await this.feedbackDelete(feedbackID);
        res.send({ feedbackID, result: "success" });
      } catch (e) {
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

        const { id, comment_id, comment, status, action } = feedback;

        let returnedId: number = null;
        let result = "nope";
        switch (action) {
          case "CREATE":
            await this.feedbackCreateGrantsCheck(res);
            // await this.feedbackCreateRateLimitCheck(userId, <EntityKeys>feedback.target_entity_key, feedback.target_entity_id, res);
            returnedId = await this.feedbackCreateAction(feedback, userId);
            result = "ok";
            break;
          case "EDIT":
            await this.feedbackEditGrantsCheck(feedback.id, res);
            await this.feedbackEdit(feedback, userId);
            result = "ok";
            break;
          case "REMOVE_FEEDBACK":
            await this.feedbackRemoveGrantsCheck(feedback.id, res);
            await this.feedbackDelete(feedback?.id);
            returnedId = id;
            result = "ok";
            break;
          case "REMOVE_COMMENT":
            await this.replyGrantsCheck(id, comment_id, res);
            await this.replyDelete(comment_id);
            result = "ok";
            break;
          case "LIKE":
            feedback.comment_id
              ? await this.context.likeEngine
                  .insertLike("comment", userId, feedback.comment_id)
                  .toPromise()
              : await this.context.likeEngine
                  .insertLike("feedback", userId, feedback.id)
                  .toPromise();
            result = "ok";
            break;
          case "DISLIKE":
            feedback.comment_id
              ? await this.context.likeEngine
                  .insertDislike("comment", userId, feedback.comment_id)
                  .toPromise()
              : await this.context.likeEngine
                  .insertDislike("feedback", userId, feedback.id)
                  .toPromise();
            result = "ok";
            break;
          case "UNLIKE":
            feedback.comment_id
              ? await this.context.likeEngine
                  .removeAllReactionOfUserByEntity(
                    userId,
                    feedback.comment_id,
                    "comment"
                  )
                  .toPromise()
              : await this.context.likeEngine
                  .removeAllReactionOfUserByEntity(
                    userId,
                    feedback.id,
                    "feedback"
                  )
                  .toPromise();
            break;
          case "ISSUES":
            break;
          case "REPLY":
            // eslint-disable-next-line no-case-declarations
            const replyOfficiailMode = status === "official";

            // eslint-disable-next-line no-case-declarations
            const repliedComment = await this.context.commentEngine
              .getCommentById(comment_id)
              .toPromise();
            if (!repliedComment)
              throw "not replyable comment, comment_id not found";

            // проверка рейтлимита
            // if()await this.feedbackReplyRateLimitCheck(userId, comment_id, res);

            await this.replyByFeedbackComment(
              repliedComment.id,
              comment,
              repliedComment.feedback_id,
              userId,
              replyOfficiailMode
            );
            result = "ok";
            console.log(
              "repliedComment:",
              repliedComment,
              "result: ",
              result,
              "returnedId: ",
              returnedId
            );
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
