import {NextFunction, Request, Response} from "express";
import {Context} from "../search/config"

const sendError = (res: Response, err: Error, code?: number): void => {
    console.log(
        "userCatcher error: ",
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

const userCatcher = async (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
        const token = await ctx.authorizationEngine.getToken(req);
        res.locals.userId = await ctx.authorizationEngine.getUserIdByToken(token);

        if (!res.locals.userId) throw "user not defined by token" + token;
        // console.log("userCatcher: ", res.locals.userId, " -> by token: ", token);
        next();
    } catch (e) {
        sendError(res, e);
    }
};

export {userCatcher};