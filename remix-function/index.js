import { createRequestHandler } from "@remix-run/express";

export default createRequestHandler({ build: require('../build') });