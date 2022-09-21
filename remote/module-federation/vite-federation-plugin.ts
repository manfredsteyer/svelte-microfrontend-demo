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
      o["external"] = federationBuilder.externals;
    },
    async closeBundle() {
      await federationBuilder.build();
    },
    async configureServer(server: ViteDevServer) {
      await configureDevServer(server, params);
    },
    transformIndexHtml(html: string) {
      return html.replace(/type="module"/g, 'type="module-shim"');
    },
    ...devExternalsMixin
  }
}

async function configureDevServer(server: ViteDevServer, params: BuildHelperParams) {
  await federationBuilder.build({
    skipExposed: true,
    skipMappings: true
  });

  const op = params.options;
  const dist = path.join(op.workspaceRoot, op.outputPath);
  server.middlewares.use(serveFromDist(dist));

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
        ({ ...el, outFileName: el.dev?.entryPoint.includes('/node_modules/') ? el.outFileName : normalize(path.join('@fs', el.dev?.entryPoint || '')) })),
      // load from node_modules --> ({ ...el, outFileName: `@fs${el.debug?.entryPoint}` })),
      // if we load files from node_modules, commonjs pkg are not "parsed" by esbuildCommonjs plugin
      exposes: (remoteEntry.exposes || []).map((el) => 
        ({ ...el, outFileName: normalize(path.join('@fs', el.dev?.entryPoint || '')) })),
    };
    // console.log('fileNames',remoteEntry)
		return JSON.stringify(remoteEntry, null, 2);
	}
	return src;
}

function normalize(path: string): string {
  return path.replace(/\\/g, '/');
}
