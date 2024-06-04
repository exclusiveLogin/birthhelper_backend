import {NextFunction, Request, Response} from "express";
import {Context} from "../search/config";
const sendError = (res: Response, err: Error, code?: number): void => {
    console.log(
        "guestGuard error: ",
        (err.message ? err.message : err) ?? "unknown error"
    );
    if (res.statusCode === 200) {
        res.status(code ?? 401);
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

const guestGuard = async (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
        const userID = parseInt(res.locals.userId);

        if (!userID) throw "guestGuard: user not defined by token";
        const isGuest = await ctx.authorizationEngine.isGuest(userID);
        if (isGuest) throw "guestGuard: user is guest, not allow access to this section";

        next();
    } catch (e) {
        sendError(res, e);
    }
};

export {guestGuard};