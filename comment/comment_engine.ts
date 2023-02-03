import {Context} from "../search/config";
import {Comment} from "./model";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {escape} from "mysql";


export class CommentEngine {
    context: Context;
    constructor(context: Context) {
        context.commentEngine = this;
        this.context = context;
    }

    getAllCommentsByFeedback(id: number): Observable<Comment[]> {
        const q = `SELECT * FROM \`comments\` WHERE feedback_id=${escape(id)}`;
        return this.context.dbe.queryList<Comment>(q);
    }

    getCommentsByParentId(id: number): Observable<Comment[]> {
        const q = `SELECT * FROM \`comments\` WHERE comment_id=${escape(id)}`;
        return this.context.dbe.queryList<Comment>(q);
    }

    getCommentById(id: number): Observable<Comment> {
        const q = `SELECT * FROM \`comments\` WHERE id=${escape(id)}`;
        return this.context.dbe.query<Comment>(q);
    }

    getMasterCommentByFeedbackId(id: number): Observable<Comment> {
        const q = `SELECT * FROM \`comments\` WHERE feedback_id=${escape(id)} AND comment_id IS NULL`;
        return this.context.dbe.queryList<Comment>(q).pipe(map(result => result?.[0] ?? null));
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
                        ${escape(feedbackID)}, 
                        ${escape(userId)},
                        ${escape(comment.title)}, 
                        ${escape(comment.description ?? '')},
                        ${escape(parent ?? null)}, 
                    )`;

        return this.context.dbe.query<Comment>(q);
    }

    deleteCommentById(id: number): Observable<unknown> {
        const q = `DELETE FROM \`comments\`
                    WHERE id=${escape(id)} 
                    AND comment_id=${escape(id)}`;
        return this.context.dbe.query(q);
    }

}
