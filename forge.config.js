// Packages dist/ (built with --mode desktop) and electron/ only, with electron-forge as INAV Configurator
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const description =
  "Blackbox log viewer for the open source flight controller software INAV.";

function packaged(file) {
  return (
    file === "" ||
    file === "/package.json" ||
    /^\/(dist|electron)(\/|$)/.test(file)
  );
}

export default {
  packagerConfig: {
    name: "INAV Blackbox Explorer",
    executableName: "inav-blackbox-explorer",
    icon: path.join(here, "assets", "desktop", "inav"),
    asar: true,
    // offered under Open With in the Finder, without becoming the default for every .txt
    extendInfo: {
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: "Blackbox log",
          CFBundleTypeRole: "Viewer",
          LSHandlerRank: "Alternate",
          CFBundleTypeExtensions: ["txt", "bbl", "bfl"],
        },
      ],
    },
    ignore: (file) => !packaged(file.replaceAll("\\", "/")),
  },
  hooks: {
    // the names INAV Configurator gives its packages; without it both MacOS dmgs are INAV-Blackbox-Explorer.dmg
    postMake: async (forgeConfig, makeResults) => {
      for (const result of makeResults) {
        const base =
          `INAV-Blackbox-Explorer_${result.platform}_${result.arch}_${result.packageJSON.version}`
            .replace("_win32_ia32", "_Win32")
            .replace("_win32_x64", "_Win64")
            .replace("_darwin", "_MacOS");
        result.artifacts = result.artifacts.map((artifact) => {
          const renamed = path.join(
            path.dirname(artifact),
            base + path.extname(artifact),
          );
          fs.renameSync(artifact, renamed);
          return renamed;
        });
      }
      return makeResults;
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32", "linux", "darwin"],
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        // same name and volume title, no spaces: see INAV Configurator's forge.config.js
        name: "INAV-Blackbox-Explorer",
        title: "INAV-Blackbox-Explorer",
        background: "./assets/desktop/dmg-background.png",
        icon: "./assets/desktop/inav.icns",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          name: "inav-blackbox-explorer",
          productName: "INAV Blackbox Explorer",
          categories: ["Utility"],
          icon: "./public/images/pwa/inav_icon_512.png",
          description,
          homepage: "https://github.com/iNavFlight/blackbox-log-viewer",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          name: "inav-blackbox-explorer",
          productName: "INAV Blackbox Explorer",
          license: "GPL-3.0",
          categories: ["Utility"],
          icon: "./public/images/pwa/inav_icon_512.png",
          description,
          homepage: "https://github.com/iNavFlight/blackbox-log-viewer",
        },
      },
    },
  ],
};
