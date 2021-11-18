import type * as functions from "firebase-functions";

export const onRequest = async (req: functions.Request, res: functions.Response) =>
  (await import("./onRequest")).default(req, res);
