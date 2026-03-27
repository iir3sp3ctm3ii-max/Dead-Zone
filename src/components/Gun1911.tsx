import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Gun1911Props {
  muzzleFlash: boolean;
  isReloading: boolean;
}

const slideMat = new THREE.MeshLambertMaterial({ color: "#222222" });
const frameMat = new THREE.MeshLambertMaterial({ color: "#1a1a1a" });
const gripMat = new THREE.MeshLambertMaterial({ color: "#0d0d0d" });
const gripCheckMat = new THREE.MeshLambertMaterial({ color: "#2a1a0a" });
const barrelMat = new THREE.MeshLambertMaterial({ color: "#3a3a3a" });
const triggerMat = new THREE.MeshLambertMaterial({ color: "#444444" });
const sightMat = new THREE.MeshLambertMaterial({ color: "#555555" });
const flashMat = new THREE.MeshBasicMaterial({ color: "#ffee88" });
const flashConeMat = new THREE.MeshBasicMaterial({ color: "#ff7700", transparent: true, opacity: 0.85 });

export default function Gun1911({ muzzleFlash, isReloading }: Gun1911Props) {
  const { camera } = useThree();
  const gunGroupRef = useRef<THREE.Group>(null);
  const slideRef = useRef<THREE.Group>(null);
  const reloadAngle = useRef(0);
  const slideOffset = useRef(0);
  const bobTime = useRef(0);
  const shootRecoil = useRef(0);

  useFrame((_, delta) => {
    if (!gunGroupRef.current) return;

    bobTime.current += delta * 5;
    const bob = Math.sin(bobTime.current) * 0.006;
    const bobX = Math.cos(bobTime.current * 0.5) * 0.003;

    const targetRotX = isReloading ? 0.4 : 0;
    reloadAngle.current = THREE.MathUtils.lerp(reloadAngle.current, targetRotX, delta * 5);

    shootRecoil.current = THREE.MathUtils.lerp(shootRecoil.current, 0, delta * 12);

    const targetSlide = isReloading ? 0.06 : 0;
    slideOffset.current = THREE.MathUtils.lerp(slideOffset.current, targetSlide, delta * 6);
    if (slideRef.current) {
      slideRef.current.position.z = slideOffset.current;
    }

    const offset = new THREE.Vector3(0.2 + bobX, -0.20 + bob, -0.42 - shootRecoil.current);
    const worldOffset = offset.applyQuaternion(camera.quaternion);
    gunGroupRef.current.position.copy(camera.position).add(worldOffset);
    gunGroupRef.current.quaternion.copy(camera.quaternion);
    gunGroupRef.current.rotateX(reloadAngle.current + shootRecoil.current * 0.5);
  });

  if (muzzleFlash) {
    shootRecoil.current = 0.035;
  }

  return (
    <group ref={gunGroupRef}>
      <group scale={[1, 1, 1]}>

        <mesh position={[0, 0.012, 0.02]} material={frameMat}>
          <boxGeometry args={[0.058, 0.10, 0.28]} />
        </mesh>

        <group ref={slideRef}>
          <mesh position={[0, 0.032, 0.03]} material={slideMat}>
            <boxGeometry args={[0.056, 0.065, 0.24]} />
          </mesh>
          <mesh position={[0, 0.032, -0.08]} material={slideMat}>
            <boxGeometry args={[0.057, 0.068, 0.02]} />
          </mesh>
          <mesh position={[0, 0.032, 0.12]} material={slideMat}>
            <boxGeometry args={[0.057, 0.068, 0.02]} />
          </mesh>
          <mesh position={[0.015, 0.055, 0.04]} material={sightMat}>
            <boxGeometry args={[0.006, 0.01, 0.012]} />
          </mesh>
          <mesh position={[-0.015, 0.055, 0.04]} material={sightMat}>
            <boxGeometry args={[0.006, 0.01, 0.012]} />
          </mesh>
          <mesh position={[0, 0.057, -0.06]} material={sightMat}>
            <boxGeometry args={[0.016, 0.014, 0.008]} />
          </mesh>
          <mesh position={[0, 0.032, 0.04]}>
            <boxGeometry args={[0.01, 0.05, 0.08]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>

        <mesh position={[0, 0.012, 0.155]} material={barrelMat}>
          <cylinderGeometry args={[0.0085, 0.0085, 0.06, 8]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        <mesh position={[0, 0.012, 0.16]} rotation={[Math.PI / 2, 0, 0]} material={barrelMat}>
          <cylinderGeometry args={[0.0085, 0.0085, 0.09, 8]} />
        </mesh>

        <mesh position={[0, -0.055, 0.01]} material={gripMat}>
          <boxGeometry args={[0.052, 0.09, 0.095]} />
        </mesh>
        <mesh position={[0.027, -0.055, 0.01]} material={gripCheckMat}>
          <boxGeometry args={[0.002, 0.08, 0.088]} />
        </mesh>
        <mesh position={[-0.027, -0.055, 0.01]} material={gripCheckMat}>
          <boxGeometry args={[0.002, 0.08, 0.088]} />
        </mesh>

        <mesh position={[0, -0.095, 0.01]} material={frameMat}>
          <boxGeometry args={[0.054, 0.015, 0.02]} />
        </mesh>

        <mesh position={[0, -0.025, 0.08]} material={frameMat}>
          <boxGeometry args={[0.055, 0.03, 0.04]} />
        </mesh>
        <mesh position={[0, -0.04, 0.055]} material={triggerMat}>
          <boxGeometry args={[0.006, 0.024, 0.01]} />
        </mesh>

        <mesh position={[0, 0.015, -0.1]} material={frameMat}>
          <boxGeometry args={[0.045, 0.028, 0.02]} />
        </mesh>
        <mesh position={[0, 0.015, -0.115]} material={sightMat}>
          <boxGeometry args={[0.008, 0.018, 0.005]} />
        </mesh>

        {muzzleFlash && (
          <group position={[0, 0.012, 0.21]}>
            <pointLight color="#ff9933" intensity={8} distance={3} />
            <mesh material={flashMat}>
              <sphereGeometry args={[0.022, 6, 6]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={flashConeMat}>
              <coneGeometry args={[0.013, 0.055, 6]} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={flashConeMat}>
              <coneGeometry args={[0.008, 0.03, 5]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
