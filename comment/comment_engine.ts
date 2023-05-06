import { Context } from "../search/config";
import { Comment } from "./model";
import { Observable, UnaryFunction, forkJoin, of, pipe } from "rxjs";
import { map, mapTo, switchMap, tap } from "rxjs/operators";
import { OkPacket, escape } from "mysql";
import { FilterParams } from "entity/entity_engine";
import { Like } from "like/model";
import { Feedback } from "feedback/models";

export class CommentEngine {
  context: Context;
  constructor(context: Context) {
    context.commentEngine = this;
    this.context = context;
  }

  getReactionPipe: UnaryFunction<Observable<Comment[]>, Observable<Comment[]>> =
    pipe(
      map((_: Comment[]) => _),
      switchMap((comments: Comment[]) =>
        comments?.length
          ? forkJoin(
              comments.map((comment) =>
                this.getStatsByComment(comment.id).pipe(
                  map((reactions) => ({ ...comment, ...reactions } as Comment))
                )
              )
            )
          : of([])
      )
    );

  getAllCommentsByFeedback(
    id: number,
    filters: FilterParams
  ): Observable<Comment[]> {
    filters["feedback_id"] = id.toString();
    return this.context.entityEngine
      .getEntities<Comment>("ent_comments", null, filters)
      .pipe(this.getReactionPipe);
  }

  getCommentsByParentId(
    id: number,
    filters: FilterParams
  ): Observable<Comment[]> {
    filters["comment_id"] = id.toString();
    return this.context.entityEngine
      .getEntities<Comment>("ent_comments", null, filters)
      .pipe(this.getReactionPipe);
  }

  getStatsByComment(
    id: number
  ): Observable<{ likes: Like[]; dislikes: Like[] }> {
    return this.context.likeEngine.getStatsByFeedback(id, "comment");
  }

  getCommentById(id: number): Observable<Comment> {
    return this.context.entityEngine
      .getEntities<Comment>("ent_comments", null, null, id)
      .pipe(map((ents) => ents?.[0]));
  }

  getMasterCommentByFeedbackId(id: number): Observable<Comment> {
    const q = `SELECT *, 
                    (SELECT COUNT(*) 
                        FROM \`comments\` 
                        WHERE comment_id = com.id) as replies
                         FROM \`comments\` as com 
                    WHERE feedback_id = ${escape(id)}
                    AND comment_id IS NULL`;
    return this.context.dbe.queryList<Comment>(q).pipe(
      this.getReactionPipe,
      map((result) => result?.[0] ?? null)
    );
  }

  addCommentToFeedback(
    feedbackID: number,
    comment: string,
    userId: number,
    parent?: number,
    offical?: boolean,
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
                        ${escape(offical ? 'official' : 'approved')},
                        'answer'
                    )`;

    return this.context.dbe.query<OkPacket>(q).pipe(map(result => result.insertId)).toPromise();
  }

  deleteCommentById(id: number): Observable<unknown> {
    const q = `UPDATE FROM \`comments\`
                    SET status = "deleted"
                    WHERE id=${escape(id)} 
                    AND comment_id=${escape(id)}`;
    return this.context.dbe.query(q);
  }
}
