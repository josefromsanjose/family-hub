import { defineConfig, type PluginOption } from "vite";
import path from "node:path";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const paraglideDir = path.resolve(__dirname, "generated/paraglide");

const config = defineConfig(() => {
  const plugins: PluginOption[] = [
    // Paraglide is compiled via CLI (npm run i18n:compile) before vite build
    // to avoid issues with the vite plugin on different platforms
    devtools(),
    nitro({
      // Ensure paraglide modules are bundled into the serverless function
      rollupConfig: {
        external: [],
      },
      alias: {
        "@paraglide": paraglideDir,
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ];

  return {
    plugins,
    resolve: {
      alias: [
        {
          find: "@paraglide",
          replacement: paraglideDir,
        },
        { find: "use-sync-external-store/shim/index.js", replacement: "react" },
      ],
    },
  };
});

export default config;
