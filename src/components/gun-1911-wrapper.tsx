import { useRef, useEffect } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { WeaponId } from "./weapons";

interface Props {
  muzzleFlash: boolean;
  isReloading: boolean;
  weaponId: WeaponId;
}

const metalDarkMat  = new THREE.MeshLambertMaterial({ color: "#1a1a1a" });
const metalMidMat   = new THREE.MeshLambertMaterial({ color: "#2e2e2e" });
const metalLightMat = new THREE.MeshLambertMaterial({ color: "#444444" });
const stockMat      = new THREE.MeshLambertMaterial({ color: "#3b2510" });
const flashMat      = new THREE.MeshBasicMaterial({ color: "#ffee88" });
const flashConeMat  = new THREE.MeshBasicMaterial({ color: "#ff7700", transparent: true, opacity: 0.85 });

// ── SHOTGUN — canna verso Z- ──────────────────────────────────
function ShotgunModel({ muzzleFlash }: { muzzleFlash: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.01, -0.10]} rotation={[Math.PI/2, 0, 0]} material={metalDarkMat}>
        <cylinderGeometry args={[0.018, 0.018, 0.50, 8]} />
      </mesh>
      <mesh position={[0, -0.022, -0.10]} rotation={[Math.PI/2, 0, 0]} material={metalMidMat}>
        <cylinderGeometry args={[0.013, 0.013, 0.34, 8]} />
      </mesh>
      <mesh position={[0, 0.008, 0.06]} material={metalDarkMat}>
        <boxGeometry args={[0.048, 0.058, 0.22]} />
      </mesh>
      <mesh position={[0, -0.018, -0.06]} material={stockMat}>
        <boxGeometry args={[0.038, 0.038, 0.09]} />
      </mesh>
      <mesh position={[0, -0.005, 0.195]} material={stockMat}>
        <boxGeometry args={[0.042, 0.068, 0.12]} />
      </mesh>
      <mesh position={[0, -0.058, 0.13]} material={stockMat}>
        <boxGeometry args={[0.036, 0.072, 0.038]} />
      </mesh>
      <mesh position={[0, -0.032, 0.09]} material={metalLightMat}>
        <boxGeometry args={[0.006, 0.022, 0.009]} />
      </mesh>
      <mesh position={[0, 0.024, -0.32]} material={metalLightMat}>
        <boxGeometry args={[0.005, 0.009, 0.007]} />
      </mesh>
      {muzzleFlash && (
        <group position={[0, 0.01, -0.37]}>
          <pointLight color="#ff9933" intensity={10} distance={4} />
          <mesh material={flashMat}><sphereGeometry args={[0.032, 6, 6]} /></mesh>
          <mesh rotation={[Math.PI/2, 0, 0]} material={flashConeMat}>
            <coneGeometry args={[0.02, 0.07, 6]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── SMG — canna verso Z- ──────────────────────────────────────
function SmgModel({ muzzleFlash }: { muzzleFlash: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.012, -0.02]} material={metalDarkMat}>
        <boxGeometry args={[0.044, 0.072, 0.26]} />
      </mesh>
      <mesh position={[0, 0.012, -0.175]} rotation={[Math.PI/2, 0, 0]} material={metalMidMat}>
        <cylinderGeometry args={[0.009, 0.009, 0.11, 8]} />
      </mesh>
      <mesh position={[0, -0.068, 0.01]} material={metalMidMat}>
        <boxGeometry args={[0.036, 0.095, 0.028]} />
      </mesh>
      <mesh position={[0, -0.052, 0.065]} material={metalDarkMat}>
        <boxGeometry args={[0.038, 0.075, 0.032]} />
      </mesh>
      <mesh position={[0, 0.008, 0.155]} material={metalLightMat}>
        <boxGeometry args={[0.028, 0.018, 0.08]} />
      </mesh>
      <mesh position={[0, -0.016, 0.185]} material={metalLightMat}>
        <boxGeometry args={[0.028, 0.032, 0.015]} />
      </mesh>
      <mesh position={[0, -0.022, 0.028]} material={metalLightMat}>
        <boxGeometry args={[0.006, 0.020, 0.009]} />
      </mesh>
      <mesh position={[0, 0.05, -0.04]} material={metalLightMat}>
        <boxGeometry args={[0.014, 0.008, 0.006]} />
      </mesh>
      <mesh position={[0, 0.052, 0.02]} material={metalMidMat}>
        <boxGeometry args={[0.016, 0.006, 0.18]} />
      </mesh>
      {muzzleFlash && (
        <group position={[0, 0.012, -0.24]}>
          <pointLight color="#ff9933" intensity={6} distance={3} />
          <mesh material={flashMat}><sphereGeometry args={[0.018, 6, 6]} /></mesh>
          <mesh rotation={[Math.PI/2, 0, 0]} material={flashConeMat}>
            <coneGeometry args={[0.012, 0.045, 6]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── PISTOLA ───────────────────────────────────────────────────
function PistolModel({ muzzleFlash }: { muzzleFlash: boolean }) {
  const obj = useLoader(OBJLoader, '/models/pistol1911.obj');
  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.color.setHex(0x2a2a2a);
        child.material.metalness = 0.9;
        child.material.roughness = 0.2;
      }
    });
  }, [obj]);
  return (
    <group scale={0.005} rotation={[0, Math.PI, 0]}>
      <primitive object={obj} />
      {muzzleFlash && (
        <pointLight position={[0.6, 0.25, -3.5]} intensity={3} distance={6} color="#ffffaa" />
      )}
    </group>
  );
}

// ── WRAPPER ───────────────────────────────────────────────────
export default function GunWrapper({ muzzleFlash, isReloading, weaponId }: Props) {
  const gunRef      = useRef<THREE.Group>(null);
  const { camera }  = useThree();

  // Tutti i valori smoothati come ref — zero allocazioni ogni frame
  const bobTime     = useRef(0);
  const recoil      = useRef(0);
  const reloadAngle = useRef(0);
  const reloadMoveY = useRef(0);
  const swayX       = useRef(0);
  const swayY       = useRef(0);
  const bobY        = useRef(0);
  const bobX        = useRef(0);
  const posX        = useRef(0);
  const posY        = useRef(0);
  const posZ        = useRef(0);
  const prevWeapon  = useRef(weaponId);

  // Reset al cambio arma
  useEffect(() => {
    if (prevWeapon.current !== weaponId && gunRef.current) {
      gunRef.current.quaternion.copy(camera.quaternion);
      reloadAngle.current = 0;
      reloadMoveY.current = 0;
      recoil.current      = 0;
    }
    prevWeapon.current = weaponId;
  }, [weaponId, camera]);

  const recoilAmt = weaponId === "shotgun" ? 0.14 : weaponId === "smg" ? 0.04 : 0.08;
  const xBase     = weaponId === "shotgun" ? 0.30 : weaponId === "smg" ? 0.34 : 0.38;

  useFrame((_, delta) => {
    if (!gunRef.current) return;

    // Velocità bob in base all'arma
    const bobSpeed = weaponId === "shotgun" ? 2.0 : weaponId === "smg" ? 2.8 : 2.4;
    bobTime.current += delta * bobSpeed;

    // ── Recoil — recupero rapido poi rallenta (ease-out)
    recoil.current = THREE.MathUtils.lerp(recoil.current, 0, delta * 14);

    // ── Ricarica — angolo e discesa fluidi con smoothstep
    const reloadTarget = isReloading ? 0.38 : 0;
    reloadAngle.current = THREE.MathUtils.lerp(reloadAngle.current, reloadTarget, delta * 7);
    const reloadYTarget = isReloading ? -0.14 : 0;
    reloadMoveY.current = THREE.MathUtils.lerp(reloadMoveY.current, reloadYTarget, delta * 6);

    // ── Bob — sin/cos per movimento naturale
    const targetBobY = Math.sin(bobTime.current) * 0.008;
    const targetBobX = Math.cos(bobTime.current * 0.5) * 0.003;
    bobY.current = THREE.MathUtils.lerp(bobY.current, targetBobY, delta * 12);
    bobX.current = THREE.MathUtils.lerp(bobX.current, targetBobX, delta * 12);

    // ── Sway — movimento molto lento e morbido
    const targetSwayX = Math.sin(bobTime.current * 0.6) * 0.003;
    const targetSwayY = Math.sin(bobTime.current * 0.4) * 0.002;
    swayX.current = THREE.MathUtils.lerp(swayX.current, targetSwayX, delta * 8);
    swayY.current = THREE.MathUtils.lerp(swayY.current, targetSwayY, delta * 8);

    // ── Posizione target
    const targetX = xBase + bobX.current + swayX.current;
    const targetY = -0.20 + bobY.current + swayY.current + reloadMoveY.current;
    const targetZ = -0.44 - recoil.current;

    // Lerp posizione per smussare anche i movimenti bruschi
    posX.current = THREE.MathUtils.lerp(posX.current, targetX, delta * 20);
    posY.current = THREE.MathUtils.lerp(posY.current, targetY, delta * 20);
    posZ.current = THREE.MathUtils.lerp(posZ.current, targetZ, delta * 20);

    const offset = new THREE.Vector3(posX.current, posY.current, posZ.current);
    gunRef.current.position.copy(camera.position).add(offset.applyQuaternion(camera.quaternion));

    // ── Quaternion — tilt ricarica fluido
    const tiltQ = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      reloadAngle.current
    );
    gunRef.current.quaternion.copy(camera.quaternion).multiply(tiltQ);
  });

  if (muzzleFlash) recoil.current = recoilAmt;

  return (
    <group ref={gunRef}>
      {weaponId === "pistol"  && <PistolModel  muzzleFlash={muzzleFlash} />}
      {weaponId === "shotgun" && <ShotgunModel muzzleFlash={muzzleFlash} />}
      {weaponId === "smg"     && <SmgModel     muzzleFlash={muzzleFlash} />}
    </group>
  );
}