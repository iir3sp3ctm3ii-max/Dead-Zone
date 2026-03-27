import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPositionRef } from "./Player";

interface ZombieData {
  id: number;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  state: "walking" | "attacking" | "dying" | "dead";
  dieTime: number;
  hitFlash: number;
  animTime: number;
}
interface ZombieProps { zombie: ZombieData; }

const skinMat   = new THREE.MeshLambertMaterial({ color: "#7a9955" });
const skinDkMat = new THREE.MeshLambertMaterial({ color: "#5a7a3a" });
const shirtMat  = new THREE.MeshLambertMaterial({ color: "#2a3520" });
const pantsMat  = new THREE.MeshLambertMaterial({ color: "#1e2818" });
const shoeMat   = new THREE.MeshLambertMaterial({ color: "#111111" });
const hairMat   = new THREE.MeshLambertMaterial({ color: "#111111" });
const toothMat  = new THREE.MeshLambertMaterial({ color: "#cccc99" });
const eyeGlow   = new THREE.MeshBasicMaterial({ color: "#88ff88" });
const eyeDark   = new THREE.MeshBasicMaterial({ color: "#000000" });
const mouthMat  = new THREE.MeshBasicMaterial({ color: "#440000" });

export default function Zombie({ zombie }: ZombieProps) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const lArmRef  = useRef<THREE.Group>(null);
  const rArmRef  = useRef<THREE.Group>(null);
  const lForeRef = useRef<THREE.Group>(null);
  const rForeRef = useRef<THREE.Group>(null);
  const lLegRef  = useRef<THREE.Group>(null);
  const rLegRef  = useRef<THREE.Group>(null);
  const lShinRef = useRef<THREE.Group>(null);
  const rShinRef = useRef<THREE.Group>(null);
  const headRef  = useRef<THREE.Group>(null);

  const sRotY = useRef(0);
  const sLA = useRef(0); const sRA = useRef(0);
  const sLF = useRef(0); const sRF = useRef(0);
  const sLL = useRef(0); const sRL = useRef(0);
  const sLS = useRef(0); const sRS = useRef(0);
  const sHX = useRef(0); const sHZ = useRef(0);
  const sTX = useRef(0); const sTZ = useRef(0);
  const sBY = useRef(0);
  const sDX = useRef(0); const sDY = useRef(0);
  const _tp  = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(zombie.position);

    _tp.current.copy(playerPositionRef.current).sub(zombie.position);
    _tp.current.y = 0;
    if (_tp.current.lengthSq() > 0.01) {
      const target = Math.atan2(_tp.current.x, _tp.current.z) + Math.PI;
      let diff = target - sRotY.current;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      sRotY.current += diff * Math.min(delta * 9, 1);
      groupRef.current.rotation.y = sRotY.current;
    }

    if (zombie.state === "dying") {
      sDX.current = THREE.MathUtils.lerp(sDX.current, Math.PI / 2, delta * 4);
      sDY.current = THREE.MathUtils.lerp(sDY.current, -0.85, delta * 4);
      groupRef.current.rotation.x = sDX.current;
      groupRef.current.position.y = sDY.current;
      if (lArmRef.current) lArmRef.current.rotation.z = THREE.MathUtils.lerp(lArmRef.current.rotation.z, -0.9, delta * 4);
      if (rArmRef.current) rArmRef.current.rotation.z = THREE.MathUtils.lerp(rArmRef.current.rotation.z,  0.9, delta * 4);
      return;
    }
    sDX.current = THREE.MathUtils.lerp(sDX.current, 0, delta * 8);
    groupRef.current.rotation.x = sDX.current;

    const t   = zombie.animTime;
    const spd = Math.min(delta * 16, 1);

    if (zombie.state === "walking") {
      const step = Math.sin(t * 3.5);
      const sAbs = Math.abs(step);
      lerp8(spd,
        0.55 - step * 0.25, 0.55 + step * 0.25,
        0.40, 0.40,
        step * 0.50, -step * 0.50,
        Math.max(0, -step) * 0.6 + sAbs * 0.3,
        Math.max(0,  step) * 0.6 + sAbs * 0.3,
      );
      sHX.current = THREE.MathUtils.lerp(sHX.current, Math.sin(t * 3.5) * 0.06, spd);
      sHZ.current = THREE.MathUtils.lerp(sHZ.current, Math.sin(t * 1.7) * 0.12, spd);
      sTX.current = THREE.MathUtils.lerp(sTX.current, 0.18, spd);
      sTZ.current = THREE.MathUtils.lerp(sTZ.current, Math.sin(t * 1.75) * 0.06, spd);
      sBY.current = THREE.MathUtils.lerp(sBY.current, sAbs * 0.04, spd);
    } else if (zombie.state === "attacking") {
      const strike = Math.sin(t * 8);
      const s2 = Math.min(delta * 22, 1);
      lerp8(s2,
        0.3 + strike * 0.3, 0.8 - strike * 0.6,
        0.2, 0.1 + Math.max(0, strike) * 0.4,
        0, 0, 0, 0,
      );
      sHX.current = THREE.MathUtils.lerp(sHX.current, 0.12 + strike * 0.06, s2);
      sHZ.current = THREE.MathUtils.lerp(sHZ.current, Math.sin(t * 4) * 0.15, s2);
      sTX.current = THREE.MathUtils.lerp(sTX.current, 0.22, s2);
      sTZ.current = THREE.MathUtils.lerp(sTZ.current, strike * 0.08, s2);
      sBY.current = THREE.MathUtils.lerp(sBY.current, 0, delta * 8);
    } else {
      const s3 = delta * 5;
      lerp8(s3, 0.15, 0.15, 0.1, 0.1, 0, 0, 0, 0);
      sHX.current = THREE.MathUtils.lerp(sHX.current, 0.05, s3);
      sHZ.current = THREE.MathUtils.lerp(sHZ.current, Math.sin(t * 1.2) * 0.03, s3);
      sTX.current = THREE.MathUtils.lerp(sTX.current, 0.08, s3);
      sTZ.current = THREE.MathUtils.lerp(sTZ.current, 0, s3);
      sBY.current = THREE.MathUtils.lerp(sBY.current, 0, s3);
    }

    if (lArmRef.current)  { lArmRef.current.rotation.x = sLA.current; lArmRef.current.rotation.z  = THREE.MathUtils.lerp(lArmRef.current.rotation.z,  0, delta * 6); }
    if (rArmRef.current)  { rArmRef.current.rotation.x = sRA.current; rArmRef.current.rotation.z  = THREE.MathUtils.lerp(rArmRef.current.rotation.z,  0, delta * 6); }
    if (lForeRef.current)   lForeRef.current.rotation.x = sLF.current;
    if (rForeRef.current)   rForeRef.current.rotation.x = sRF.current;
    if (lLegRef.current)    lLegRef.current.rotation.x  = sLL.current;
    if (rLegRef.current)    rLegRef.current.rotation.x  = sRL.current;
    if (lShinRef.current)   lShinRef.current.rotation.x = sLS.current;
    if (rShinRef.current)   rShinRef.current.rotation.x = sRS.current;
    if (headRef.current)  { headRef.current.rotation.x  = sHX.current; headRef.current.rotation.z = sHZ.current; }
    if (torsoRef.current) { torsoRef.current.rotation.x = sTX.current; torsoRef.current.rotation.z = sTZ.current; }
    groupRef.current.position.y = sBY.current;
  });

  function lerp8(s: number, la: number, ra: number, lf: number, rf: number,
                 ll: number, rl: number, ls: number, rs: number) {
    sLA.current = THREE.MathUtils.lerp(sLA.current, la, s);
    sRA.current = THREE.MathUtils.lerp(sRA.current, ra, s);
    sLF.current = THREE.MathUtils.lerp(sLF.current, lf, s);
    sRF.current = THREE.MathUtils.lerp(sRF.current, rf, s);
    sLL.current = THREE.MathUtils.lerp(sLL.current, ll, s);
    sRL.current = THREE.MathUtils.lerp(sRL.current, rl, s);
    sLS.current = THREE.MathUtils.lerp(sLS.current, ls, s);
    sRS.current = THREE.MathUtils.lerp(sRS.current, rs, s);
  }

  return (
    <group ref={groupRef} position={[zombie.position.x, 0, zombie.position.z]}>

      {/* SCARPE */}
      <mesh castShadow position={[-0.13, 0.06, -0.02]} material={shoeMat}>
        <boxGeometry args={[0.17, 0.12, 0.28]} />
      </mesh>
      <mesh castShadow position={[0.13, 0.06, -0.02]} material={shoeMat}>
        <boxGeometry args={[0.17, 0.12, 0.28]} />
      </mesh>

      {/* GAMBA SX */}
      <group position={[-0.13, 0.85, 0]} ref={lLegRef}>
        <mesh castShadow receiveShadow position={[0, -0.22, 0]} material={pantsMat}>
          <boxGeometry args={[0.20, 0.44, 0.20]} />
        </mesh>
        <group position={[0, -0.45, 0]} ref={lShinRef}>
          <mesh castShadow receiveShadow position={[0, -0.19, 0.01]} material={pantsMat}>
            <boxGeometry args={[0.17, 0.38, 0.17]} />
          </mesh>
        </group>
      </group>

      {/* GAMBA DX */}
      <group position={[0.13, 0.85, 0]} ref={rLegRef}>
        <mesh castShadow receiveShadow position={[0, -0.22, 0]} material={pantsMat}>
          <boxGeometry args={[0.20, 0.44, 0.20]} />
        </mesh>
        <group position={[0, -0.45, 0]} ref={rShinRef}>
          <mesh castShadow receiveShadow position={[0, -0.19, 0.01]} material={pantsMat}>
            <boxGeometry args={[0.17, 0.38, 0.17]} />
          </mesh>
        </group>
      </group>

      {/* BACINO */}
      <mesh castShadow receiveShadow position={[0, 0.92, 0]} material={pantsMat}>
        <boxGeometry args={[0.46, 0.20, 0.26]} />
      </mesh>

      {/* TORSO */}
      <group position={[0, 0.96, 0]} ref={torsoRef}>
        <mesh castShadow receiveShadow position={[0, 0.18, 0]} material={shirtMat}>
          <boxGeometry args={[0.48, 0.30, 0.27]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.44, 0]} material={shirtMat}>
          <boxGeometry args={[0.52, 0.28, 0.28]} />
        </mesh>
        <mesh castShadow position={[-0.28, 0.50, 0]} material={shirtMat}>
          <sphereGeometry args={[0.13, 6, 6]} />
        </mesh>
        <mesh castShadow position={[0.28, 0.50, 0]} material={shirtMat}>
          <sphereGeometry args={[0.13, 6, 6]} />
        </mesh>

        {/* COLLO + TESTA */}
        <group position={[0, 0.64, 0]}>
          <mesh castShadow material={skinMat}>
            <cylinderGeometry args={[0.09, 0.10, 0.15, 8]} />
          </mesh>
          <group position={[0, 0.22, 0]} ref={headRef}>
            <mesh castShadow material={skinMat}>
              <sphereGeometry args={[0.26, 12, 12]} />
            </mesh>
            <mesh castShadow position={[0, -0.14, -0.10]} material={skinDkMat}>
              <boxGeometry args={[0.24, 0.13, 0.17]} />
            </mesh>
            <mesh position={[-0.20, -0.02, -0.14]} material={skinDkMat}>
              <sphereGeometry args={[0.065, 6, 6]} />
            </mesh>
            <mesh position={[0.20, -0.02, -0.14]} material={skinDkMat}>
              <sphereGeometry args={[0.065, 6, 6]} />
            </mesh>
            <mesh position={[0, 0.03, -0.26]} material={skinDkMat}>
              <boxGeometry args={[0.06, 0.06, 0.05]} />
            </mesh>
            <mesh position={[-0.11, 0.08, -0.24]} material={eyeDark}>
              <sphereGeometry args={[0.052, 7, 7]} />
            </mesh>
            <mesh position={[0.11, 0.08, -0.24]} material={eyeDark}>
              <sphereGeometry args={[0.052, 7, 7]} />
            </mesh>
            <mesh position={[-0.11, 0.08, -0.258]} material={eyeGlow}>
              <sphereGeometry args={[0.028, 6, 6]} />
            </mesh>
            <mesh position={[0.11, 0.08, -0.258]} material={eyeGlow}>
              <sphereGeometry args={[0.028, 6, 6]} />
            </mesh>
            <mesh position={[0, -0.10, -0.24]} material={mouthMat}>
              <boxGeometry args={[0.12, 0.055, 0.03]} />
            </mesh>
            <mesh position={[-0.03, -0.08, -0.255]} material={toothMat}>
              <boxGeometry args={[0.022, 0.025, 0.012]} />
            </mesh>
            <mesh position={[0.03, -0.08, -0.255]} material={toothMat}>
              <boxGeometry args={[0.022, 0.025, 0.012]} />
            </mesh>
            <mesh position={[0, 0.21, 0.02]} material={hairMat}>
              <boxGeometry args={[0.44, 0.10, 0.36]} />
            </mesh>
            <mesh position={[0, 0.14, 0.13]} material={hairMat}>
              <boxGeometry args={[0.38, 0.13, 0.10]} />
            </mesh>
            <mesh position={[0.22, 0.08, 0.05]} material={hairMat}>
              <boxGeometry args={[0.08, 0.20, 0.30]} />
            </mesh>
            <mesh position={[-0.22, 0.08, 0.05]} material={hairMat}>
              <boxGeometry args={[0.08, 0.20, 0.30]} />
            </mesh>
          </group>
        </group>

        {/* BRACCIO SX */}
        <group position={[-0.34, 0.50, 0]} ref={lArmRef}>
          <mesh castShadow receiveShadow position={[0, -0.16, 0]} material={shirtMat}>
            <boxGeometry args={[0.16, 0.32, 0.16]} />
          </mesh>
          <mesh castShadow position={[0, -0.33, 0]} material={skinMat}>
            <sphereGeometry args={[0.085, 6, 6]} />
          </mesh>
          <group position={[0, -0.35, 0]} ref={lForeRef}>
            <mesh castShadow receiveShadow position={[0, -0.13, 0]} material={skinMat}>
              <boxGeometry args={[0.13, 0.26, 0.13]} />
            </mesh>
            <mesh castShadow position={[0, -0.28, -0.01]} material={skinDkMat}>
              <boxGeometry args={[0.12, 0.10, 0.09]} />
            </mesh>
            {([-0.04, 0, 0.04] as number[]).map((x, i) => (
              <mesh key={i} castShadow position={[x, -0.36, -0.01]} material={skinDkMat}>
                <boxGeometry args={[0.028, 0.075, 0.028]} />
              </mesh>
            ))}
          </group>
        </group>

        {/* BRACCIO DX */}
        <group position={[0.34, 0.50, 0]} ref={rArmRef}>
          <mesh castShadow receiveShadow position={[0, -0.16, 0]} material={shirtMat}>
            <boxGeometry args={[0.16, 0.32, 0.16]} />
          </mesh>
          <mesh castShadow position={[0, -0.33, 0]} material={skinMat}>
            <sphereGeometry args={[0.085, 6, 6]} />
          </mesh>
          <group position={[0, -0.35, 0]} ref={rForeRef}>
            <mesh castShadow receiveShadow position={[0, -0.13, 0]} material={skinMat}>
              <boxGeometry args={[0.13, 0.26, 0.13]} />
            </mesh>
            <mesh castShadow position={[0, -0.28, -0.01]} material={skinDkMat}>
              <boxGeometry args={[0.12, 0.10, 0.09]} />
            </mesh>
            {([-0.04, 0, 0.04] as number[]).map((x, i) => (
              <mesh key={i} castShadow position={[x, -0.36, -0.01]} material={skinDkMat}>
                <boxGeometry args={[0.028, 0.075, 0.028]} />
              </mesh>
            ))}
          </group>
        </group>

      </group>
    </group>
  );
}
