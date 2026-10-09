// The header has no platform line: INAV logs the fw* navigation fields on planes only, the mc* ones on multirotors
const GRAPHS = [
  { label: "Motors", fields: ["motor[all]"] },
  { label: "Servos", fields: ["servo[all]"] },
  { label: "Gyros", fields: ["gyroADC[all]"] },
  { label: "Unfiltered Gyros", fields: ["gyroRaw[all]"] },
  { label: "Setpoint", fields: ["axisRate[all]"] },
  { label: "RC Command", fields: ["rcCommand[all]"] },
  { label: "RC Channels", fields: ["rcData[all]"] },
  { label: "PIDs", fields: ["axisSum[all]"] },
  { label: "PID Error", fields: ["axisError[all]"] },
  ...["roll", "pitch", "yaw"].map((axis, i) => ({
    label: `Gyro + PID ${axis}`,
    fields: [`axisP[${i}]`, `axisI[${i}]`, `axisD[${i}]`, `axisF[${i}]`, `gyroADC[${i}]`, `axisRate[${i}]`],
  })),
  { label: "Attitude", fields: ["attitude[all]"] },
  { label: "Accelerometers", fields: ["accSmooth[all]", "accVib"] },
  { label: "Compass", fields: ["magADC[all]"] },
  { label: "Battery", fields: ["vbat", "sagCompensatedVBat", "amperage"] },
  { label: "Altitude", fields: ["navPos[2]", "navTgtPos[2]", "BaroAlt"] },
  { label: "Vertical Speed", fields: ["navVel[2]", "navTgtVel[2]"] },
  { label: "Horizontal Speed", fields: ["navVel[0]", "navTgtVel[0]", "navVel[1]", "navTgtVel[1]"] },
  { label: "Navigation", fields: ["navState", "activeWpNumber", "navFlags"] },
  { label: "Altitude Controller", fields: ["fwAltP", "fwAltI", "fwAltD", "fwAltOut"] },
  { label: "Position Controller", fields: ["fwPosP", "fwPosI", "fwPosD", "fwPosOut"] },
  { label: "Auto Speed Controller", fields: ["fwAutoSpeedP", "fwAutoSpeedI"] },
  { label: "Position Controller", fields: ["mcPosAxisP[all]"] },
  ...["X", "Y", "Z"].map((axis, i) => ({
    label: `Velocity Controller ${axis}`,
    fields: ["P", "I", "D", "FF", "Out"].map((term) => `mcVelAxis${term}[${i}]`),
  })),
  { label: "Surface Controller", fields: ["mcSurfaceP", "mcSurfaceI", "mcSurfaceD", "mcSurfaceOut"] },
  { label: "Rangefinder", fields: ["surfaceRaw", "navSurf"] },
  { label: "Airspeed", fields: ["AirSpeed", "GPS_speed"] },
  { label: "Wind", fields: ["wind[all]"] },
  { label: "GPS", fields: ["GPS_numSat", "GPS_hdop", "GPS_speed", "GPS_ground_course", "GPS_altitude"] },
  { label: "ESC", fields: ["escRPM", "escTemperature"] },
  { label: "Temperatures", fields: ["IMUTemperature", "baroTemperature", "escTemperature"] },
  { label: "Link", fields: ["rssi", "rxUpdateRate"] },
  { label: "Debug", fields: ["debug[all]"] },
];

function hasField(flightLog, name) {
  const all = /^(.*)\[all\]$/.exec(name);
  return flightLog.getMainFieldIndexByName(all ? `${all[1]}[0]` : name) !== undefined;
}

export function isInavFixedWingLog(flightLog) {
  return hasField(flightLog, "fwAltP") || hasField(flightLog, "fwPosP");
}

// Graphs whose fields the log has, each with only those fields
export function inavExampleGraphs(flightLog) {
  const out = [];
  for (const graph of GRAPHS) {
    const fields = graph.fields.filter((name) => hasField(flightLog, name));
    // "Position Controller" exists for both platforms: keep the one this log has
    if (fields.length > 0 && !out.some((g) => g.label === graph.label)) {
      out.push({ label: graph.label, fields });
    }
  }
  return out;
}

// The first two of these the log has (motors or servos can be left out of the log with blackbox_disabled)
export function inavDefaultGraphNames(flightLog) {
  const wanted = isInavFixedWingLog(flightLog)
    ? ["Servos", "Gyros", "Motors", "Setpoint", "RC Command"]
    : ["Motors", "Gyros", "Setpoint", "RC Command"];
  const available = new Set(inavExampleGraphs(flightLog).map((g) => g.label));
  return wanted.filter((label) => available.has(label)).slice(0, 2);
}
