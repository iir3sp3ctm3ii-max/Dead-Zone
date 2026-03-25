// Player.tsx — aggiornato con supporto joystick mobile
import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { GameStats } from "@/pages/Game";
import Gun1911 from "./gun-1911-wrapper.tsx";
import { isPausedRef } from "./GameScene";
import { mobileJoystickRef, mobileActionsRef } from "./MobileControls";

const MOVE_SPEED = 5;
const PLAYER_HEIGHT = 1.9;

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
}

interface PlayerProps {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onGameOver: () => void;
}

export interface BulletData {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  alive: boolean;
}

export const playerPositionRef = { current: new THREE.Vector3(0, PLAYER_HEIGHT, 0) };
export const bulletsRef: { current: BulletData[] } = { current: [] };
let bulletIdCounter = 0;

export default function Player({ stats, setStats, onGameOver }: PlayerProps) {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls<Controls>();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const muzzleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef = useRef(stats);
  const isDeadRef = useRef(false);

  const healthRegenTimer = useRef<NodeJS.Timeout | null>(null);

  const gunshotAudio = useRef(new Audio('/sounds/gunshot.mp3'));
  const reloadingAudio = useRef(new Audio('/sounds/reloading.mp3'));
  const walkingAudio = useRef(new Audio('/sounds/walking.mp3'));

  const walkingStepTimeRef = useRef(0);
  const walkingNextStepTimeRef = useRef(0.45);
  const wasMovingRef = useRef(false);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // 🩸 REGEN salute +20 ogni 10s
  useEffect(() => {
    healthRegenTimer.current = setInterval(() => {
      if (isPausedRef.current || isDeadRef.current) return;
      setStats(prev => {
        if (prev.health >= 100) return prev;
        return { ...prev, health: Math.min(100, prev.health + 20) };
      });
    }, 10000);
    return () => {
      if (healthRegenTimer.current) clearInterval(healthRegenTimer.current);
    };
  }, [setStats]);

  const shoot = useCallback(() => {
    const s = statsRef.current;
    if (s.ammo <= 0 || s.isReloading || isDeadRef.current || isPausedRef.current) return;

    setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));

    const bulletDir = new THREE.Vector3();
    camera.getWorldDirection(bulletDir);
    bulletDir.normalize();

    const bulletPos = camera.position.clone().add(bulletDir.clone().multiplyScalar(0.5));

    bulletsRef.current.push({
      id: bulletIdCounter++,
      position: bulletPos,
      direction: bulletDir,
      alive: true,
    });

    setMuzzleFlash(true);
    if (muzzleTimer.current) clearTimeout(muzzleTimer.current);
    muzzleTimer.current = setTimeout(() => setMuzzleFlash(false), 80);

    gunshotAudio.current.volume = 0.7;
    gunshotAudio.current.currentTime = 0;
    gunshotAudio.current.play().catch(() => {});
  }, [camera, setStats]);

  const reload = useCallback(() => {
    const s = statsRef.current;
    if (s.isReloading || s.ammo === s.maxAmmo || s.reserveAmmo === 0 || isPausedRef.current) return;

    setStats(prev => ({ ...prev, isReloading: true }));

    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      setStats(prev => {
        const needed = prev.maxAmmo - prev.ammo;
        const toAdd = Math.min(needed, prev.reserveAmmo);
        return { ...prev, ammo: prev.ammo + toAdd, reserveAmmo: prev.reserveAmmo - toAdd, isReloading: false };
      });
    }, 1800);

    reloadingAudio.current.volume = 0.5;
    reloadingAudio.current.currentTime = 0;
    reloadingAudio.current.play().catch(() => {});
  }, [setStats]);

  // ✅ Registra shoot/reload nei ref globali → usati dai pulsanti mobile
  useEffect(() => {
    mobileActionsRef.shoot = shoot;
    mobileActionsRef.reload = reload;
    return () => {
      mobileActionsRef.shoot = null;
      mobileActionsRef.reload = null;
    };
  }, [shoot, reload]);

  // 🎮 Input tastiera + mouse (desktop)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement && e.button === 0 && !isPausedRef.current) {
        shoot();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyR" && !isPausedRef.current) reload();
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shoot, reload]);

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (isPausedRef.current || isDeadRef.current) return;

    const { forward, back, left, right } = getKeys();

    // 📱 Joystick mobile
    const jx = mobileJoystickRef.current.x;
    const jy = mobileJoystickRef.current.y;
    const DZ = 0.12; // dead zone
    const mFwd   = jy < -DZ;
    const mBack  = jy >  DZ;
    const mLeft  = jx < -DZ;
    const mRight = jx >  DZ;

    direction.current.set(0, 0, 0);
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();
    const sideDir = new THREE.Vector3(-cameraDir.z, 0, cameraDir.x);

    const goFwd   = forward || mFwd;
    const goBack  = back    || mBack;
    const goLeft  = left    || mLeft;
    const goRight = right   || mRight;

    // Velocità proporzionale alla deflessione del joystick
    if (goFwd)   direction.current.addScaledVector(cameraDir,  mFwd   ? Math.abs(jy) : 1);
    if (goBack)  direction.current.addScaledVector(cameraDir,  mBack  ? -Math.abs(jy) : -1);
    if (goLeft)  direction.current.addScaledVector(sideDir,    mLeft  ? -Math.abs(jx) : -1);
    if (goRight) direction.current.addScaledVector(sideDir,    mRight ? Math.abs(jx) : 1);

    if (direction.current.length() > 0) direction.current.normalize();

    velocity.current.lerp(
      direction.current.clone().multiplyScalar(MOVE_SPEED),
      0.15
    );

    camera.position.addScaledVector(velocity.current, delta);

    const BOUNDS = 28;
    camera.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, camera.position.x));
    camera.position.z = Math.max(-BOUNDS, Math.min(BOUNDS, camera.position.z));
    camera.position.y = PLAYER_HEIGHT;

    playerPositionRef.current.copy(camera.position);

    // 🔊 Passi
    const isMoving = goFwd || goBack || goLeft || goRight;
    if (isMoving) {
      walkingStepTimeRef.current += delta;
      if (walkingStepTimeRef.current >= walkingNextStepTimeRef.current) {
        walkingAudio.current.volume = 0.4;
        walkingAudio.current.currentTime = 0;
        walkingAudio.current.play().catch(() => {});
        walkingNextStepTimeRef.current = 0.6 + Math.random() * 0.3;
        walkingStepTimeRef.current = 0;
      }
    } else if (wasMovingRef.current) {
      walkingAudio.current.pause();
      walkingAudio.current.currentTime = 0;
      walkingStepTimeRef.current = 0;
    }
    wasMovingRef.current = isMoving;

    bulletsRef.current = bulletsRef.current.filter(b => b.alive);
    bulletsRef.current.forEach(bullet => {
      bullet.position.addScaledVector(bullet.direction, 40 * delta);
      if (bullet.position.distanceTo(camera.position) > 80) bullet.alive = false;
      if (bullet.position.y < 0) bullet.alive = false;
    });

    if (statsRef.current.health <= 0 && !isDeadRef.current) {
      isDeadRef.current = true;
      onGameOver();
    }
  });

  return (
    <Gun1911
      muzzleFlash={muzzleFlash}
      isReloading={stats.isReloading}
    />
  );
}
