import {
  BuildHelperParams,
  federationBuilder,
} from "@softarc/native-federation/build.js";
import * as path from "path";
import * as fs from "fs";
import { Connect, ViteDevServer } from "vite";
import mime from 'mime-types';
import { devExternalsMixin } from './dev-externals-mixin';

export async function federation(params: BuildHelperParams) {
  return {
    name: "init-federation", // required, will show up in warnings and errors
    async options(o: unknown) {
      await federationBuilder.init(params);
      // console.log('fconf', federationBuilder.config);
      o["external"] = federationBuilder.externals;
    },
    // async config(config, env) {
    //   console.log('config', config);
    //   console.log('env', env);
    // },
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
    ...devExternalsMixin

  };
}

function serveFromDist(dist: string): Connect.NextHandleFunction {
  return (req, res, next) => {

    if (!req.url || req.url.endsWith("/index.html")) {
      next();
      return;
    }

    const file = path.join(dist, req.url);
    if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', mime.lookup(req.url));
      
      const content = fs.readFileSync(file, "utf-8");
      const modified = enhanceFile(dist, file, content);

      res.write(modified);
      res.end();
      return;
    }

    next();
  };
}

function enhanceFile(dist: string, fileName: string, src: string): string {
	if (fileName.endsWith('remoteEntry.json')) {
		let remoteEntry = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    // we can use this or pass dist into method params
    // const dist = path.dirname(fileName);
		remoteEntry = {
      ...remoteEntry,
      shared: (remoteEntry.shared || []).map((el) => 
        ({ ...el, outFileName: `@fs${dist}/${path.basename(el.outFileName)}` })),
      exposes: (remoteEntry.exposes || []).map((el) => 
        ({ ...el, outFileName: `@fs${dist}/${path.basename(el.outFileName)}` })),
    };
    // console.log('fileNames',remoteEntry)
		return JSON.stringify(remoteEntry);
	}
	return src;
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