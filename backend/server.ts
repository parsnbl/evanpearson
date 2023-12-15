import path from "node:path";
import fs from "node:fs";
import url from "node:url";

// import chokidar from "chokidar";
import express, {Request, Response, NextFunction} from "express";
import sourceMapSupport from "source-map-support";

import { createRequestHandler, type RequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import type { ServerBuild } from "@remix-run/node";

// patch in Remix runtime globals
sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    // get source file without the `file://` prefix or `?t=...` suffix
    const match = source.match(/^file:\/\/(.*)\?t=[.\d]+$/);
    if (match) {
      return {
        url: source,
        map: fs.readFileSync(`${match[1]}.map`, "utf8"),
      };
    }
    return null;
  },
});
installGlobals();


const BUILD_PATH = path.resolve("./build/index.js");
const VERSION_PATH = path.resolve("./build/version.txt");
const initialBuild = await reimportServer();
const PORT = 8000;


// notice that the result of `remix build` is "just a module"

async function reimportServer(): Promise<ServerBuild> {
  const stat = fs.statSync(BUILD_PATH);

   // convert build path to URL for Windows compatibility with dynamic `import`
   const BUILD_URL = url.pathToFileURL(BUILD_PATH).href;

   // use a timestamp query parameter to bust the import cache
   return import(BUILD_URL + "?t=" + stat.mtimeMs);
}

// We'll make chokidar a dev dependency so it doesn't get bundled in production.
const chokidar = process.env.NODE_ENV === "development" 
  ? await import("chokidar") 
  : null;



function createDevRequestHandler(initialBuild: ServerBuild) {
  let build: ServerBuild = initialBuild;
  async function handleServerUpdate() {
    // 1. re-import the server build
    build = await reimportServer();
    // 2. tell Remix that this app server is now up-to-date and ready
    broadcastDevReady(build);
  }
  chokidar
    .watch(VERSION_PATH, { ignoreInitial: true})
    .on("add", handleServerUpdate)
    .on("change", handleServerUpdate)
   // wrap request handler to make sure its recreated with the latest build for every request
   return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return createRequestHandler({
        build,
        mode: "development",
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}






const app = express();

app.disable("x-powered-by");

// We'll make chokidar a dev dependency so it doesn't get bundled in production.
// const chokidar =
//   process.env.NODE_ENV === "development" ? require("chokidar") : null;

app.use(express.static("public"));

// and your app is "just a request handler"
app.all(
  "*",
  process.env.NODE_ENV === "development"
    ? createDevRequestHandler(initialBuild)
    : createRequestHandler({
        build: initialBuild,
        mode: initialBuild.mode,
      })
);

app.listen(PORT, () => {
  console.log(`🚀 Express server started on port ${PORT}`);
  if (process.env.NODE_ENV === "development") {
    console.log('Dev town!')
    broadcastDevReady(initialBuild);
  }
});
