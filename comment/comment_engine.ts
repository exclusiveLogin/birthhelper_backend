import { Context } from "../search/config";
import { Comment } from "./model";
import { MonoTypeOperatorFunction, Observable, forkJoin, of, pipe } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { OkPacket, escape } from "mysql";
import { FilterParams } from "entity/entity_engine";
import {LikeSource, Reactions} from "like/model";

export class CommentEngine {
  context: Context;
  constructor(context: Context) {
    context.commentEngine = this;
    this.context = context;
  }

  getReactionPipe(userId: number, likeSource: LikeSource): MonoTypeOperatorFunction<Comment[]> {
    return pipe(
      switchMap((comments: Comment[]) =>
        comments?.length
          ? forkJoin(
              comments.map((comment) =>
                this.getStatsByComment(comment.id, userId, likeSource).pipe(
                  map((reactions) => ({ ...comment, ...reactions } as Comment))
                )
              )
            )
          : of([])
      )
    );
  }

  getAllCommentsByFeedback(
    id: number,
    filters: FilterParams,
    userId: number
  ): Observable<Comment[]> {
    filters["feedback_id"] = id.toString();
    return this.context.entityEngine
      .getEntities<Comment>("ent_comments", null, filters)
      .pipe(this.getReactionPipe(userId, 'comment'));
  }

  getCommentsByParentId(id: number, userId: number): Observable<Comment[]> {
    const q = `SELECT * 
    FROM \`comments\`
    WHERE comment_id = ${escape(id)}
    AND status NOT IN ('branched', 'pending', 'deleted', 'rejected')`;

    return this.context.dbe
      .queryList<Comment>(q)
      .pipe(this.getReactionPipe(userId, 'comment'));
  }

  getStatsByComment(id: number, userId: number, likeSource: LikeSource): Observable<Reactions> {
    return this.context.likeEngine.getStatsByFeedback(id, likeSource, userId);
  }

  getCommentById(id: number): Observable<Comment> {
    return this.context.entityEngine
      .getEntities<Comment>("ent_comments", null, null, id)
      .pipe(map((ents) => ents?.[0]));
  }

  getMasterCommentByFeedbackId(
    id: number,
    userId: number
  ): Observable<Comment> {
    const q = `SELECT *, 
                    (SELECT COUNT(*) 
                        FROM \`comments\` 
                        WHERE comment_id = com.id
                        AND status NOT IN ('branched', 'pending', 'deleted', 'rejected')
                        ) as replies
                    FROM \`comments\` as com 
                    WHERE feedback_id = ${escape(id)}
                    AND comment_id IS NULL
                    AND status NOT IN ('branched', 'pending', 'deleted', 'rejected')
                    ORDER BY datetime_update DESC 
                    LIMIT 1`;
    return this.context.dbe.queryList<Comment>(q).pipe(
      this.getReactionPipe(userId, 'comment'),
      map((result) => result?.[0] ?? null)
    );
  }

  addCommentToFeedback(
    feedbackID: number,
    comment: string,
    userId: number,
    parent?: number,
    offical?: boolean
  ): Promise<number> {
    const q = `INSERT INTO comments 
                    (
                        feedback_id, 
                        user_id,
                        text,
                        comment_id,
                        status,
                        type
                    )
                    VALUES (
                        ${escape(feedbackID)}, 
                        ${escape(userId)},
                        ${escape(comment)},
                        ${escape(parent ?? null)},
                        ${escape(offical ? "official" : "approved")},
                        ${escape(parent ? "reply" : "master")}
                    )`;

    return this.context.dbe
      .query<OkPacket>(q)
      .pipe(map((result) => result.insertId))
      .toPromise();
  }

  async editComment(commentId: number, newText: string, userId: number) {
    //get exist comment by id
    const existComment = await this.getCommentById(commentId).toPromise();
    if (!existComment) throw "not exixt comment for edit";
    if (existComment.user_id !== userId)
      throw "author not permitted fo edit comment";
    await this.branchComment(commentId);

    return await this.addCommentToFeedback(
      existComment.feedback_id,
      newText,
      existComment.user_id,
      existComment.comment_id,
      existComment.status === "official"
    );
  }

  deleteCommentById(id: number): Observable<unknown> {
    const q = `UPDATE \`comments\`
                    SET status = "deleted"
                    WHERE id=${escape(id)}`;
    return this.context.dbe.query(q);
  }

  branchCommentByFeedbackId(id: number): Promise<OkPacket> {
    const q = `UPDATE \`comments\` 
                SET \`status\` = "branched" 
                WHERE \`comments\`.\`feedback_id\` = ${escape(id)} 
                AND \`comments\`.\`comment_id\` IS NULL;`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }

  branchComment(commentId: number): Promise<OkPacket> {
    const q = `UPDATE \`comments\` SET \`status\` = "branched" WHERE \`comments\`.\`id\` = ${escape(
      commentId
    )};`;
    return this.context.dbe.query<OkPacket>(q).toPromise();
  }
}
