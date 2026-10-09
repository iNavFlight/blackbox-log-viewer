// Units as blackbox.c's blackboxWriteSysinfo writes them, the same from INAV 7 to 10
import { inavTablesFor } from "./inav_header.js";

function param(name, value) {
  return { name, value: value ?? "-", missing: value == null };
}

function present(value) {
  return value != null && !Number.isNaN(value);
}

// value / scale with a unit, e.g. num(330, "V", 100, 2) -> "3.30 V"
function num(value, unit = "", scale = 1, decimals = 0) {
  if (!present(value)) {
    return null;
  }
  const text = (value / scale).toFixed(decimals);
  return unit ? `${text} ${unit}` : text;
}

// 0 switches these filters and limits off
function offOr(value, unit, scale = 1, decimals = 0) {
  return value === 0 ? "Off" : num(value, unit, scale, decimals);
}

function pick(value, list) {
  if (!present(value)) {
    return null;
  }
  return list?.[value] ?? String(value);
}

function onOff(value) {
  return present(value) ? (value ? "On" : "Off") : null;
}

function pidRow(label, values, withFeedforward = false) {
  if (!Array.isArray(values) || values.every((v) => v == null)) {
    return null;
  }
  return {
    label,
    p: values[0] ?? null,
    i: values[1] ?? null,
    d: values[2] ?? null,
    dMax: null,
    f: withFeedforward ? (values[3] ?? null) : null,
    missing: false,
  };
}

function only(params) {
  return params.filter((p) => !p.missing);
}

// The section each raw header line belongs to, for the "All Headers" list
export const INAV_HEADER_SECTIONS = {
  Product: "Log",
  "Data version": "Log",
  "I interval": "Log",
  "P interval": "Log",
  "Firmware type": "Log",
  "Firmware revision": "Log",
  "Firmware date": "Log",
  "Log start datetime": "Log",
  "Craft name": "Log",
  rollPID: "PID Settings",
  pitchPID: "PID Settings",
  yawPID: "PID Settings",
  levelPID: "PID Settings",
  altPID: "PID Settings",
  velPID: "PID Settings",
  posPID: "PID Settings",
  posrPID: "PID Settings",
  magPID: "PID Settings",
  rates: "Rates",
  rc_rate: "Rates",
  rc_expo: "Rates",
  rc_yaw_expo: "Rates",
  thr_mid: "Rates",
  thr_expo: "Rates",
  axisAccelerationLimitRollPitch: "Rates",
  axisAccelerationLimitYaw: "Rates",
  tpa_rate: "PID Controller",
  tpa_breakpoint: "PID Controller",
  pidSumLimit: "PID Controller",
  pidSumLimitYaw: "PID Controller",
  minthrottle: "Motor / ESC",
  maxthrottle: "Motor / ESC",
  motorOutput: "Motor / ESC",
  motor_pwm_protocol: "Motor / ESC",
  motor_pwm_rate: "Motor / ESC",
  gyro_lpf: "Gyro Filters",
  gyro_lpf_type: "Gyro Filters",
  gyro_lpf_hz: "Gyro Filters",
  acc_lpf_hz: "Gyro Filters",
  acc_notch_hz: "Gyro Filters",
  acc_notch_cutoff: "Gyro Filters",
  dynamicGyroNotchQ: "Dynamic Notch",
  dynamicGyroNotchMinHz: "Dynamic Notch",
  rpm_gyro_filter_enabled: "RPM Filter",
  rpm_gyro_harmonics: "RPM Filter",
  rpm_gyro_min_hz: "RPM Filter",
  rpm_gyro_q: "RPM Filter",
  dterm_lpf_hz: "D-Term Filters",
  dterm_lpf_type: "D-Term Filters",
  yaw_lpf_hz: "D-Term Filters",
  vbat_scale: "Battery",
  vbatcellvoltage: "Battery",
  vbatref: "Battery",
  currentMeter: "Battery",
  acc_hardware: "Hardware",
  baro_hardware: "Hardware",
  mag_hardware: "Hardware",
  serialrx_provider: "Hardware",
  acc_1G: "Hardware",
  gyro_scale: "Hardware",
  features: "Features",
};

// Header lines the parser stores under other sysConfig keys, so hiding a line also hides its values
export const INAV_HEADER_KEYS = {
  vbat_scale: ["vbatscale"],
  vbatcellvoltage: ["vbatmincellvoltage", "vbatwarningcellvoltage", "vbatmaxcellvoltage"],
  currentMeter: ["currentMeterOffset", "currentMeterScale"],
  motor_pwm_protocol: ["fast_pwm_protocol"],
  thr_mid: ["thrMid"],
  thr_expo: ["thrExpo"],
  "P interval": ["frameIntervalPNum", "frameIntervalPDenom"],
};

export function inavHeaderView(s) {
  const t = inavTablesFor(s.firmwareVersion);

  const pids = [
    pidRow("Roll", s.rollPID, true),
    pidRow("Pitch", s.pitchPID, true),
    pidRow("Yaw", s.yawPID, true),
    pidRow("Level", s.levelPID),
    pidRow("Altitude", s.altPID),
    pidRow("Vel Z", s.velPID),
    pidRow("Pos XY", s.posPID),
    pidRow("Vel XY", s.posrPID),
    pidRow("Heading", s.magPID),
  ].filter(Boolean);

  // rates are written in tens of degrees per second, expos and throttle curve in hundredths
  const rates = only([
    param("Roll Rate", num(s.rates?.[0] * 10, "°/s")),
    param("Pitch Rate", num(s.rates?.[1] * 10, "°/s")),
    param("Yaw Rate", num(s.rates?.[2] * 10, "°/s")),
    param("Roll/Pitch Expo", num(s.rc_expo?.[0], "", 100, 2)),
    param("Yaw Expo", num(s.rc_expo?.[2], "", 100, 2)),
    param("Throttle Mid", num(s.thrMid, "", 100, 2)),
    param("Throttle Expo", num(s.thrExpo, "", 100, 2)),
    param("Roll/Pitch Accel", offOr(s.axisAccelerationLimitRollPitch, "°/s²")),
    param("Yaw Accel", offOr(s.axisAccelerationLimitYaw, "°/s²")),
  ]);

  const pidController = only([
    param("TPA Rate", num(s.tpa_rate, "%")),
    param("TPA Breakpoint", num(s.tpa_breakpoint, "µs")),
    param("PID Sum Limit", num(s.pidSumLimit)),
    param("PID Sum Limit Yaw", num(s.pidSumLimitYaw)),
  ]);

  const motor = only([
    param("Protocol", pick(s.fast_pwm_protocol, t.motor_pwm_protocol)),
    param("Update Rate", num(s.motor_pwm_rate, "Hz")),
    param("Idle Throttle", num(s.minthrottle, "µs")),
    param("Max Throttle", num(s.maxthrottle, "µs")),
  ]);

  // INAV 7 still logged the hardware LPF and the main LPF type
  const gyroFilters = only([
    param("Hardware LPF", t.gyro_lpf ? pick(s.gyro_lpf, t.gyro_lpf) : null),
    param("Main LPF", offOr(s.gyro_lpf_hz, "Hz")),
    param("Main LPF Type", pick(s.gyro_lpf_type, t.filter_type)),
    param("Acc LPF", offOr(s.acc_lpf_hz, "Hz")),
    param("Acc Notch", offOr(s.acc_notch_hz, "Hz")),
    param("Acc Notch Cutoff", s.acc_notch_hz ? num(s.acc_notch_cutoff, "Hz") : null),
  ]);

  const dynamicNotch = only([
    param("Q", num(s.dynamicGyroNotchQ, "", 100, 2)),
    param("Min Frequency", num(s.dynamicGyroNotchMinHz, "Hz")),
  ]);

  const rpmOn = !!s.rpm_gyro_filter_enabled;
  const rpmFilter = only([
    param("Gyro RPM Filter", onOff(s.rpm_gyro_filter_enabled)),
    param("Harmonics", rpmOn ? num(s.rpm_gyro_harmonics) : null),
    param("Min Frequency", rpmOn ? num(s.rpm_gyro_min_hz, "Hz") : null),
    param("Q", rpmOn ? num(s.rpm_gyro_q, "", 100, 2) : null),
  ]);

  const dtermFilters = only([
    param("LPF", offOr(s.dterm_lpf_hz, "Hz")),
    param("LPF Type", pick(s.dterm_lpf_type, t.filter_type_full)),
    param("Yaw LPF", offOr(s.yaw_lpf_hz, "Hz")),
  ]);

  // As logged: vbat_scale / 10, cells in 0.1 V, the reference in 0.01 V, the current scale in 0.1 mV/A
  const battery = only([
    param("Voltage Scale", num(s.vbatscale * 10)),
    param("Cell Min", num(s.vbatmincellvoltage, "V", 10, 1)),
    param("Cell Warning", num(s.vbatwarningcellvoltage, "V", 10, 1)),
    param("Cell Max", num(s.vbatmaxcellvoltage, "V", 10, 1)),
    param("Voltage at Start", s.vbatref ? num(s.vbatref, "V", 100, 2) : null),
    param("Current Offset", num(s.currentMeterOffset, "mV")),
    param("Current Scale", num(s.currentMeterScale, "mV/A", 10, 1)),
  ]);

  const hardware = only([
    param("Accelerometer", pick(s.acc_hardware, t.acc_hardware)),
    param("Barometer", pick(s.baro_hardware, t.baro_hardware)),
    param("Magnetometer", pick(s.mag_hardware, t.mag_hardware)),
    param("Serial RX", pick(s.serialrx_provider, t.serial_rx)),
  ]);

  const looptime = present(s.looptime) && s.looptime > 0 ? `${s.looptime} µs (${(1000 / s.looptime).toFixed(1).replace(/\.0$/, "")} kHz)` : null;
  const waypoints = Array.isArray(s.waypoints) && s.waypoints[0] > 0
    ? `${s.waypoints[0]} (${s.waypoints[1] ? "valid" : "not valid"})`
    : present(s.waypoints?.[0]) ? "None" : null;
  const parameters = only([
    param("Loop Time", looptime),
    param("Logging Rate", present(s.frameIntervalPDenom) ? `${s.frameIntervalPNum}/${s.frameIntervalPDenom}` : null),
    param("Debug Mode", pick(s.debug_mode, t.debug_modes)),
    param("Deadband", num(s.deadband, "µs")),
    param("Yaw Deadband", num(s.yaw_deadband, "µs")),
    param("Waypoints", waypoints),
  ]);

  const features = [];
  if (present(s.features)) {
    for (let bit = 0; bit < 32; bit++) {
      if (s.features & (1 << bit)) {
        features.push({ name: t.features?.[bit] ?? `BIT ${bit}`, description: "", enabled: true });
      }
    }
  }

  return {
    pids,
    features,
    groups: {
      Rates: rates,
      "PID Controller": pidController,
      "Motor / ESC": motor,
      "Gyro Filters": gyroFilters,
      "Dynamic Notch": dynamicNotch,
      "RPM Filter": rpmFilter,
      "D-Term Filters": dtermFilters,
      Battery: battery,
      Hardware: hardware,
      Parameters: parameters,
    },
  };
}
