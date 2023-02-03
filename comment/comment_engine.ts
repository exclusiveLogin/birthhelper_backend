import {Context} from "../search/config";
import {EscapeFunctions} from "mysql";
import {Comment} from "./model";
import {Observable} from "rxjs";


export class CommentEngine {
    context: Context;
    escape: EscapeFunctions['escape'];
    constructor(context: Context) {
        context.commentEngine = this;
        this.context = context;
        this.escape = context.dbe.pool.escape;
    }

    getAllCommentsByFeedback(id: number): Observable<Comment[]> {
        const q = `SELECT * FROM \`comments\` WHERE feedback_id=${this.escape(id)}`;
        return this.context.dbe.queryList<Comment>(q);
    }

    getCommentsByParentId(id: number): Observable<Comment[]> {
        const q = `SELECT * FROM \`comments\` WHERE comment_id=${this.escape(id)}`;
        return this.context.dbe.queryList<Comment>(q);
    }

    getCommentById(id: number): Observable<Comment> {
        const q = `SELECT * FROM \`comments\` WHERE id=${this.escape(id)}`;
        return this.context.dbe.query<Comment>(q);
    }

    addCommentToFeedback(feedbackID: number, comment: Partial<Comment>, userId: number, parent?: number): Observable<Comment> {
        const q = `INSERT INTO comments 
                    (
                        feedback_id, 
                        user_id,
                        title, 
                        description, 
                        comment_id
                    )
                    VALUES (
                        ${this.escape(feedbackID)}, 
                        ${this.escape(userId)},
                        ${this.escape(comment.title)}, 
                        ${this.escape(comment.description ?? '')},
                        ${this.escape(parent ?? null)}, 
                    )`;

        return this.context.dbe.query<Comment>(q);
    }

    deleteCommentById(id: number): Observable<unknown> {
        const q = `DELETE FROM \`comments\`
                    WHERE id=${this.escape(id)} 
                    AND comment_id=${this.escape(id)}`;
        return this.context.dbe.query(q);
    }

}
