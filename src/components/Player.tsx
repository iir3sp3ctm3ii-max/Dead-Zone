import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { GameStats } from "@/pages/Game";
import GunWrapper from "./gun-1911-wrapper";
import { isPausedRef } from "./GameScene";
import { WEAPONS, WEAPON_ORDER, WeaponId } from "./weapons";
import { mobileJoystick, mobileLook, isMobile } from "./MobileControls";

const MOVE_SPEED    = 5;
const PLAYER_HEIGHT = 1.9;

enum Controls {
  forward = "forward",
  back    = "back",
  left    = "left",
  right   = "right",
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
  damage: number;
}

export const playerPositionRef = { current: new THREE.Vector3(0, PLAYER_HEIGHT, 0) };
export const bulletsRef: { current: BulletData[] } = { current: [] };
export const mobileShootRef:  { fn: (() => void) | null } = { fn: null };
export const mobileReloadRef: { fn: (() => void) | null } = { fn: null };
export const mobileSwitchRef: { fn: ((d: 1|-1) => void) | null } = { fn: null };
let bulletIdCounter = 0;

export default function Player({ stats, setStats, onGameOver }: PlayerProps) {
  const { camera }        = useThree();
  const [, getKeys]       = useKeyboardControls<Controls>();
  const velocity          = useRef(new THREE.Vector3());
  const direction         = useRef(new THREE.Vector3());
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const muzzleTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsRef          = useRef(stats);
  const isDeadRef         = useRef(false);
  const healthRegenTimer  = useRef<NodeJS.Timeout | null>(null);
  const mouseDownRef      = useRef(false);
  const autoFireTimer     = useRef(0);

  const gunshotAudio   = useRef(new Audio('/sounds/gunshot.mp3'));
  const reloadingAudio = useRef(new Audio('/sounds/reloading.mp3'));
  const walkingAudio   = useRef(new Audio('/sounds/walking.mp3'));
  const walkingStepTimeRef     = useRef(0);
  const walkingNextStepTimeRef = useRef(0.45);
  const wasMovingRef           = useRef(false);

  useEffect(() => { statsRef.current = stats; }, [stats]);

  // Regen salute
  useEffect(() => {
    healthRegenTimer.current = setInterval(() => {
      if (isPausedRef.current || isDeadRef.current) return;
      setStats(prev => {
        if (prev.health >= 100) return prev;
        return { ...prev, health: Math.min(100, prev.health + 20) };
      });
    }, 10000);
    return () => { if (healthRegenTimer.current) clearInterval(healthRegenTimer.current); };
  }, [setStats]);

  // ── SPARO ──────────────────────────────────────────────────
  const _shootDir = useRef(new THREE.Vector3());
  const _shootPos = useRef(new THREE.Vector3());

  const shoot = useCallback(() => {
    const s   = statsRef.current;
    const wpn = WEAPONS[s.currentWeapon ?? "pistol"];
    if (s.ammo <= 0 || s.isReloading || isDeadRef.current || isPausedRef.current) return;

    setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));

    camera.getWorldDirection(_shootDir.current);
    _shootDir.current.normalize();

    for (let i = 0; i < wpn.pellets; i++) {
      const dir = _shootDir.current.clone(); // clone solo per i pellet — necessario
      if (wpn.spread > 0) {
        dir.x += (Math.random() - 0.5) * wpn.spread * 2;
        dir.y += (Math.random() - 0.5) * wpn.spread;
        dir.z += (Math.random() - 0.5) * wpn.spread * 2;
        dir.normalize();
      }
      _shootPos.current.copy(camera.position).addScaledVector(dir, 0.5);
      bulletsRef.current.push({
        id: bulletIdCounter++,
        position: _shootPos.current.clone(),
        direction: dir,
        alive: true,
        damage: wpn.damage,
      });
    }

    setMuzzleFlash(true);
    if (muzzleTimer.current) clearTimeout(muzzleTimer.current);
    muzzleTimer.current = setTimeout(() => setMuzzleFlash(false), 80);

    gunshotAudio.current.volume = wpn.id === "shotgun" ? 0.85 : wpn.id === "smg" ? 0.45 : 0.7;
    gunshotAudio.current.currentTime = 0;
    gunshotAudio.current.play().catch(() => {});
  }, [camera, setStats]);

  // ── RICARICA ───────────────────────────────────────────────
  const reload = useCallback(() => {
    const s   = statsRef.current;
    const wpn = WEAPONS[s.currentWeapon ?? "pistol"];
    if (s.isReloading || s.ammo === wpn.maxAmmo || s.reserveAmmo === 0 || isPausedRef.current) return;

    setStats(prev => ({ ...prev, isReloading: true }));
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      setStats(prev => {
        const w      = WEAPONS[prev.currentWeapon ?? "pistol"];
        const needed = w.maxAmmo - prev.ammo;
        const toAdd  = Math.min(needed, prev.reserveAmmo);
        return { ...prev, ammo: prev.ammo + toAdd, reserveAmmo: prev.reserveAmmo - toAdd, isReloading: false };
      });
    }, wpn.reloadTime);

    reloadingAudio.current.volume = 0.5;
    reloadingAudio.current.currentTime = 0;
    reloadingAudio.current.play().catch(() => {});
  }, [setStats]);

  // ── SWITCH ARMA ────────────────────────────────────────────
  const ammoCache = useRef<Partial<Record<WeaponId, { ammo: number; reserve: number }>>>({
    pistol: { ammo: 8, reserve: 48 },
  }).current;

  const switchWeapon = useCallback((id: WeaponId) => {
    const s        = statsRef.current;
    const unlocked = s.unlockedWeapons ?? ["pistol"];
    if (!unlocked.includes(id)) return;
    if (s.currentWeapon === id) return;
    if (reloadTimer.current) { clearTimeout(reloadTimer.current); reloadTimer.current = null; }

    const wpn = WEAPONS[id];

    // Salva munizioni arma corrente nella cache locale
    ammoCache[s.currentWeapon ?? "pistol"] = {
      ammo:    s.ammo,
      reserve: s.reserveAmmo,
    };

    // Carica munizioni arma nuova (dalla cache se già usata, altrimenti default)
    const cached = ammoCache[id];

    setStats(prev => ({
      ...prev,
      currentWeapon: id,
      isReloading:   false,
      ammo:          cached?.ammo    ?? wpn.maxAmmo,
      maxAmmo:       wpn.maxAmmo,
      reserveAmmo:   cached?.reserve ?? wpn.maxReserve,
    }));
  }, [setStats]);

  // ── EVENTI ─────────────────────────────────────────────────
  // Collega funzioni ai ref mobile
  useEffect(() => {
    mobileShootRef.fn  = shoot;
    mobileReloadRef.fn = reload;
    mobileSwitchRef.fn = (dir: 1 | -1) => {
      const s        = statsRef.current;
      const unlocked = s.unlockedWeapons ?? ["pistol"];
      const idx      = unlocked.indexOf(s.currentWeapon ?? "pistol");
      const next     = unlocked[(idx + dir + unlocked.length) % unlocked.length] as WeaponId;
      switchWeapon(next);
    };
    return () => {
      mobileShootRef.fn  = null;
      mobileReloadRef.fn = null;
      mobileSwitchRef.fn = null;
    };
  }, [shoot, reload, switchWeapon]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement || e.button !== 0 || isPausedRef.current) return;
      mouseDownRef.current = true;
      shoot();
    };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) mouseDownRef.current = false; };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isPausedRef.current) return;
      if (e.code === "KeyR") reload();
      if (e.code === "Digit1") switchWeapon("pistol");
      if (e.code === "Digit2") switchWeapon("shotgun");
      if (e.code === "Digit3") switchWeapon("smg");
      if (e.code === "KeyQ") {
        const s        = statsRef.current;
        const unlocked = s.unlockedWeapons ?? ["pistol"];
        const idx      = unlocked.indexOf(s.currentWeapon ?? "pistol");
        switchWeapon(unlocked[(idx + 1) % unlocked.length] as WeaponId);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("keydown",   onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("keydown",   onKeyDown);
    };
  }, [shoot, reload, switchWeapon]);

  useEffect(() => { camera.position.set(0, PLAYER_HEIGHT, 0); }, [camera]);

  // Vettori riusati — zero allocazioni per frame
  const _camDir  = useRef(new THREE.Vector3());
  const _sideDir = useRef(new THREE.Vector3());
  const _velTarget = useRef(new THREE.Vector3());

  // ── FRAME LOOP ─────────────────────────────────────────────
  useFrame((_, delta) => {
    if (isPausedRef.current || isDeadRef.current) return;

    const { forward, back, left, right } = getKeys();

    // Input mobile joystick
    const mj = mobileJoystick;
    const mForward = forward || mj.y >  0.15;
    const mBack    = back    || mj.y < -0.15;
    const mLeft    = left    || mj.x < -0.15;
    const mRight   = right   || mj.x >  0.15;

    direction.current.set(0, 0, 0);
    camera.getWorldDirection(_camDir.current);
    _camDir.current.y = 0;
    _camDir.current.normalize();
    _sideDir.current.set(-_camDir.current.z, 0, _camDir.current.x);

    if (mForward) direction.current.addScaledVector(_camDir.current, Math.max(1, Math.abs(mj.y)));
    if (mBack)    direction.current.addScaledVector(_camDir.current, -Math.max(1, Math.abs(mj.y)));
    if (mLeft)    direction.current.addScaledVector(_sideDir.current, -Math.max(1, Math.abs(mj.x)));
    if (mRight)   direction.current.addScaledVector(_sideDir.current,  Math.max(1, Math.abs(mj.x)));
    if (direction.current.lengthSq() > 0) direction.current.normalize();

    // Camera look da swipe mobile
    if (isMobile && (mobileLook.dx !== 0 || mobileLook.dy !== 0)) {
      camera.rotation.order = "YXZ";
      camera.rotation.y -= mobileLook.dx;
      camera.rotation.x -= mobileLook.dy;
      camera.rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, camera.rotation.x));
      mobileLook.dx = 0;
      mobileLook.dy = 0;
    }

    const lerpFactor = direction.current.lengthSq() > 0 ? 0.18 : 0.12;
    _velTarget.current.copy(direction.current).multiplyScalar(MOVE_SPEED);
    velocity.current.lerp(_velTarget.current, lerpFactor);
    camera.position.addScaledVector(velocity.current, delta);

    // Collisioni con ostacoli
    resolveCollision(camera.position, 0.4);

    const BOUNDS = 28;
    camera.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, camera.position.x));
    camera.position.z = Math.max(-BOUNDS, Math.min(BOUNDS, camera.position.z));
    camera.position.y = PLAYER_HEIGHT;
    playerPositionRef.current.copy(camera.position);

    // Auto-fire SMG
    const wpn = WEAPONS[statsRef.current.currentWeapon ?? "pistol"];
    if (wpn.auto && mouseDownRef.current && !statsRef.current.isReloading) {
      autoFireTimer.current += delta;
      if (autoFireTimer.current >= 1 / wpn.fireRate) {
        autoFireTimer.current = 0;
        shoot();
      }
    } else {
      autoFireTimer.current = 0;
    }

    // Passi
    const isMoving = forward || back || left || right;
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

    // Bullet update
    bulletsRef.current = bulletsRef.current.filter(b => b.alive);
    bulletsRef.current.forEach(bullet => {
      bullet.position.addScaledVector(bullet.direction, wpn.bulletSpeed * delta);
      if (bullet.position.distanceTo(camera.position) > 80) bullet.alive = false;
      if (bullet.position.y < 0) bullet.alive = false;
    });

    if (statsRef.current.health <= 0 && !isDeadRef.current) {
      isDeadRef.current = true;
      onGameOver();
    }
  });

  return (
    <GunWrapper
      muzzleFlash={muzzleFlash}
      isReloading={stats.isReloading}
      weaponId={stats.currentWeapon ?? "pistol"}
    />
  );
}
