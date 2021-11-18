import * as functions from "firebase-functions";
import gotBase from "got";
const requireFromString: (source: string, filename?: string) => Promise<any> = require("require-from-string");

const got = gotBase.extend({
  http2: true,
  dnsCache: true,
});

type RequestHandler = (req: functions.Request, res: functions.Response) => Promise<void>;

const cachedRemixes: Record<string, RequestHandler | undefined> = {};
const cachedEtags: Record<string, string> = {};

const notWellKnownPath = "/build/_assets-not-well-known/";
const remixBundleName = "remix-function.js";

const getRemix = async (origin: string) => {
  const remixUrl = `${origin}${notWellKnownPath}${remixBundleName}`;
  const cachedEtag = cachedEtags[remixUrl];

  let res;
  try {
    console.time('fetchRemix')
    res = await got.get(remixUrl, {
      headers: {
        ...(cachedEtag && {
          ['If-None-Match']: cachedEtag
        })
      }
    });
  } finally {
    console.timeEnd('fetchRemix')
  }

  const { etag } = res.headers
  let remix;

  if (res.statusCode === 304 || (etag && (cachedEtag === etag))) {
    remix = cachedRemixes[cachedEtag];
  } else {
    try {
      console.time('requireRemix');
      remix = (await requireFromString(res.body, `remix/${etag || Date.now()}`)).default;
      if (etag) {
        cachedEtags[remixUrl] = etag;
        cachedRemixes[etag] = remix;
      } else {
        delete cachedEtags[remixUrl];
      }
    } finally {
      console.timeEnd('requireRemix');
    }
  }
  return remix;
};

const getRequestOrigin = (req: functions.Request) =>
  `${req.headers["x-forwarded-proto"] || "http"}://${req.headers["x-forwarded-host"]}`;


const onRequest = async (req: functions.Request, res: functions.Response) => {
  try {
    const origin = getRequestOrigin(req);
    const remix = await getRemix(origin);
    try {
      console.time('remix');
      remix(req, res);
    } finally {
      console.timeEnd('remix')
    }
  } catch (err) {
    functions.logger.error(new Error(`${err}`));
    res.sendStatus(500);
  }
};

export default onRequest;
