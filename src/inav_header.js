// INAV header lines and the INAV lookup tables that depend on the firmware release
import semver from "semver";
import { INAV_VERSIONED_TABLES } from "./inav_defs.js";

// "60" -> 60, "33,35,42" -> [33, 35, 42], anything else stays text
export function parseInavHeaderValue(text) {
  const parts = text.split(",").map((p) => p.trim());
  if (parts.every((p) => p !== "" && Number.isFinite(Number(p)))) {
    return parts.length === 1 ? Number(parts[0]) : parts.map(Number);
  }
  return text;
}

// The spectrum analyser reads Betaflight's header names; dterm_lpf_hz and yaw_lpf_hz are shared already
export function inavAnalyserFilters(sysConfig) {
  return {
    gyro_lowpass_hz: sysConfig.gyro_lpf_hz ?? null,
    gyro_soft_type: sysConfig.gyro_lpf_type ?? null,
    dterm_filter_type: sysConfig.dterm_lpf_type ?? null,
  };
}

// Tables (settings.yaml lookups, feature names) of the newest release not newer than the log's
export function inavTablesFor(firmwareVersion) {
  const version = semver.valid(semver.coerce(firmwareVersion));
  let chosen = INAV_VERSIONED_TABLES[INAV_VERSIONED_TABLES.length - 1];
  if (version) {
    for (const tables of INAV_VERSIONED_TABLES) {
      if (semver.gte(version, tables.from)) {
        chosen = tables;
      }
    }
  }
  return chosen;
}
