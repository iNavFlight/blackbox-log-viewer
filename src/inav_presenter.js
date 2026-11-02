// INAV fields shown with the firmware's own names; the tables come from tools/inav-defs.mjs (src/inav_defs.js)
import {
  INAV_RC_MODE_NAMES,
  INAV_FLIGHT_MODE_NAMES,
  INAV_STATE_FLAG_NAMES,
  INAV_FAILSAFE_PHASE_NAMES,
  INAV_NAV_STATE_NAMES,
  INAV_NAV_FLAG_NAMES,
  INAV_HW_HEALTH_SENSORS,
  INAV_HW_HEALTH_STATUS,
} from "./inav_defs.js";
import { DEBUG_MODE } from "./flightlog_fielddefs.js";

// INAV debug modes whose fields have names and units of their own (docs/Blackbox.md); the others stay "debug[n]
// (MODE)" with the value as logged, since INAV's modes share Betaflight's names but not their contents
const INAV_DEBUG_FIELDS = {
  RPM_FILTER: {
    label: "RPM filter",
    names: Array.from({ length: 8 }, (_, i) => `Motor ${i + 1} RPM`),
    // eRPM / 100 as logged, like Betaflight's eRPM[] fields; motor_poles is in the same firmware's header
    // (the parser reads a missing one as 1)
    decode: (index, value, sysConfig) =>
      `${((value * 200) / (sysConfig?.motor_poles > 1 ? sysConfig.motor_poles : 14)).toFixed(0)} rpm`,
    // One graph scale for all the motors
    curveFields: () => Array.from({ length: 8 }, (_, i) => `debug[${i}]`),
  },
  DYN_IDLE: {
    label: "Dynamic idle",
    names: ["Idle P", "Idle I", "Idle D", "Slowest motor"],
    // P, I and D in 0.0001 of the motor range; the slowest motor in 0.1 Hz
    decode: (index, value) =>
      index === 3
        ? `${(value / 10).toFixed(1)} Hz / ${Math.round(value * 6)} rpm`
        : `${(value / 100).toFixed(2)} % of range`,
    // P, I and D on one scale, the slowest motor on its own
    curveFields: (index) =>
      index < 3 ? ["debug[0]", "debug[1]", "debug[2]"] : [`debug[${index}]`],
  },
};

// The index of a debug[n] field under an INAV debug mode with its own names, or undefined
function inavDebugFieldIndex(fieldName, spec) {
  const index = /^debug\[(\d+)\]$/.exec(fieldName)?.[1];
  return index !== undefined && spec.names[Number(index)] !== undefined
    ? Number(index)
    : undefined;
}

// The fields an INAV debug field shares its default graph scale with, or undefined
export function inavDebugCurveFields(fieldName, debugModeName) {
  const spec = INAV_DEBUG_FIELDS[debugModeName];
  const index = spec && inavDebugFieldIndex(fieldName, spec);
  return index === undefined ? undefined : spec.curveFields(index);
}

// The field's name under an INAV debug mode with its own names, or undefined
export function inavDebugFieldName(fieldName, debugModeName) {
  const spec = INAV_DEBUG_FIELDS[debugModeName];
  if (!spec) {
    return undefined;
  }
  if (fieldName === "debug[all]") {
    return spec.label;
  }
  const index = /^debug\[(\d+)\]$/.exec(fieldName)?.[1];
  return index === undefined ? undefined : spec.names[Number(index)];
}

// Names of the set bits; offset is the bit number of bit 0 (flightModeFlags2 carries RC modes 32-63)
function presentBits(value, names, offset = 0) {
  const set = [];
  for (let bit = 0; bit < 32; bit++) {
    if ((value >>> bit) & 1) {
      set.push(names[bit + offset] ?? `BIT${bit + offset}`);
    }
  }
  return set.length ? set.join("|") : "NONE";
}

function presentValue(value, names) {
  return names[value] ?? String(value);
}

// Two bits per sensor; sensors that are not fitted (status NONE) are left out
function presentHwHealth(value) {
  const sensors = [];
  INAV_HW_HEALTH_SENSORS.forEach((sensor, index) => {
    const status = (value >>> (index * 2)) & 3;
    if (status) {
      sensors.push(`${sensor} ${INAV_HW_HEALTH_STATUS[status] ?? status}`);
    }
  });
  return sensors.length ? sensors.join(", ") : "NONE";
}

function altitude(meters, settings) {
  return settings.altitudeUnits === 2 ? `${(meters * 3.28).toFixed(2)} ft` : `${meters.toFixed(2)} m`;
}

function speed(metersPerSecond, settings) {
  switch (settings.speedUnits) {
    case 2:
      return `${(metersPerSecond * 3.6).toFixed(1)} km/h`;
    case 3:
      return `${(metersPerSecond * 2.2369).toFixed(1)} mph`;
    default:
      return `${metersPerSecond.toFixed(2)} m/s`;
  }
}

// Units INAV logs in: centivolts, centiamps, centimetres, cm/s, decidegrees, decidegrees C
function decodeInavUnits(flightLog, fieldName, value, settings) {
  const base = fieldName.replace(/\[\d+\]$/, "");
  const axis = /\[(\d+)\]$/.exec(fieldName)?.[1];
  switch (base) {
    case "gyroRaw":
    case "gyroRaw2":
    case "axisRate":
      return `${Math.round(value)} °/s`;
    case "rcCommand":
      // roll, pitch and yaw are a stick deflection around 0; throttle is a pulse width
      return axis === "3" ? `${value} us` : `${value}`;
    case "rcData":
    case "servo":
      return `${value} us`;
    // Mixer units (500 = 500 us of motor command), unitless as the INAV viewer always showed them
    case "axisP":
    case "axisI":
    case "axisD":
    case "axisF":
    case "axisSum":
    case "fwAltP":
    case "fwAltI":
    case "fwAltD":
    case "fwAltOut":
    case "fwPosP":
    case "fwPosI":
    case "fwPosD":
    case "fwPosOut":
    case "fwAutoSpeedP":
    case "fwAutoSpeedI":
    case "mcPosAxisP":
    case "mcVelAxisP":
    case "mcVelAxisI":
    case "mcVelAxisD":
    case "mcVelAxisFF":
    case "mcVelAxisOut":
    case "mcSurfaceP":
    case "mcSurfaceI":
    case "mcSurfaceD":
    case "mcSurfaceOut":
      return `${Math.round(value)}`;
    case "vbat":
    case "sagCompensatedVBat":
      return `${(value / 100).toFixed(2)} V`;
    case "amperage":
      return `${(value / 100).toFixed(2)} A`;
    case "BaroAlt":
    case "navPos":
    case "navTgtPos":
    case "navSurf":
    case "terrainAGL":
    case "terrainAMSL":
      return altitude(value / 100, settings);
    case "navEPH":
    case "navEPV":
      return `${(value / 100).toFixed(2)} m`;
    case "navVel":
    case "navTgtVel":
    case "wind":
      // the vertical component stays in m/s whatever the speed unit
      return axis === "2" ? `${(value / 100).toFixed(2)} m/s` : speed(value / 100, settings);
    case "AirSpeed":
      return speed(value / 100, settings);
    case "navTgtHdg":
      return `${(value / 100).toFixed(1)} °`;
    case "attitude":
      return `${(value / 10).toFixed(1)} °`;
    case "GPS_altitude":
      return altitude(value, settings);
    case "escTemperature":
      return `${value} °C`;
    case "IMUTemperature":
    case "baroTemperature":
    case "sens0Temp":
    case "sens1Temp":
    case "sens2Temp":
    case "sens3Temp":
    case "sens4Temp":
    case "sens5Temp":
    case "sens6Temp":
    case "sens7Temp":
      // -1250 marks a sensor that is not fitted
      return value === -1250 ? "" : `${(value / 10).toFixed(1)} °C`;
    case "escRPM":
      return `${value} rpm`;
    case "debug": {
      const sysConfig = flightLog?.getSysConfig();
      const spec = INAV_DEBUG_FIELDS[DEBUG_MODE[sysConfig?.debug_mode]];
      // Only the fields the mode names: the firmware leaves the others at 0
      return spec && axis !== undefined && spec.names[Number(axis)] !== undefined
        ? spec.decode(Number(axis), value, sysConfig)
        : `${value}`;
    }
    case "rxUpdateRate":
      return `${value} Hz`;
    default:
      return undefined;
  }
}

// Text for an INAV field, or undefined when the shared presenter already shows it correctly
export function decodeInavField(flightLog, fieldName, value, settings) {
  // GPS fields have no value before the first G frame
  if (value == null) {
    return "";
  }
  const withUnit = decodeInavUnits(flightLog, fieldName, value, settings);
  if (withUnit !== undefined) {
    return withUnit;
  }
  switch (fieldName) {
    case "flightModeFlags":
      return presentBits(value, INAV_RC_MODE_NAMES);
    case "flightModeFlags2":
      return presentBits(value, INAV_RC_MODE_NAMES, 32);
    case "activeFlightModeFlags":
      return presentBits(value, INAV_FLIGHT_MODE_NAMES);
    case "stateFlags":
      return presentBits(value, INAV_STATE_FLAG_NAMES);
    case "failsafePhase":
      return presentValue(value, INAV_FAILSAFE_PHASE_NAMES);
    case "navState":
      return presentValue(value, INAV_NAV_STATE_NAMES);
    case "navFlags":
      return presentBits(value, INAV_NAV_FLAG_NAMES);
    case "hwHealthStatus":
      return presentHwHealth(value);
    default:
      return undefined;
  }
}

// Graph scales in the legend's units (raw / scale); fields not listed keep Betaflight's conversion
const INAV_SCALE = {
  rcCommand: 1,
  axisP: 1,
  axisI: 1,
  axisD: 1,
  axisF: 1,
  axisSum: 1,
  vbat: 100,
  sagCompensatedVBat: 100,
  amperage: 100,
  BaroAlt: 100,
  navPos: 100,
  navTgtPos: 100,
  navSurf: 100,
  terrainAGL: 100,
  terrainAMSL: 100,
  navTgtHdg: 100,
  attitude: 10,
  GPS_altitude: 1,
  IMUTemperature: 10,
  baroTemperature: 10,
  escTemperature: 1,
  debug: 1,
};

// value in graph units (toFriendly) or back in log units, or undefined for Betaflight's conversion
export function convertInavField(fieldName, toFriendly, value) {
  const base = fieldName.replace(/\[\d+\]$/, "");
  const scale = /^sens\dTemp$/.test(base) ? 10 : INAV_SCALE[base];
  if (scale === undefined) {
    return undefined;
  }
  return toFriendly ? value / scale : value * scale;
}
