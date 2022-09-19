import {
  BuildHelperParams,
  federationBuilder,
} from "@softarc/native-federation/build.js";
import * as path from "path";
import * as fs from "fs";
import { Connect, ViteDevServer } from "vite";
import mime from 'mime-types';

export async function federation(params: BuildHelperParams) {
  return {
    name: "init-federation", // required, will show up in warnings and errors
    async options(o: unknown) {
      await federationBuilder.init(params);
      o["external"] = federationBuilder.externals;
    },
    async closeBundle() {
      await federationBuilder.build();
      transformIndexHtml(params);
    },
    async configureServer(server: ViteDevServer) {
      await federationBuilder.build();

      const op = params.options;
      const dist = path.join(op.workspaceRoot, op.outputPath);
      server.middlewares.use(serveFromDist(dist));
    },
  };
}

function serveFromDist(dist: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url || req.url.endsWith("index.html")) {
      next();
      return;
    }

    const file = path.join(dist, req.url);

    if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', mime.lookup(req.url));
      
      res.write(fs.readFileSync(file, "utf-8"));
      res.end();
      return;
    }

    next();
  };
}

function transformIndexHtml(params: BuildHelperParams): void {
  const filePath = path.join(
    params.options.workspaceRoot,
    params.options.outputPath,
    "index.html"
  );

  const html = fs.readFileSync(filePath, "utf-8");
  const modified = html.replace(/type="module"/g, 'type="module-shim"');
  fs.writeFileSync(filePath, modified);
}
