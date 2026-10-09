// The log has no servo mixer: attitude, throttle and each servo's travel rather than moving control surfaces
const SKY = "rgba(55, 168, 219, 0.75)";
const GROUND = "rgba(150, 105, 60, 0.75)";
const INK = "rgba(255, 255, 255, 0.9)";
const DIM = "rgba(255, 255, 255, 0.25)";
const SERVO_CENTRE = 1500;
const SERVO_TRAVEL = 500;
const MAX_SERVOS = 8;

export function CraftWing2D(flightLog, canvas) {
  const ctx = canvas.getContext("2d");
  const names = flightLog.getMainFieldNames();
  const count = (prefix) => names.filter((n) => new RegExp(`^${prefix}\\[\\d+\\]$`).test(n)).length;
  const numMotors = count("motor");
  const numServos = Math.min(count("servo"), MAX_SERVOS);

  function horizon(cx, cy, r, roll, pitch) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(-roll);
    // INAV's pitch is positive nose down (the OSD's horizon rises with it); 90 degrees move it by one radius
    const offset = -(pitch / (Math.PI / 2)) * r;
    ctx.fillStyle = SKY;
    ctx.fillRect(-2 * r, -2 * r, 4 * r, 2 * r + offset);
    ctx.fillStyle = GROUND;
    ctx.fillRect(-2 * r, offset, 4 * r, 2 * r);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    ctx.moveTo(-2 * r, offset);
    ctx.lineTo(2 * r, offset);
    ctx.stroke();
    ctx.restore();

    // the aircraft, fixed
    ctx.strokeStyle = "rgb(255, 200, 0)";
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy);
    ctx.lineTo(cx - r * 0.15, cy);
    ctx.lineTo(cx, cy + r * 0.12);
    ctx.lineTo(cx + r * 0.15, cy);
    ctx.lineTo(cx + r * 0.55, cy);
    ctx.stroke();

    ctx.strokeStyle = DIM;
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function label(text, x, y, size, align = "center") {
    ctx.fillStyle = INK;
    ctx.font = `${Math.round(size)}px "Open Sans", sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  this.render = function (frame, frameFieldIndexes) {
    const w = canvas.width;
    const h = canvas.height;
    const value = (name) => frame[frameFieldIndexes[name]];
    const toRadians = Math.PI / 1800;
    ctx.clearRect(0, 0, w, h);

    const r = Math.min(w, h) * 0.24;
    const cx = w / 2;
    const cy = r + h * 0.04;
    const roll = (value("attitude[0]") ?? 0) * toRadians;
    const pitch = (value("attitude[1]") ?? 0) * toRadians;
    horizon(cx, cy, r, roll, pitch);
    const heading = value("attitude[2]");
    if (heading !== undefined) {
      label(`${Math.round(heading / 10) % 360}°`, cx, cy + r + h * 0.05, h * 0.055);
    }

    // throttle bars on the left, servo travel on the right
    const top = cy + r + h * 0.11;
    const bottom = h * 0.97;
    const textSize = h * 0.045;
    const sysConfig = flightLog.getSysConfig();
    const [low, high] = sysConfig.motorOutput ?? [1000, 2000];
    const barWidth = w * 0.06;
    for (let i = 0; i < numMotors; i++) {
      const x = w * 0.06 + i * barWidth * 1.4;
      const fraction = Math.min(Math.max((value(`motor[${i}]`) - low) / (high - low), 0), 1);
      ctx.fillStyle = DIM;
      ctx.fillRect(x, top, barWidth, bottom - top - textSize * 1.4);
      ctx.fillStyle = "rgb(55, 168, 219)";
      const full = bottom - top - textSize * 1.4;
      ctx.fillRect(x, top + full * (1 - fraction), barWidth, full * fraction);
      label(`M${i + 1}`, x + barWidth / 2, bottom - textSize * 0.5, textSize);
    }

    if (numServos > 0) {
      const left = w * 0.06 + Math.max(numMotors, 1) * barWidth * 1.4 + w * 0.08;
      const right = w * 0.96;
      const rowHeight = (bottom - top) / numServos;
      const centre = (left + textSize * 2 + right) / 2;
      const half = (right - left - textSize * 2) / 2;
      for (let i = 0; i < numServos; i++) {
        const y = top + rowHeight * (i + 0.5);
        const travel = Math.min(Math.max((value(`servo[${i}]`) - SERVO_CENTRE) / SERVO_TRAVEL, -1), 1);
        label(`S${i}`, left, y, textSize, "left");
        ctx.fillStyle = DIM;
        ctx.fillRect(centre - half, y - rowHeight * 0.18, half * 2, rowHeight * 0.36);
        ctx.fillStyle = "rgb(255, 200, 0)";
        ctx.fillRect(Math.min(centre, centre + travel * half), y - rowHeight * 0.18, Math.abs(travel * half), rowHeight * 0.36);
        ctx.fillStyle = INK;
        ctx.fillRect(centre - 0.5, y - rowHeight * 0.26, 1, rowHeight * 0.52);
      }
    }
  };

  this.resize = function (width, height) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  this.resize(canvas.width, canvas.height);
}
