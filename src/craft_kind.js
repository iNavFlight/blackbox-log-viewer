import { FIRMWARE_TYPE_INAV } from "./flightlog_fielddefs.js";
import { mixerList } from "./user_settings_data.js";

// Besides a mixer from mixerList, a craft model can be left to the log or set to the 2D gauges
export const CRAFT_MODEL_AUTO = "auto";
export const CRAFT_MODEL_GAUGES = "gauges";
// Motors placed by their count, as Betaflight logs always were
export const CRAFT_MODEL_BY_COUNT = "count";
export const PLANE_MODELS = ["Airplane", "Flying Wing"];
// Entries of mixerList that are not a craft to draw, or need coaxial or uneven arms that the 3D model,
// with its evenly spaced arms, would draw with their motors in the wrong places
const NOT_DRAWN = new Set([
  "Y6",
  "Y4",
  "Octo X8",
  "A-tail Quad",
  "Hex H",
  "Gimbal",
  "PPM to SERVO",
  "Heli 120",
  "Heli 90",
  "Custom",
  "Custom Airplane",
  "Custom Tricopter",
  "Singlecopter",
  "Dualcopter",
]);

/**
 * What kind of craft wrote the log. INAV logs no platform or mixer, but the fields it chose to log tell:
 * the fixed wing navigation PIDs only on planes, the multirotor ones on everything else, a motor[] field
 * per motor and a servo[] field per servo output. A layout (X or +, H, Y6) cannot be told, nor a flying
 * wing from a plane: those keep model null, and the gauges, until the user picks a model.
 */
export function craftKind(flightLog) {
  const names = flightLog.getMainFieldNames();
  const count = (prefix) =>
    names.filter((name) => new RegExp(`^${prefix}\\[\\d+\\]$`).test(name))
      .length;
  const motors = count("motor");
  const servos = count("servo");
  const kind = (key, label, model) => ({ key, label, model, motors, servos });

  if (flightLog.getSysConfig().firmwareType !== FIRMWARE_TYPE_INAV) {
    return kind(
      `multirotor-${motors}`,
      `Multirotor, ${motors} motors`,
      CRAFT_MODEL_BY_COUNT,
    );
  }
  if (names.includes("fwAltP") || names.includes("fwPosP")) {
    return kind("airplane", "Airplane or flying wing", null);
  }
  const multirotorNav =
    names.includes("mcPosAxisP[0]") || names.includes("mcVelAxisP[0]");
  if (motors === 3 && servos > 0 && multirotorNav) {
    return kind("tricopter", "Tricopter", "Tricopter");
  }
  const layout = { 4: "Quad X", 6: "Hex X", 8: "Octo Flat X" }[motors];
  if (layout && servos === 0) {
    return kind(`multirotor-${motors}`, `Multirotor, ${motors} motors`, layout);
  }
  return kind(
    `other-${motors}-${servos}`,
    `Not recognised: ${motors} motors, ${servos} servos`,
    null,
  );
}

// The models a log can be shown as: every motor needs a place, and planes have servos
export function craftModelChoices(kind) {
  return mixerList
    .filter(
      (mixer) =>
        !NOT_DRAWN.has(mixer.name) &&
        (PLANE_MODELS.includes(mixer.name)
          ? kind.servos > 0
          : mixer.defaultMotorOrder.length === kind.motors),
    )
    .map((mixer) => mixer.name);
}

// The model to draw: the user's choice for this kind of log, else what the log was recognised as
export function craftModelFor(kind, choices) {
  const choice = choices?.[kind.key] ?? CRAFT_MODEL_AUTO;
  if (choice !== CRAFT_MODEL_AUTO) {
    return choice;
  }
  return kind.model ?? CRAFT_MODEL_GAUGES;
}
