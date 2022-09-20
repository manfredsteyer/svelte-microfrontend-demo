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
      const modified = enhanceFile(file, content);

      res.write(modified);
      res.end();
      return;
    }

    next();
  };
}

function enhanceFile(fileName: string, src: string): string {
  if (fileName.endsWith('remoteEntry.json')) {
    return `
    {
      "name": "remote",
      "shared": [
        {
          "packageName": "rxjs",
          "outFileName": "rxjs-7_5_6-3beec0fe6449b1ff30137e7b06bf58ee.js",
          "requiredVersion": "^7.5.6",
          "singleton": true,
          "strictVersion": true,
          "version": "7.5.6",
          "debug": {
            "entryPoint": "node_modules/rxjs/dist/esm5/index.js"
          }
        },
        {
          "packageName": "shared",
          "outFileName": "shared-94190ba142405e9a2531d8deea30176c.js",
          "requiredVersion": "",
          "singleton": true,
          "strictVersion": false,
          "version": "",
          "debug": {
            "entryPoint": "../shared/shared.ts"
          }
        }
      ],
      "exposes": [
        {
          "key": "./remote-app",
          "--outFileName": "src/App.svelte",
          "outFileName": "@fs/c:/temp/svelte-microfrontend-demo/remote/src/App.svelte",

          "debug": {
            "localPath": "c:/temp/svelte-microfrontend-demo/remote/src/App.svelte"
          }
        }
      ]
    }    
    `;
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