import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPositionRef } from "./Player";
import { GameStats } from "@/pages/Game";
import { WEAPONS, WeaponId } from "./weapons";

const BUY_RANGE = 2.8;
const Z = 0.005; // spessore linee outline

// ── MATERIALI ─────────────────────────────────────────────────
const woodPlanks = new THREE.MeshStandardMaterial({
  color: "#4a2e10", roughness: 0.92, metalness: 0.0,
});
const woodDark = new THREE.MeshStandardMaterial({
  color: "#2e1a08", roughness: 0.95, metalness: 0.0,
});

// Outline glow — cambiano solo per stato
function makeGlowMat(hex: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: new THREE.Color(hex),
    emissiveIntensity: 4.0,
    roughness: 0.0,
    metalness: 0.0,
  });
}
const matWhite = makeGlowMat("#cceeff");
const matBlue  = makeGlowMat("#44aaff");
const matGreen = makeGlowMat("#44ff88");

// ─────────────────────────────────────────────────────────────
// OUTLINE — ogni "linea" è un box molto piatto e sottile.
// Disegniamo solo il PERIMETRO della sagoma, non il riempimento.
// ─────────────────────────────────────────────────────────────

// Shotgun outline — pump-action visto di lato
// Misure: larghezza totale ~0.90, altezza ~0.28
function ShotgunOutline({ mat }: { mat: THREE.Material }) {
  const T = 0.025; // spessore linea
  return (
    <group>
      {/* === CANNA === */}
      {/* Top canna */}
      <mesh position={[-0.26, 0.115, Z]} material={mat}><boxGeometry args={[0.42, T, Z]} /></mesh>
      {/* Bottom canna */}
      <mesh position={[-0.26, 0.068, Z]} material={mat}><boxGeometry args={[0.42, T, Z]} /></mesh>
      {/* Punta canna (sinistra) */}
      <mesh position={[-0.465, 0.092, Z]} material={mat}><boxGeometry args={[T, 0.05, Z]} /></mesh>

      {/* === PUMP === */}
      <mesh position={[-0.18, 0.040, Z]} material={mat}><boxGeometry args={[0.22, T, Z]} /></mesh>
      <mesh position={[-0.18, -0.002, Z]} material={mat}><boxGeometry args={[0.22, T, Z]} /></mesh>
      {/* Lato sinistro pump */}
      <mesh position={[-0.285, 0.020, Z]} material={mat}><boxGeometry args={[T, 0.045, Z]} /></mesh>

      {/* === CORPO RECEIVER === */}
      {/* Top receiver */}
      <mesh position={[0.05, 0.115, Z]} material={mat}><boxGeometry args={[0.22, T, Z]} /></mesh>
      {/* Bottom receiver */}
      <mesh position={[0.05, 0.020, Z]} material={mat}><boxGeometry args={[0.22, T, Z]} /></mesh>
      {/* Lato sinistro receiver (giunzione canna) */}
      <mesh position={[-0.052, 0.068, Z]} material={mat}><boxGeometry args={[T, 0.100, Z]} /></mesh>
      {/* Lato destro receiver */}
      <mesh position={[0.155, 0.068, Z]} material={mat}><boxGeometry args={[T, 0.100, Z]} /></mesh>

      {/* === IMPUGNATURA === */}
      <mesh position={[0.08, -0.020, Z]} material={mat}><boxGeometry args={[0.065, T, Z]} /></mesh>
      <mesh position={[0.08, -0.120, Z]} material={mat}><boxGeometry args={[0.065, T, Z]} /></mesh>
      <mesh position={[0.047, -0.070, Z]} material={mat}><boxGeometry args={[T, 0.105, Z]} /></mesh>
      <mesh position={[0.113, -0.070, Z]} material={mat}><boxGeometry args={[T, 0.105, Z]} /></mesh>

      {/* === CALCIO === */}
      <mesh position={[0.255, 0.090, Z]} material={mat}><boxGeometry args={[0.18, T, Z]} /></mesh>
      <mesh position={[0.255, 0.018, Z]} material={mat}><boxGeometry args={[0.18, T, Z]} /></mesh>
      <mesh position={[0.342, 0.054, Z]} material={mat}><boxGeometry args={[T, 0.075, Z]} /></mesh>
      {/* Giunzione calcio-receiver */}
      <mesh position={[0.168, 0.054, Z]} material={mat}><boxGeometry args={[T, 0.075, Z]} /></mesh>

      {/* === MIRINO ANTERIORE === */}
      <mesh position={[-0.44, 0.130, Z]} material={mat}><boxGeometry args={[0.015, 0.028, Z]} /></mesh>
    </group>
  );
}

// SMG outline — stile MP5/UZI visto di lato
function SmgOutline({ mat }: { mat: THREE.Material }) {
  const T = 0.025;
  return (
    <group>
      {/* === CANNA === */}
      <mesh position={[-0.28, 0.100, Z]} material={mat}><boxGeometry args={[0.20, T, Z]} /></mesh>
      <mesh position={[-0.28, 0.060, Z]} material={mat}><boxGeometry args={[0.20, T, Z]} /></mesh>
      <mesh position={[-0.368, 0.080, Z]} material={mat}><boxGeometry args={[T, 0.042, Z]} /></mesh>

      {/* === CORPO === */}
      <mesh position={[0.00, 0.100, Z]} material={mat}><boxGeometry args={[0.32, T, Z]} /></mesh>
      <mesh position={[0.00, 0.010, Z]} material={mat}><boxGeometry args={[0.32, T, Z]} /></mesh>
      <mesh position={[-0.148, 0.055, Z]} material={mat}><boxGeometry args={[T, 0.094, Z]} /></mesh>
      <mesh position={[ 0.168, 0.055, Z]} material={mat}><boxGeometry args={[T, 0.094, Z]} /></mesh>

      {/* === CALCIO PIEGHEVOLE === */}
      <mesh position={[0.245, 0.075, Z]} material={mat}><boxGeometry args={[0.13, T, Z]} /></mesh>
      <mesh position={[0.245, 0.030, Z]} material={mat}><boxGeometry args={[0.13, T, Z]} /></mesh>
      <mesh position={[0.308, 0.053, Z]} material={mat}><boxGeometry args={[T, 0.048, Z]} /></mesh>
      {/* Cerniera calcio */}
      <mesh position={[0.178, 0.053, Z]} material={mat}><boxGeometry args={[T, 0.048, Z]} /></mesh>

      {/* === IMPUGNATURA === */}
      <mesh position={[0.07, -0.015, Z]} material={mat}><boxGeometry args={[0.060, T, Z]} /></mesh>
      <mesh position={[0.07, -0.115, Z]} material={mat}><boxGeometry args={[0.060, T, Z]} /></mesh>
      <mesh position={[0.040, -0.065, Z]} material={mat}><boxGeometry args={[T, 0.103, Z]} /></mesh>
      <mesh position={[0.100, -0.065, Z]} material={mat}><boxGeometry args={[T, 0.103, Z]} /></mesh>

      {/* === CARICATORE === */}
      <mesh position={[-0.020, -0.015, Z]} material={mat}><boxGeometry args={[0.055, T, Z]} /></mesh>
      <mesh position={[-0.020, -0.135, Z]} material={mat}><boxGeometry args={[0.055, T, Z]} /></mesh>
      <mesh position={[-0.048, -0.075, Z]} material={mat}><boxGeometry args={[T, 0.124, Z]} /></mesh>
      <mesh position={[0.010, -0.075, Z]} material={mat}><boxGeometry args={[T, 0.124, Z]} /></mesh>

      {/* === MIRINO === */}
      <mesh position={[-0.10, 0.118, Z]} material={mat}><boxGeometry args={[0.030, 0.025, Z]} /></mesh>
      <mesh position={[ 0.05, 0.115, Z]} material={mat}><boxGeometry args={[0.035, 0.018, Z]} /></mesh>
    </group>
  );
}

// ── TAVOLA DI LEGNO + OUTLINE ─────────────────────────────────
function WeaponPanel({
  weaponId, worldPos, rotY, stats, setStats, onNearChange,
}: {
  weaponId: WeaponId;
  worldPos: [number, number, number];
  rotY: number;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onNearChange: (id: WeaponId, near: boolean) => void;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const nearRef  = useRef(false);
  const statsRef = useRef(stats);
  const t        = useRef(0);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyF" || !nearRef.current) return;
      const s        = statsRef.current;
      const wpn      = WEAPONS[weaponId];
      const unlocked = s.unlockedWeapons ?? ["pistol"];

      if (unlocked.includes(weaponId)) {
        if (s.score < wpn.ammoCost) return;
        setStats(prev => ({
          ...prev,
          score:         prev.score - wpn.ammoCost,
          reserveAmmo:   prev.currentWeapon === weaponId ? wpn.maxReserve : prev.reserveAmmo,
          weaponReserve: { ...(prev.weaponReserve ?? {}), [weaponId]: wpn.maxReserve },
        }));
      } else {
        if (s.score < wpn.cost) return;
        setStats(prev => ({
          ...prev,
          score:           prev.score - wpn.cost,
          unlockedWeapons: [...unlocked, weaponId],
          currentWeapon:   weaponId,
          ammo:            wpn.maxAmmo,
          maxAmmo:         wpn.maxAmmo,
          reserveAmmo:     wpn.maxReserve,
          isReloading:     false,
          weaponAmmo:    { ...(prev.weaponAmmo    ?? {}), [weaponId]: wpn.maxAmmo    },
          weaponReserve: { ...(prev.weaponReserve ?? {}), [weaponId]: wpn.maxReserve },
        }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setStats, weaponId]);

  useFrame((_, delta) => {
    t.current += delta;
    const pp     = playerPositionRef.current.clone().setY(0);
    const wp     = new THREE.Vector3(...worldPos).setY(0);
    const isNear = pp.distanceTo(wp) < BUY_RANGE;
    if (isNear !== nearRef.current) {
      nearRef.current = isNear;
      onNearChange(weaponId, isNear);
    }
    if (lightRef.current) {
      const isOwned = (statsRef.current.unlockedWeapons ?? ["pistol"]).includes(weaponId);
      lightRef.current.color.set(isOwned ? "#44ff88" : "#aaddff");
      const base = isNear ? 3.0 : 1.2;
      lightRef.current.intensity = base + Math.sin(t.current * 3.0) * 0.5;
    }
  });

  const isOwned  = (stats.unlockedWeapons ?? ["pistol"]).includes(weaponId);
  const glowMat  = isOwned ? matGreen : weaponId === "shotgun" ? matWhite : matBlue;
  const litColor = isOwned ? "#44ff88" : "#aaddff";

  return (
    <group position={worldPos} rotation={[0, rotY, 0]}>

      {/* ── TAVOLA DI LEGNO ─────────────────────────────────── */}
      {/* Tavola principale */}
      <mesh position={[0, 0.05, -0.06]} material={woodPlanks} castShadow receiveShadow>
        <boxGeometry args={[1.30, 0.90, 0.08]} />
      </mesh>
      {/* Listello orizzontale top */}
      <mesh position={[0, 0.47, -0.02]} material={woodDark} castShadow>
        <boxGeometry args={[1.34, 0.06, 0.10]} />
      </mesh>
      {/* Listello orizzontale bottom */}
      <mesh position={[0, -0.38, -0.02]} material={woodDark} castShadow>
        <boxGeometry args={[1.34, 0.06, 0.10]} />
      </mesh>
      {/* Bulloni angoli */}
      {([-0.55, 0.55] as number[]).flatMap(x =>
        ([0.38, -0.30] as number[]).map((y, j) => (
          <mesh key={`${x}-${j}`} position={[x, y, 0.06]}
            rotation={[Math.PI/2, 0, 0]}
            material={woodDark}>
            <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
          </mesh>
        ))
      )}

      {/* ── OUTLINE ARMA SUL LEGNO ──────────────────────────── */}
      {/* Scale 1.6 per riempire bene la tavola */}
      <group scale={[1.55, 1.55, 1]} position={[0, 0.08, 0.02]}>
        {weaponId === "shotgun"
          ? <ShotgunOutline mat={glowMat} />
          : <SmgOutline     mat={glowMat} />
        }
      </group>

      {/* Luce che illumina la tavola */}
      <pointLight
        ref={lightRef}
        position={[0, 0.05, 0.5]}
        color={litColor}
        intensity={1.2}
        distance={4.0}
      />
    </group>
  );
}

// ── EXPORT ────────────────────────────────────────────────────
export default function WeaponWalls({
  stats, setStats, onNearChange,
}: {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onNearChange: (id: WeaponId, near: boolean) => void;
}) {
  return (
    <>
      {/* Shotgun — muro OVEST, opposto all'SMG, guarda verso X+ */}
      <WeaponPanel
        weaponId="shotgun"
        worldPos={[-28.8, 1.6, 3]}
        rotY={Math.PI / 2}
        stats={stats} setStats={setStats} onNearChange={onNearChange}
      />
      {/* SMG — muro EST */}
      <WeaponPanel
        weaponId="smg"
        worldPos={[28.8, 1.6, 3]}
        rotY={-Math.PI / 2}
        stats={stats} setStats={setStats} onNearChange={onNearChange}
      />
    </>
  );
}