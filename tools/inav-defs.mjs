// Regenerates src/inav_defs.js from INAV's sources: node tools/inav-defs.mjs PATH_TO_INAV_REPO [GIT_REV]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const [repo, rev = "HEAD"] = process.argv.slice(2);
if (!repo) {
  console.error("usage: node tools/inav-defs.mjs PATH_TO_INAV_REPO [GIT_REV]");
  process.exit(1);
}
const show = (file) =>
  execFileSync("git", ["-C", repo, "show", `${rev}:${file}`], {
    encoding: "utf8",
  });
const revision = execFileSync(
  "git",
  ["-C", repo, "rev-parse", "--short", rev],
  { encoding: "utf8" },
).trim();

// Values of a C enum that ends with "} name;"; handles "= N", "= (1 << N)" and implicit increments
function readEnum(source, name) {
  const end = source.search(new RegExp(`\\}\\s*${name}\\s*;`));
  if (end < 0) {
    throw new Error(`enum ${name} not found`);
  }
  const start = source.lastIndexOf("typedef enum", end);
  const body = source
    .slice(source.indexOf("{", start) + 1, end)
    .replaceAll(/\/\*[\s\S]*?\*\//g, "")
    .replaceAll(/\/\/.*$/gm, "");
  const values = new Map();
  let next = 0;
  for (const item of body.split(",")) {
    const text = item.trim();
    if (!text || text.startsWith("#")) {
      continue;
    }
    const [key, expr] = text.split("=").map((s) => s?.trim());
    let value = next;
    if (expr !== undefined) {
      const shift = /^\(?\s*1\s*<<\s*(\d+)\s*\)?$/.exec(expr);
      value = shift ? 2 ** Number(shift[1]) : Number(expr);
    }
    if (Number.isFinite(value)) {
      values.set(key, value);
      next = value + 1;
    }
  }
  return values;
}

// Array indexed by value (or by bit number for flags), holes left as null
function table(values, { prefix = "", flags = false, rename = (n) => n } = {}) {
  const out = [];
  for (const [key, value] of values) {
    const index = flags ? Math.log2(value) : value;
    if (!Number.isInteger(index) || index < 0 || index > 255) {
      continue;
    }
    out[index] = rename(key.replace(prefix, ""));
  }
  return Array.from(out, (v) => v ?? null);
}

const rcModes = show("src/main/fc/rc_modes.h");
const runtime = show("src/main/fc/runtime_config.h");
const boxIds = readEnum(rcModes, "boxId_e");
boxIds.delete("CHECKBOX_ITEM_COUNT");

// The names the Configurator's Modes tab shows, from the firmware's MSP box table
const boxNames = new Map();
for (const m of show("src/main/fc/fc_msp_box.c").matchAll(
  /\.boxId\s*=\s*(BOX\w+),\s*\.boxName\s*=\s*"([^"]+)"/g,
)) {
  boxNames.set(m[1], m[2]);
}
const rcModeNames = [];
for (const [key, value] of boxIds) {
  rcModeNames[value] = boxNames.get(key) ?? key.replace(/^BOX/, "");
}

// Removed from the firmware but present in older logs
const LEGACY = { rcMode: { 23: "KILLSWITCH" } };
for (const [value, name] of Object.entries(LEGACY.rcMode)) {
  rcModeNames[value] ??= name;
}

const tables = {
  INAV_RC_MODE_NAMES: Array.from(rcModeNames, (v) => v ?? null),
  INAV_FLIGHT_MODE_NAMES: table(readEnum(runtime, "flightModeFlags_e"), {
    flags: true,
    rename: (n) => n.replace(/_MODE$/, "").replaceAll("_", " "),
  }),
  INAV_STATE_FLAG_NAMES: table(readEnum(runtime, "stateFlags_t"), {
    flags: true,
  }),
  INAV_ARMING_FLAG_NAMES: table(readEnum(runtime, "armingFlag_e"), {
    flags: true,
    prefix: "ARMING_DISABLED_",
  }),
  INAV_FAILSAFE_PHASE_NAMES: table(
    readEnum(show("src/main/flight/failsafe.h"), "failsafePhase_e"),
    {
      prefix: "FAILSAFE_",
    },
  ),
  INAV_NAV_STATE_NAMES: table(
    readEnum(
      show("src/main/navigation/navigation_private.h"),
      "navigationPersistentId_e",
    ),
    { prefix: "NAV_PERSISTENT_ID_" },
  ),
};

// navFlags is built bit by bit in navigation.c, not from an enum
const NAV_FLAGS = {
  estAltStatus: "ALT_TRUSTED",
  estAglStatus: "AGL_TRUSTED",
  estPosStatus: "POS_TRUSTED",
  isTerrainFollowEnabled: "TERRAIN_FOLLOWING",
  estHeadingStatus: "HEADING_TRUSTED",
  isAdjustingPosition: "ADJUSTING_POSITION",
  isAdjustingAltitude: "ADJUSTING_ALTITUDE",
  isAdjustingHeading: "ADJUSTING_HEADING",
};
const navFlagNames = [];
for (const m of show("src/main/navigation/navigation.c").matchAll(
  /posControl\.flags\.(\w+)[^\n]*navFlags \|= \(1 << (\d+)\)/g,
)) {
  navFlagNames[Number(m[2])] = NAV_FLAGS[m[1]] ?? m[1];
}
navFlagNames[4] ??= "GPS_GLITCH"; // until INAV 7
tables.INAV_NAV_FLAG_NAMES = Array.from(navFlagNames, (v) => v ?? null);

// hwHealthStatus: two bits per sensor in this order, values from hardwareSensorStatus_e
tables.INAV_HW_HEALTH_SENSORS = [
  "GYRO",
  "ACC",
  "MAG",
  "BARO",
  "GPS",
  "RANGEFINDER",
  "PITOT",
];
tables.INAV_HW_HEALTH_STATUS = table(
  readEnum(show("src/main/sensors/diagnostics.h"), "hardwareSensorStatus_e"),
  {
    prefix: "HW_SENSOR_",
  },
);

// Renumbered between releases (magnetometers in 9.0, MOTOR_STOP to GEOZONE in 8.0): kept per release
const VERSIONED = [
  ["7.0.0", "7.1.2"],
  ["8.0.0", "8.0.1"],
  ["9.0.0", "9.0.1"],
  ["9.1.0", "9.1.0"],
  ["10.0.0", rev],
];
const SETTINGS_TABLES = [
  "acc_hardware",
  "baro_hardware",
  "mag_hardware",
  "pitot_hardware",
  "rangefinder_hardware",
  "opflow_hardware",
  "serial_rx",
  "receiver_type",
  "motor_pwm_protocol",
  "debug_modes",
  "filter_type",
  "gyro_lpf",
  "filter_type_full",
  "current_sensor",
  "voltage_sensor",
  "platform_type",
];

function settingsTables(yaml) {
  const section = yaml.split(/^tables:/m)[1].split(/^groups:/m)[0];
  const out = {};
  for (const m of section.matchAll(
    /- name: (\w+)\s*\n\s*values: \[([\s\S]*?)\]/g,
  )) {
    if (SETTINGS_TABLES.includes(m[1])) {
      out[m[1]] = m[2]
        .split(",")
        .map((v) => v.trim().replaceAll('"', ""))
        .filter(Boolean);
    }
  }
  return out;
}

function featureNames(cli) {
  const body = /featureNames\[\] = \{([\s\S]*?)\};/.exec(cli)?.[1] ?? "";
  return Array.from(body.matchAll(/"([^"]*)"/g), (m) => m[1] || null);
}

const versioned = VERSIONED.map(([from, versionRev]) => {
  const read = (file) =>
    execFileSync("git", ["-C", repo, "show", `${versionRev}:${file}`], {
      encoding: "utf8",
    });
  return {
    from,
    ...settingsTables(read("src/main/fc/settings.yaml")),
    features: featureNames(read("src/main/fc/cli.c")),
  };
});

let js = `// Generated by tools/inav-defs.mjs from INAV ${revision}: do not edit, run the tool again.\n`;
js += `export const INAV_DEFS_REVISION = "${revision}";\n`;
for (const [name, values] of Object.entries(tables)) {
  js += `\nexport const ${name} = Object.freeze(${JSON.stringify(values, null, 2)});\n`;
}
js += `\n// Per release, oldest first: use the last entry whose "from" is not newer than the log's version\n`;
js += `export const INAV_VERSIONED_TABLES = Object.freeze(${JSON.stringify(versioned, null, 2)});\n`;
const target = fileURLToPath(new URL("../src/inav_defs.js", import.meta.url));
// in the project's style, so eslint (comma-dangle) and "npm run format" leave it alone
writeFileSync(target, await format(js, { filepath: target }));
console.log(
  `${target}: ${Object.keys(tables).length} tables from INAV ${revision}`,
);
