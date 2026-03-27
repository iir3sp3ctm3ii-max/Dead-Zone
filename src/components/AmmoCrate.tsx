import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPositionRef } from "./Player";
import { GameStats } from "@/pages/Game";
import { WEAPONS } from "./weapons";

const CRATE_POS = new THREE.Vector3(-25, 0, -25);
const BUY_RANGE = 2.5;

const boxMat   = new THREE.MeshStandardMaterial({ color: "#8b6914", roughness: 0.8, metalness: 0.2 });
const glowMat  = new THREE.MeshStandardMaterial({
  color: "#ffcc33", emissive: new THREE.Color("#ddaa00"),
  roughness: 0.1, metalness: 0.9, emissiveIntensity: 0.5,
});
const strapMat = new THREE.MeshStandardMaterial({ color: "#4a3a00", roughness: 0.85, metalness: 0.3 });
const labelMat = new THREE.MeshBasicMaterial({ color: "#ffee44" });

interface AmmoCrateProps {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onNearChange: (near: boolean) => void;
}

export default function AmmoCrate({ stats, setStats, onNearChange }: AmmoCrateProps) {
  const glowRef  = useRef<THREE.PointLight>(null);
  const crateRef = useRef<THREE.Group>(null);
  const statsRef = useRef(stats);
  const nearRef  = useRef(false);
  const bobTime  = useRef(0);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyE") return;
      if (!nearRef.current) return;
      const s   = statsRef.current;
      const wpn = WEAPONS[s.currentWeapon ?? "pistol"];
      if (s.score < wpn.ammoCost) return;
      setStats(prev => ({
        ...prev,
        score: prev.score - wpn.ammoCost,
        reserveAmmo: wpn.maxReserve,
      }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setStats]);

  useFrame((_, delta) => {
    bobTime.current += delta;
    const dist   = playerPositionRef.current.distanceTo(CRATE_POS.clone().setY(playerPositionRef.current.y));
    const isNear = dist < BUY_RANGE;
    if (isNear !== nearRef.current) {
      nearRef.current = isNear;
      onNearChange(isNear);
    }
    if (glowRef.current)  glowRef.current.intensity = 1.5 + Math.sin(bobTime.current * 3) * 0.5;
    if (crateRef.current) crateRef.current.rotation.y = bobTime.current * 0.4;
  });

  return (
    <group position={[CRATE_POS.x, CRATE_POS.y, CRATE_POS.z]}>
      <group ref={crateRef} position={[0, 0.5, 0]}>
        <mesh material={boxMat} receiveShadow castShadow>
          <boxGeometry args={[0.9, 0.55, 0.55]} />
        </mesh>
        <mesh position={[0, 0.29, 0]}   material={strapMat} receiveShadow castShadow>
          <boxGeometry args={[0.92, 0.06, 0.57]} />
        </mesh>
        <mesh position={[0, -0.29, 0]}  material={strapMat} receiveShadow castShadow>
          <boxGeometry args={[0.92, 0.06, 0.57]} />
        </mesh>
        <mesh position={[0.32, 0, 0]}   material={strapMat} receiveShadow castShadow>
          <boxGeometry args={[0.06, 0.57, 0.57]} />
        </mesh>
        <mesh position={[-0.32, 0, 0]}  material={strapMat} receiveShadow castShadow>
          <boxGeometry args={[0.06, 0.57, 0.57]} />
        </mesh>
        <mesh position={[0, 0, -0.28]}  material={labelMat}>
          <boxGeometry args={[0.5, 0.25, 0.01]} />
        </mesh>
        <mesh position={[0, 0.34, 0]}   material={glowMat} receiveShadow castShadow>
          <boxGeometry args={[0.2, 0.06, 0.2]} />
        </mesh>
      </group>
      <pointLight ref={glowRef} position={[0, 1.2, 0]} color="#ffcc33" intensity={1.5} distance={5} />
    </group>
  );
}
