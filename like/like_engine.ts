import {Context} from "../search/config";
import {Observable, throwError, zip} from "rxjs";
import {Like, LikeType} from "./model";
import {map, mapTo, tap} from "rxjs/operators";
import {escape} from "mysql";
export class LikeEngine {
    context: Context;
    constructor(context: Context) {
        context.likeEngine = this;
        this.context = context;
    }

    removeAllReactionOfUserByEntity(userId: number, entityId: number, targetType: LikeType): Observable<unknown> {
        const like_q = `DELETE FROM \`dislikes\`
                    WHERE user_id=${escape(userId)} 
                    AND target_type=${escape(targetType)} 
                    AND target_id=${escape(entityId)}`;

        const dislike_q = `DELETE FROM \`likes\`
                    WHERE user_id=${escape(userId)} 
                    AND target_type=${escape(targetType)} 
                    AND target_id=${escape(entityId)}`;

        return zip(this.context.dbe.query(like_q), this.context.dbe.query(dislike_q));
    }
    getStatsByFeedback(id: number, type: LikeType): Observable<{likes: Like[], dislikes: Like[]}> {
        const likeRequest = this.getBiRateByEntity(type, 'like', id);
        const dislikeRequest = this.getBiRateByEntity(type, 'dislike', id);

        return zip(likeRequest, dislikeRequest).pipe(map(([likes, dislikes]) => ({likes, dislikes})));
    }

    getBiRateByEntity(likeType: LikeType, rateType: 'like'|'dislike', entityId: number): Observable<Like[]> {
        const q = `SELECT * FROM \`${rateType + 's'}\` 
                    WHERE target_id = ${escape(entityId)} AND target_type = "${likeType}"`;
        return this.context.dbe.queryList<Like>(q);
    }

    setLikeToFeedback(id: number, userId: number): Observable<unknown> {
        if(!id || !userId) return throwError('not valid existing data');
        const targetType: LikeType = 'feedback';
        const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setDislikeToFeedback(id: number, userId: number): Observable<unknown> {
        if(!id || !userId) return throwError('not valid existing data');
        const targetType: LikeType = 'feedback';
        const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setLikeToComment(id: number, userId: number): Observable<unknown> {
        if(!id || !userId) return throwError('not valid existing data');
        const targetType: LikeType = 'comment';
        const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    setDislikeToComment(id: number, userId: number): Observable<unknown> {
        if(!id || !userId) return throwError('not valid existing data');
        const targetType: LikeType = 'comment';
        const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}, 
                   )`;
        return this.context.dbe.query(q);
    }

    unsetLike(id: number): Observable<unknown> {
        const q = `DELETE FROM \`likes\` WHERE id=${escape(id)}`;
        return this.context.dbe.query(q);
    }

    unsetDislike(id: number): Observable<unknown> {
        const q = `DELETE FROM \`dislikes\` WHERE id=${escape(id)}`;
        return this.context.dbe.query(q);
    }

    insertLike(type: LikeType, userId: number, targetId: number): Observable<boolean> {
        if(!targetId || !userId) return throwError('not valid existing data');
        return this.removeAllReactionOfUserByEntity(userId, targetId, type).pipe(
            tap(() => {
                if (type === 'comment') return this.setLikeToComment(targetId, userId);
                if (type === 'feedback') return this.setLikeToFeedback(targetId, userId);
            }),
            mapTo(true),
        )
    }

    insertDislike(type: LikeType, userId: number, targetId: number): Observable<boolean> {
        if(!targetId || !userId) return throwError('not valid existing data');
        return this.removeAllReactionOfUserByEntity(userId, targetId, type).pipe(
            tap(() => {
                if (type === 'comment') return this.setDislikeToComment(targetId, userId);
                if (type === 'feedback') return this.setDislikeToFeedback(targetId, userId);
            }),
            mapTo(true),
        )
    }
}
