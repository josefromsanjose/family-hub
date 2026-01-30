import { defineConfig, type PluginOption } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig(() => {
  
  const plugins: PluginOption[] = [
    devtools(),
    nitro(),
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
        { find: "use-sync-external-store/shim/index.js", replacement: "react" },
      ],
    },
    server: {
      host: true,
      port: 3000,
    },
  };
});

export default config;
