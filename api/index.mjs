// Vercel serverless entry point for Angular SSR.
//
// Vercel's Angular framework preset only serves the static `browser/` output
// and never deploys the `server/` bundle, so on-demand routes (RenderMode.Server)
// 404 on direct load. This function bridges Vercel to the Angular server engine:
// vercel.json rewrites every non-static path here, and we hand the request to
// `reqHandler` (createNodeRequestHandler) exported by src/server.ts.
//
// The import is deferred to runtime so Vercel's build-time file tracing doesn't
// try to resolve dist/ (a build artifact) before `ng build` has produced it.
export default async (req, res) => {
  const { reqHandler } = await import('../dist/Civica/server/server.mjs');
  return reqHandler(req, res);
};
