# Remix on Firebase Functions using a hosted bundle

This is a proof-of-concept implementation of deploying Remix apps to Firebase Functions using a bundle hosted on Firebase Hosting.

## How does it work
1. Remix App is built
2. The server code, along with the request handler, is bundled into a single js file using esbuild
3. The server bundle is uploaded to Firebase hosting with all other browser assets
4. HTTP-triggered Firebase Function is deployed with Firebase Hosting proxying requests to it.
5. The fetches the server bundle from Firebase Hosting that proxied the request
6. The bundle is parsed and the resulting Remix request handler is used as usual to serve the request.

## Motivation

### Quick deployments
To update the Remix app you only need to build, bundle and deploy it to Firebase Hosting. The Hosting deployments are much faster than Function deployments.

### Always fresh Remix code
Static browser assets are always in sync with the Remix app as they are deployed simultaneously.

### Support for preview channels
Firebase Hosting has preview channels - automatically generated Hosting sites that you can use to deploy and test new versions of the app without affecting the main site, which is especially handy for pull-request previews. Hosted bundle approach automatically supports preview channels, no need to redeploy or deploy multiple functions for each preview channel.

### Support for rollbacks
Firebase Hosting supports one-click rollbacks - you can instantly switch to a different version, as long as it's still retained. With hosted bundle approach the Remix app is rolled back with your hosting rollback.

## Caveats

### Extra latency
This approach adds additional latency due to bundle fetching and parsing. In a steady state with the majority of requests hitting warm function instances with cached responses the extra latency is 14ms at least (round trip to Google CDN from within the function instance), with cold instances it adds at least 500ms on top of the usual cold start time.

### Hosting bandwith costs
The server bundle is usually quite chunky, so this may add something to your Hosting bill. In a steady-state operation with a trivial caching the cost should be marginal.

## Potential improvements
It is possible to mitigate the extra latency for fetching/checking the server bundle. Because in a real application 99% of all requests will always result in using the same Remix bundle version, it is possible to cache it based on the origin and use the cached version for optimistic rendering while revalidating the cache. The optimistic result could be served as-is or it could be discarded and re-rendered with the fresh version in case of missmatch.