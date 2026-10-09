import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Dev server only: /__debug/file?path= hands logs under DEBUG_LOG_ROOT to window.inavDebug.loadUrl()
function debugFiles() {
  return {
    name: "inav-debug-files",
    apply: "serve",
    configureServer(server) {
      const root = path
        .resolve(process.env.DEBUG_LOG_ROOT || process.cwd())
        .toLowerCase();
      server.middlewares.use("/__debug/file", (req, res) => {
        const file = path.resolve(
          new URL(req.url, "http://localhost").searchParams.get("path") || "",
        );
        if (!file.toLowerCase().startsWith(root + path.sep)) {
          res.statusCode = 403;
          res.end("outside DEBUG_LOG_ROOT");
          return;
        }
        fs.createReadStream(file)
          .on("error", () => {
            res.statusCode = 404;
            res.end();
          })
          .pipe(res);
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: true,
  },
  // electron-forge's packages: nothing for the dev server to watch, and locked files crash its watcher
  server: { watch: { ignored: ["**/out/**"] } },
  plugins: [
    debugFiles(),
    vue(),
    ui({
      colorMode: false,
      ui: {
        button: {
          slots: {
            base: "font-semibold cursor-pointer",
          },
          defaultVariants: {
            size: "sm",
          },
          compoundVariants: [
            {
              // white on INAV blue, darker on hover, as in the Configurator
              color: "primary",
              variant: "solid",
              class:
                "text-white hover:bg-primary-600 active:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600",
            },
          ],
        },
        tooltip: {
          slots: {
            content: "z-[300] ring-2 ring-primary max-w-sm lg:max-w-lg h-fit",
            arrow: "fill-primary",
            text: "whitespace-normal",
          },
        },
        switch: {
          slots: {
            base: "cursor-pointer",
          },
          defaultVariants: {
            size: "sm",
          },
        },
        select: {
          slots: {
            base: "cursor-pointer",
            item: "cursor-pointer",
          },
          defaultVariants: {
            size: "sm",
          },
        },
        input: {
          defaultVariants: {
            size: "sm",
          },
        },
        inputNumber: {
          slots: {
            root: "min-w-12",
            base: "appearance-none",
          },
          defaultVariants: {
            size: "sm",
          },
        },
        modal: {
          slots: {
            overlay: "z-[200]",
            content: "z-[200]",
          },
        },
        colors: {
          primary: "primary",
          neutral: "neutral",
          success: "lime",
          warning: "orange",
        },
      },
    }),
    VitePWA({
      // the desktop app (electron/, vite build --mode desktop) is installed already and serves its own files
      disable: mode === "desktop",
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,mcm,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: pkg.displayName,
        short_name: pkg.productName,
        description: pkg.description,
        theme_color: "#3d3f3e",
        icons: [
          {
            src: "/images/pwa/inav_icon_128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/images/pwa/inav_icon_192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/images/pwa/inav_icon_512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        file_handlers: [
          {
            action: "/",
            accept: {
              "application/octet-stream": [".bbl", ".bfl", ".txt"],
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: fileURLToPath(
        new URL("./node_modules/vue/dist/vue.esm-bundler.js", import.meta.url),
      ),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
}));
