import { Context } from "../search/config";
import { Comment } from "./model";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { escape } from "mysql";
import { FilterParams } from "entity/entity_engine";

export class CommentEngine {
  context: Context;
  constructor(context: Context) {
    context.commentEngine = this;
    this.context = context;
  }

  getAllCommentsByFeedback(
    id: number,
    filters: FilterParams
  ): Observable<Comment[]> {
    filters["feedback_id"] = id.toString();
    return this.context.entityEngine.getEntities<Comment>(
      "ent_comments",
      null,
      filters
    );
  }

  getCommentsByParentId(
    id: number,
    filters: FilterParams
  ): Observable<Comment[]> {
    filters["comment_id"] = id.toString();
    return this.context.entityEngine.getEntities<Comment>(
      "ent_comments",
      null,
      filters
    );
  }

  getCommentById(id: number): Observable<Comment> {
    const q = `SELECT * FROM \`comments\` WHERE id=${escape(id)}`;
    return this.context.dbe.query<Comment>(q);
  }

  getMasterCommentByFeedbackId(id: number): Observable<Comment> {
    const q = `SELECT *, 
                    (SELECT COUNT(*) 
                        FROM \`comments\` 
                        WHERE comment_id = com.id) as replies
                         FROM \`comments\` as com 
                    WHERE feedback_id = ${escape(id)}
                    AND comment_id IS NULL`;
    return this.context.dbe
      .queryList<Comment>(q)
      .pipe(map((result) => result?.[0] ?? null));
  }

  addCommentToFeedback(
    feedbackID: number,
    comment: string,
    userId: number,
    parent?: number
  ): Promise<Comment> {
    const q = `INSERT INTO comments 
                    (
                        feedback_id, 
                        user_id,
                        text,
                        comment_id
                    )
                    VALUES (
                        ${escape(feedbackID)}, 
                        ${escape(userId)},
                        ${escape(comment)},
                        ${escape(parent ?? null)}
                    )`;

    return this.context.dbe.query<Comment>(q).toPromise();
  }

  deleteCommentById(id: number): Observable<unknown> {
    const q = `UPDATE FROM \`comments\`
                    SET status = "deleted"
                    WHERE id=${escape(id)} 
                    AND comment_id=${escape(id)}`;
    return this.context.dbe.query(q);
  }
}
