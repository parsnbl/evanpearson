import { AppConfig } from '@remix-run/dev';

const config: AppConfig = {
  appDirectory: "./app",
  assetsBuildDirectory: "public/build",
  future: {
    /* any enabled future flags */
  },
  ignoredRouteFiles: ["**/.*"],
  publicPath: "/build/",
  // routes(defineRoutes) {
  //   return defineRoutes((route) => {
  //     route("/somewhere/cool/*", "catchall.tsx");
  //   });
  // },
  serverBuildPath: "build/index.js",

};

export default config;
