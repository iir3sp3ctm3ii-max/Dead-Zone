import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GameStats } from "@/pages/Game";
import { playerPositionRef, bulletsRef } from "./Player";
import { isPausedRef } from "./GameScene";
import Zombie from "./Zombie";
import { resolveCollision } from "./collisions";

export const hitmarkerRef = { current: 0 };

const groanAudio = new Audio('/sounds/groan.mp3');
const deathAudio = new Audio('/sounds/death.mp3');

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
  deathType: number;
  lastDamage: number;
  damageFlash: number;
  canGroan: boolean;
  nextGroanTime: number;
  lastGroanTime: number;
}

let zombieIdCounter = 0;
const ATTACK_RANGE   = 1.5;
const ATTACK_DAMAGE  = 5;
const ATTACK_COOLDOWN = 1.2;
const GROAN_MIN = 15;
const GROAN_MAX = 35;

// Vettori riutilizzabili — zero allocazioni nel loop
const _toPlayer = new THREE.Vector3();
const _bulletY  = new THREE.Vector3();

// Evento hitmarker riutilizzabile
const HIT_EVENT = new Event("hitmarker");

function createZombie(wave: number): ZombieData {
  const angle  = Math.random() * Math.PI * 2;
  const radius = 22 + Math.random() * 6;
  const hp     = 50 + wave * 10;
  return {
    id: zombieIdCounter++,
    position: new THREE.Vector3(Math.cos(angle)*radius, 0, Math.sin(angle)*radius),
    health: hp, maxHealth: hp,
    speed: 1.5 + wave * 0.15 + Math.random() * 0.5,
    state: "walking",
    dieTime: 0, hitFlash: 0, animTime: Math.random() * Math.PI * 2,
    deathType: Math.floor(Math.random() * 3),
    lastDamage: 0, damageFlash: 0,
    canGroan: Math.random() < 0.25,
    nextGroanTime: Math.random() * (GROAN_MAX - GROAN_MIN) + GROAN_MIN,
    lastGroanTime: 0,
  };
}

interface Props {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
}

export default function ZombieManager({ stats, setStats }: Props) {
  const [zombies, setZombies]       = useState<ZombieData[]>([]);
  const zombiesRef                  = useRef<ZombieData[]>([]);
  const attackTimers                = useRef<Map<number, number>>(new Map());
  const waveRef                     = useRef(1);
  const spawnedCountRef             = useRef(0);
  const targetCountRef              = useRef(0);
  const spawnTimerRef               = useRef(0);
  const statsRef                    = useRef(stats);
  const killsThisWaveRef            = useRef(0);
  const waveDelayRef                = useRef(0);
  const timeRef                     = useRef(0);

  // Throttle setZombies — aggiorna React state max 20 volte/sec
  const renderTimerRef              = useRef(0);
  const RENDER_INTERVAL             = 1 / 20;

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { waveRef.current  = stats.wave; }, [stats.wave]);

  const startWave = useCallback((wave: number) => {
    targetCountRef.current   = 5 + (wave - 1) * 3;
    spawnedCountRef.current  = 0;
    killsThisWaveRef.current = 0;
    spawnTimerRef.current    = 0;
    waveDelayRef.current     = 0;
  }, []);

  useEffect(() => { startWave(1); }, [startWave]);

  useFrame((_, delta) => {
    if (isPausedRef.current) return;

    timeRef.current    += delta;
    renderTimerRef.current += delta;

    const playerPos = playerPositionRef.current;
    if (statsRef.current.health <= 0) return;

    if (waveDelayRef.current > 0) {
      waveDelayRef.current -= delta;
      return;
    }

    // Spawn
    if (spawnedCountRef.current < targetCountRef.current) {
      spawnTimerRef.current += delta;
      if (spawnTimerRef.current > 0.6) {
        spawnTimerRef.current = 0;
        zombiesRef.current.push(createZombie(waveRef.current));
        spawnedCountRef.current++;
        renderTimerRef.current = RENDER_INTERVAL; // forza update subito
      }
    }

    let anyChange = false;
    const now = performance.now() / 1000;
    const zArr = zombiesRef.current;

    for (let i = 0; i < zArr.length; i++) {
      const zombie = zArr[i];
      if (zombie.state === "dead") continue;

      // Morte a 0 hp
      if (zombie.health <= 0 && zombie.state !== "dying") {
        deathAudio.volume = 0.6;
        deathAudio.currentTime = 0;
        deathAudio.play().catch(() => {});
        zombie.state = "dying";
        zombie.dieTime = 0;
        killsThisWaveRef.current++;
        anyChange = true;

        setStats(prev => ({ ...prev, score: prev.score + 100, kills: prev.kills + 1 }));

        if (killsThisWaveRef.current >= targetCountRef.current) {
          const nextWave = waveRef.current + 1;
          waveRef.current = nextWave;
          waveDelayRef.current = 4;
          setStats(prev => ({
            ...prev, wave: nextWave,
            score: prev.score + 500,
            health: Math.min(100, prev.health + 20),
          }));
          setTimeout(() => startWave(nextWave), 4000);
        }
        continue;
      }

      if (zombie.state === "dying") {
        zombie.dieTime += delta;
        if (zombie.dieTime > 1.4) { zombie.state = "dead"; anyChange = true; }
        continue;
      }

      zombie.animTime += delta;
      if (zombie.hitFlash    > 0) zombie.hitFlash    = Math.max(0, zombie.hitFlash    - delta * 4);
      if (zombie.damageFlash > 0) zombie.damageFlash = Math.max(0, zombie.damageFlash - delta * 2);

      // Groan
      if (zombie.canGroan && zombie.state === "walking" && timeRef.current >= zombie.nextGroanTime) {
        groanAudio.volume = 0.2 + Math.random() * 0.15;
        groanAudio.currentTime = 0;
        groanAudio.play().catch(() => {});
        zombie.nextGroanTime = timeRef.current + Math.random() * (GROAN_MAX - GROAN_MIN) + GROAN_MIN;
      }

      // Bullet collision — riusa _bulletY senza clone()
      const bullets = bulletsRef.current;
      for (let b = 0; b < bullets.length; b++) {
        const bullet = bullets[b];
        if (!bullet.alive) continue;
        _bulletY.copy(zombie.position).setY(bullet.position.y);
        if (bullet.position.distanceTo(_bulletY) < 0.7) {
          bullet.alive = false;
          zombie.health -= (bullet as any).damage ?? (25 + Math.random() * 10);
          window.dispatchEvent(HIT_EVENT); // riusa evento esistente
          anyChange = true;
          break; // un proiettile per zombie per frame
        }
      }

      // Movimento — riusa _toPlayer senza clone()
      _toPlayer.copy(playerPos).sub(zombie.position);
      _toPlayer.y = 0;
      const dist = _toPlayer.length();

      if (dist > ATTACK_RANGE) {
        _toPlayer.normalize();
        zombie.position.addScaledVector(_toPlayer, zombie.speed * delta);
        resolveCollision(zombie.position, 0.35);
        zombie.state = "walking";
      } else {
        zombie.state = "attacking";
        const lastAttack = attackTimers.current.get(zombie.id) ?? 0;
        if (now - lastAttack > ATTACK_COOLDOWN) {
          attackTimers.current.set(zombie.id, now);
          setStats(prev => prev.health <= 0 ? prev : { ...prev, health: Math.max(0, prev.health - ATTACK_DAMAGE) });
          anyChange = true;
        }
      }
    }

    // Rimuovi morti
    if (anyChange) {
      zombiesRef.current = zArr.filter(z => z.state !== "dead");
    }

    // Aggiorna React state solo ogni ~50ms invece che ogni frame
    if (renderTimerRef.current >= RENDER_INTERVAL) {
      renderTimerRef.current = 0;
      setZombies([...zombiesRef.current]);
    }
  });

  return (
    <>
      {zombies.map(z => <Zombie key={z.id} zombie={z} />)}
    </>
  );
}
