import * as functions from "firebase-functions";
import * as remixFunctions from "./remix";

export const remix = functions.https.onRequest(remixFunctions.onRequest);
