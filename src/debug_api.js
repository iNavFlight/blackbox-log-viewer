// window.inavDebug drives the viewer from scripts; only in a dev build or with ?debug, where alerts are collected
import pinia from "./pinia_instance.js";
import { useAppStore } from "./stores/app.js";
import { useLogStore } from "./stores/log.js";
import { useGraphStore } from "./stores/graph.js";
import { setCurrentBlackboxTime } from "./playback_controls.js";
import { FlightLogFieldPresenter } from "./flightlog_fields_presenter.js";
import { DarkTheme } from "./dark_theme.js";

function waitFor(condition, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const end = Date.now() + timeoutMs;
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() > end) {
        reject(new Error("timeout"));
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

// JSON-safe copy: typed arrays become arrays, functions and cycles are dropped
function plain(value, depth = 0) {
  if (value === null || typeof value !== "object") {
    return typeof value === "function" ? undefined : value;
  }
  if (depth > 4) {
    return undefined;
  }
  if (ArrayBuffer.isView(value) || Array.isArray(value)) {
    return Array.from(value, (v) => plain(v, depth + 1));
  }
  const out = {};
  for (const key in value) {
    out[key] = plain(value[key], depth + 1);
  }
  return out;
}

export function installDebugApi() {
  if (
    !import.meta.env.DEV &&
    !new URLSearchParams(location.search).has("debug")
  ) {
    return;
  }
  const app = useAppStore(pinia);
  const log = useLogStore(pinia);
  const graph = useGraphStore(pinia);
  const messages = [];
  const flightLog = () => log.flightLog;

  globalThis.alert = (text) =>
    messages.push({ kind: "alert", text: String(text) });
  globalThis.addEventListener("error", (e) =>
    messages.push({ kind: "error", text: String(e.message) }),
  );
  globalThis.addEventListener("unhandledrejection", (e) =>
    messages.push({ kind: "rejection", text: String(e.reason) }),
  );

  const api = {
    messages,

    async loadUrl(url, name) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`);
      }
      return api.loadBytes(
        await response.arrayBuffer(),
        name ?? url.split(/[\\/=]/).pop(),
      );
    },

    async loadBase64(base64, name) {
      return api.loadBytes(
        Uint8Array.from(atob(base64), (c) => c.codePointAt(0)),
        name,
      );
    },

    async loadBytes(bytes, name = "debug.TXT") {
      const previous = log.flightLog;
      app.loadFiles([new File([bytes], name)]);
      await waitFor(
        () => log.flightLog && log.flightLog !== previous && log.maxTime > 0,
      );
      return api.state();
    },

    state() {
      const f = flightLog();
      if (!f) {
        return { loaded: false, messages };
      }
      const sc = f.getSysConfig();
      return {
        loaded: true,
        file: app.logFilename,
        logCount: f.getLogCount(),
        logIndex: log.activeLogIndex,
        firmwareType: sc.firmwareType,
        firmware: [sc.firmware, sc.firmwareVersion, sc.firmwareRevision]
          .filter(Boolean)
          .join(" "),
        board: sc.boardInformation ?? "",
        craftName: sc.craftName ?? "",
        minTime: f.getMinTime(),
        maxTime: f.getMaxTime(),
        time: log.currentBlackboxTime,
        fieldCount: f.getMainFieldCount(),
        status: {
          version: app.statusVersion,
          looptime: app.statusLooptime,
          flightMode: app.statusFlightMode,
        },
        graphs: (graph.graphConfig ?? []).map((g) => ({
          label: g.label,
          fields: g.fields.map((x) => x.name),
        })),
        messages,
      };
    },

    logs() {
      const f = flightLog();
      const out = [];
      for (let i = 0; i < (f?.getLogCount() ?? 0); i++) {
        out.push({ index: i, error: f.getLogError(i) || null });
      }
      return out;
    },

    async selectLog(index) {
      graph.selectLogIndex(index);
      await waitFor(
        () =>
          log.activeLogIndex === index ||
          flightLog()?.getLogIndex?.() === index,
        5000,
      ).catch(() => {});
      return api.state();
    },

    fields() {
      return flightLog()?.getMainFieldNames() ?? [];
    },

    header() {
      return plain(flightLog()?.getSysConfig() ?? {});
    },

    // time: microseconds of log time; a number between 0 and 1 is a fraction of the log
    seek(time) {
      const f = flightLog();
      const t =
        time >= 0 && time <= 1
          ? f.getMinTime() + time * (f.getMaxTime() - f.getMinTime())
          : time;
      setCurrentBlackboxTime(t);
      return log.currentBlackboxTime;
    },

    // Raw and displayed value of each field at a time (default: now, all fields)
    values(names, time) {
      const f = flightLog();
      if (!f) {
        return {};
      }
      const frame = f.getFrameAtTime(time ?? log.currentBlackboxTime);
      const out = {};
      for (const name of names ?? f.getMainFieldNames()) {
        const i = f.getMainFieldIndexByName(name);
        const raw = i === undefined || !frame ? undefined : frame[i];
        out[name] = {
          raw,
          shown:
            raw === undefined
              ? ""
              : FlightLogFieldPresenter.decodeFieldToFriendly(f, name, raw),
        };
      }
      return out;
    },

    // Distinct values of each field over the whole log, with the first time each appears and how it is shown
    distinct(names, limit = 30) {
      const f = flightLog();
      const out = {};
      const indexes = names
        .map((n) => [n, f.getMainFieldIndexByName(n)])
        .filter(([, i]) => i !== undefined);
      for (const [name] of indexes) {
        out[name] = new Map();
      }
      for (const chunk of f.getChunksInTimeRange(
        f.getMinTime(),
        f.getMaxTime(),
      )) {
        for (const frame of chunk.frames) {
          for (const [name, i] of indexes) {
            const seen = out[name];
            if (!seen.has(frame[i]) && seen.size < limit) {
              seen.set(frame[i], frame[0 + f.getMainFieldIndexByName("time")]);
            }
          }
        }
      }
      return Object.fromEntries(
        Object.entries(out).map(([name, seen]) => [
          name,
          [...seen].map(([raw, time]) => ({
            raw,
            time,
            shown: FlightLogFieldPresenter.decodeFieldToFriendly(f, name, raw),
          })),
        ]),
      );
    },

    setGraphs(config) {
      app.newGraphConfig(config, true);
      return api.state().graphs;
    },

    // "dark", "light" or "auto" (follow the system); returns whether the dark theme is on
    theme(mode) {
      DarkTheme.setMode(
        DarkTheme.modes[{ dark: "ON", light: "OFF", auto: "AUTO" }[mode]],
      );
      return DarkTheme.enabled;
    },
  };
  globalThis.inavDebug = api;
}
