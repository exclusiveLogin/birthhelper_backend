import { Context } from "../search/config";
import { Observable, forkJoin, of, throwError, zip } from "rxjs";
import {Like, LikeSource, LikeType, Reactions} from "./model";
import { map, mapTo, switchMap } from "rxjs/operators";
import { escape } from "mysql";
export class LikeEngine {
  context: Context;
  constructor(context: Context) {
    context.likeEngine = this;
    this.context = context;
  }

  removeReactionsByFeedback(id: number): Observable<unknown> {
    const like_q = `DELETE FROM \`likes\`
                WHERE target_type="feedback" 
                AND target_id=${escape(id)}`;
    const dislike_q = `DELETE FROM \`dislikes\`
                WHERE target_type="feedback" 
                AND target_id=${escape(id)}`;

    return zip(
      this.context.dbe.query(like_q),
      this.context.dbe.query(dislike_q)
    );
  }

  removeReactionsByComment(id: number): Observable<unknown> {
    const like_q = `DELETE FROM \`likes\`
              WHERE target_type="comment" 
              AND target_id=${escape(id)}`;
    const dislike_q = `DELETE FROM \`dislikes\`
              WHERE target_type="comment" 
              AND target_id=${escape(id)}`;

    return zip(
      this.context.dbe.query(like_q),
      this.context.dbe.query(dislike_q)
    );
  }

  removeAllReactionOfUserByEntity(
    userId: number,
    entityId: number,
    targetType: LikeSource
  ): Observable<unknown> {
    const like_q = `DELETE FROM \`likes\`
                    WHERE user_id=${escape(userId)} 
                    AND target_type=${escape(targetType)} 
                    AND target_id=${escape(entityId)}`;

    const dislike_q = `DELETE FROM \`dislikes\`
                    WHERE user_id=${escape(userId)} 
                    AND target_type=${escape(targetType)} 
                    AND target_id=${escape(entityId)}`;

    return zip(
      this.context.dbe.query(like_q),
      this.context.dbe.query(dislike_q)
    );
  }
  getStatsByFeedback(
    id: number,
    type: LikeSource,
    userId: number
  ): Observable<Reactions> {
    const likeRequest = this.getBiRateByEntity(type, "like", id);
    const dislikeRequest = this.getBiRateByEntity(type, "dislike", id);
    const likeRequestOwner = this.getBiRateByEntityOwnership(
      type,
      "like",
      id,
      userId
    );
    const dislikeRequestOwner = this.getBiRateByEntityOwnership(
      type,
      "dislike",
      id,
      userId
    );

    return forkJoin([
      likeRequest,
      dislikeRequest,
      likeRequestOwner,
      dislikeRequestOwner,
    ]).pipe(
      map(([likes, dislikes, likeOwner, dislikeOwner]) => ({
        likes,
        dislikes,
        likeOwner,
        dislikeOwner,
      }))
    );
  }

  getBiRateByEntity(
    likeSource: LikeSource,
    likeType: LikeType,
    entityId: number
  ): Observable<Like[]> {
    const q = `SELECT * FROM \`${likeType + "s"}\` 
                    WHERE target_id = ${escape(entityId)} 
                    AND target_type = ${escape(likeSource)}`;

    return this.context.dbe.queryList<Like>(q);
  }

  getBiRateByEntityOwnership(
    likeSource: LikeSource,
    likeType: LikeType,
    entityId: number,
    userId: number
  ): Observable<boolean> {
    const q = `SELECT * FROM \`${likeType + "s"}\` 
                    WHERE target_id = ${escape(entityId)} 
                    AND target_type = ${escape(likeSource)}
                    AND user_id = ${escape(userId)}`;

    return this.context.dbe
      .queryOnceOfList<Like>(q)
      .pipe(map((like) => !!like));
  }

  setLikeToFeedback(id: number, userId: number): Observable<unknown> {
    if (!id || !userId) return throwError("not valid existing data");
    const targetType: LikeSource = "feedback";
    const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}
                   )`;
    return this.context.dbe.query(q);
  }

  setDislikeToFeedback(id: number, userId: number): Observable<unknown> {
    if (!id || !userId) return throwError("not valid existing data");
    const targetType: LikeSource = "feedback";
    const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}
                   )`;

    return this.context.dbe.query(q);
  }

  setLikeToComment(id: number, userId: number): Observable<unknown> {
    if (!id || !userId) return throwError("not valid existing data");
    const targetType: LikeSource = "comment";
    const q = `INSERT INTO \`likes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}
                   )`;
    return this.context.dbe.query(q);
  }

  setDislikeToComment(id: number, userId: number): Observable<unknown> {
    if (!id || !userId) return throwError("not valid existing data");
    const targetType: LikeSource = "comment";
    const q = `INSERT INTO \`dislikes\` 
                   (target_id, target_type, user_id) VALUES (
                    ${escape(id)}, 
                    "${targetType}",
                    ${escape(userId)}
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

  insertLike(
    type: LikeSource,
    userId: number,
    targetId: number
  ): Observable<unknown> {
    if (!targetId || !userId) return throwError("not valid existing data");
    return this.getBiRateByEntityOwnership(type, "like", targetId, userId).pipe(
      switchMap((exist) =>
        this.removeAllReactionOfUserByEntity(userId, targetId, type).pipe(
          mapTo(exist)
        )
      ),
      switchMap((exist) => {
        if (exist) return of(null);
        if (type === "comment") return this.setLikeToComment(targetId, userId);
        if (type === "feedback")
          return this.setLikeToFeedback(targetId, userId);
      })
    );
  }

  insertDislike(
    type: LikeSource,
    userId: number,
    targetId: number
  ): Observable<unknown> {
    if (!targetId || !userId) return throwError("not valid existing data");
    return this.getBiRateByEntityOwnership(
      type,
      "dislike",
      targetId,
      userId
    ).pipe(
      switchMap((exist) =>
        this.removeAllReactionOfUserByEntity(userId, targetId, type).pipe(
          mapTo(exist)
        )
      ),
      switchMap((exist) => {
        if (exist) return of(null);
        if (type === "comment")
          return this.setDislikeToComment(targetId, userId);
        if (type === "feedback")
          return this.setDislikeToFeedback(targetId, userId);
      })
    );
  }
}
