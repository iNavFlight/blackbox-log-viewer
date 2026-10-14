// A plane or a flying wing in 3D, seen from behind and above so that the bank shows. The log has no servo
// mixer to move the surfaces from, so they stay still; the props fill with each motor's throttle, as on the
// multirotor model, and the attitude comes from the same heading[] fields.
export function CraftPlane3D(flightLog, canvas, propColors, isFlyingWing) {
  const NUM_PROP_LEVELS = 100,
    // A pusher behind a flying wing would hide the wing at the plane's size
    PROP_RADIUS = isFlyingWing ? 0.14 : 0.22,
    numMotors = propColors.length,
    sysInfo = flightLog.getSysConfig();

  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 }),
    trimMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 }),
    propShellMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      opacity: 0.2,
      transparent: true,
    }),
    propMaterials = propColors.map(
      (color) => new THREE.MeshLambertMaterial({ color }),
    );

  // x to the right wing, y forward, z up
  function box(x, y, z, width, length, height, material = bodyMaterial) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, length, height),
      material,
    );
    mesh.position.set(x, y, z);
    return mesh;
  }

  // A disc filled up to the throttle, one geometry per level as the multirotor model does it
  function buildPropGeometry() {
    const levels = new Array(NUM_PROP_LEVELS);
    levels[0] = new THREE.Geometry();
    for (let i = 1; i < NUM_PROP_LEVELS; i++) {
      const shape = new THREE.Shape();
      if (i === NUM_PROP_LEVELS - 1) {
        shape.moveTo(PROP_RADIUS, 0);
      } else {
        shape.moveTo(0, 0);
      }
      shape.absarc(
        0,
        0,
        PROP_RADIUS,
        0,
        (Math.PI * 2 * i) / (NUM_PROP_LEVELS - 1),
      );
      levels[i] = new THREE.ExtrudeGeometry(shape, {
        amount: 0.02,
        steps: 1,
        bevelEnabled: false,
      });
    }
    return levels;
  }

  function buildPlane(body) {
    const fuselage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.05, 1.5, 12),
      bodyMaterial,
    );
    body.add(fuselage);
    const nose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.08, 0.18, 12),
      trimMaterial,
    );
    nose.position.y = 0.84;
    body.add(nose);
    body.add(box(0, 0.15, 0.04, 1.9, 0.3, 0.03));
    body.add(box(0, -0.65, 0.02, 0.7, 0.18, 0.02));
    body.add(box(0, -0.66, 0.15, 0.02, 0.2, 0.26, trimMaterial));
    // One motor in the nose, more along the wing's leading edge
    if (numMotors === 1) {
      return [{ x: 0, y: 0.95 }];
    }
    return propColors.map((_, i) => ({
      x: ((i + 0.5) / numMotors - 0.5) * 1.4,
      y: 0.4,
    }));
  }

  function buildFlyingWing(body) {
    const outline = [
      [0, 0.45],
      [1, -0.25],
      [0.95, -0.45],
      [0, -0.3],
      [-0.95, -0.45],
      [-1, -0.25],
    ];
    const shape = new THREE.Shape();
    shape.moveTo(outline[0][0], outline[0][1]);
    for (const [x, y] of outline.slice(1)) {
      shape.lineTo(x, y);
    }
    const wing = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        amount: 0.05,
        steps: 1,
        bevelEnabled: false,
      }),
      bodyMaterial,
    );
    wing.position.z = -0.025;
    body.add(wing);
    body.add(box(0.97, -0.35, 0.08, 0.02, 0.2, 0.16, trimMaterial));
    body.add(box(-0.97, -0.35, 0.08, 0.02, 0.2, 0.16, trimMaterial));
    // Pushers behind the trailing edge
    if (numMotors === 1) {
      return [{ x: 0, y: -0.42 }];
    }
    return propColors.map((_, i) => ({
      x: ((i + 0.5) / numMotors - 0.5) * 0.9,
      y: -0.45,
    }));
  }

  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100),
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true }),
    light = new THREE.HemisphereLight(0xe4e4ff, 0x405040, 1.1),
    craft = new THREE.Object3D(),
    propGeometry = buildPropGeometry(),
    propShells = [],
    props = new Array(numMotors);

  const motorPositions = isFlyingWing
    ? buildFlyingWing(craft)
    : buildPlane(craft);
  for (const position of motorPositions) {
    const shell = new THREE.Mesh(
      propGeometry[NUM_PROP_LEVELS - 1],
      propShellMaterial,
    );
    shell.position.set(position.x, position.y, 0);
    // The disc faces forward
    shell.rotation.x = Math.PI / 2;
    craft.add(shell);
    propShells.push(shell);
  }

  // Yaw, then pitch, then roll, so that a banked climb looks like one
  craft.rotation.order = "ZXY";
  scene.add(craft);
  light.position.set(0.3, -0.4, 1);
  scene.add(light);
  camera.position.set(0, -3, 1.6);
  camera.up.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  this.render = function (frame, frameFieldIndexes) {
    for (let i = 0; i < numMotors; i++) {
      if (props[i]) {
        propShells[i].remove(props[i]);
      }
      const throttle = Math.min(
        Math.max(
          frame[frameFieldIndexes[`motor[${i}]`]] - sysInfo.motorOutput[0],
          0,
        ) /
          (sysInfo.motorOutput[1] - sysInfo.motorOutput[0]),
        1,
      );
      const level = Math.round(throttle * (NUM_PROP_LEVELS - 1)) || 0;
      props[i] = new THREE.Mesh(propGeometry[level], propMaterials[i]);
      props[i].scale.set(0.95, 0.95, 0.95);
      propShells[i].add(props[i]);
    }

    // INAV's pitch is positive nose down, its roll positive right wing down
    craft.rotation.x = -frame[frameFieldIndexes["heading[1]"]];
    craft.rotation.y = frame[frameFieldIndexes["heading[0]"]];

    renderer.render(scene, camera);
  };

  this.resize = function (width, height) {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      renderer.setViewport(0, 0, width, height);
      camera.updateProjectionMatrix();
    }
  };
}
