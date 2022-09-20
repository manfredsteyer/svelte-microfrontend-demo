import { federationBuilder } from "@softarc/native-federation/build.js";
import { ConfigEnv } from 'vite';

// see: https://github.com/vitejs/vite/issues/6393#issuecomment-1006819717

let _env;

export function getEnv(): ConfigEnv {
  return _env;
}

export const devExternalsMixin = {
    enforce: "pre",

    config(config, env) {
      _env = env;
      config.optimizeDeps = {
          ...(config.optimizeDeps ?? {}),
          exclude: [...(config.optimizeDeps?.exclude ?? []), ...federationBuilder.externals],
        };
    },
    
      configResolved(resolvedConfig) {
        const VALID_ID_PREFIX = `/@id/`;
        const reg = new RegExp(
          `${VALID_ID_PREFIX}(${federationBuilder.externals.join("|")})`,
          "g"
        );
        resolvedConfig.plugins.push({
          name: "vite-plugin-ignore-static-import-replace-idprefix",
          transform: (code) =>
            reg.test(code) ? code.replace(reg, (m, s1) => s1) : code,
        });
      },
    
      resolveId: (id) => {
        if (federationBuilder.externals.includes(id)) {
          return { id, external: true };
        }
      },
} as any;
