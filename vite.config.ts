import { defineConfig, type PluginOption } from "vite";
import path from "node:path";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig(({ command }) => {
  const plugins: PluginOption[] = [
    ...(command === "build"
      ? [
          paraglideVitePlugin({
            project: "./project.inlang",
            outdir: "./generated/paraglide",
          }),
        ]
      : []),
    devtools(),
    nitro(),
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
    // See https://github.com/TanStack/router/issues/5738
    resolve: {
      alias: [
        {
          find: "@paraglide",
          replacement: path.resolve(__dirname, "generated/paraglide"),
        },
        { find: "use-sync-external-store/shim/index.js", replacement: "react" },
      ],
    },
  };
});

export default config;
