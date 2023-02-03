import {Context} from "../search/config";
import {Observable, zip} from "rxjs";
import {Like, LikeType} from "./model";
import {User} from "../models/user.interface";
import {EscapeFunctions} from "mysql";
import {map} from "rxjs/operators";
export class LikeEngine {
    context: Context;
    escape: EscapeFunctions['escape'];
    constructor(context: Context) {
        context.likeEngine = this;
        this.context = context;
        this.escape = context.dbe.pool.escape;
    }

    getStatsByFeedback(id: number, type: LikeType): Observable<{likes: Like[], dislikes: Like[]}> {
        const likeRequest = this.getBiRateByEntity(type, 'like', id);
        const dislikeRequest = this.getBiRateByEntity(type, 'dislike', id);

        return zip(likeRequest, dislikeRequest).pipe(map(([likes, dislikes]) => ({likes, dislikes})));
    }

    getBiRateByEntity(likeType: LikeType, rateType: 'like'|'dislike', entityId: number): Observable<Like[]> {
        const q = `SELECT * FROM \`${rateType + 's'}\` 
                    WHERE target_id = ${this.escape(entityId)} AND target_type = "${likeType}"`;
        return this.context.dbe.queryList<Like>(q);
    }

    setLikeToFeedback(id: number, userId: number): Observable<unknown> {
        const targetType: LikeType = 'feedback';
        const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${this.escape(id)}, 
                    "${targetType}",
                    ${this.escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setDislikeToFeedback(id: number, userId: number): Observable<unknown> {
        const targetType: LikeType = 'feedback';
        const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${this.escape(id)}, 
                    "${targetType}",
                    ${this.escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setLikeToComment(id: number, userId: number): Observable<unknown> {
        const targetType: LikeType = 'comment';
        const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${this.escape(id)}, 
                    "${targetType}",
                    ${this.escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setDislikeToComment(id: number, userId: number): Observable<unknown> {
        const targetType: LikeType = 'comment';
        const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${this.escape(id)}, 
                    "${targetType}",
                    ${this.escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    unsetLike(id: number): Observable<unknown> {
        const q = `DELETE FROM \`likes\` WHERE id=${this.escape(id)}`;
        return this.context.dbe.query(q);
    }

    unsetDislike(id: number): Observable<unknown> {
        const q = `DELETE FROM \`dislikes\` WHERE id=${this.escape(id)}`;
        return this.context.dbe.query(q);
    }

    insertLike(type: LikeType, user: User, targetId: number): Observable<unknown> {
        if(type === 'comment') return this.setLikeToComment(targetId, user.id);
        if(type === 'feedback') return this.setLikeToFeedback(targetId, user.id);
    }
}
