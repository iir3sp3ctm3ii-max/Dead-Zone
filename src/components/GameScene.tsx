import { Canvas, useThree } from "@react-three/fiber";
import { KeyboardControls, PointerLockControls, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import Player from "./Player";
import ZombieManager from "./ZombieManager";
import EnvironmentComponent from "./Environment";
import WeaponWalls from "./WeaponWall";
import MobileControls from "./MobileControls";
import { WeaponId } from "./weapons";
import { mobileShootRef, mobileReloadRef, mobileSwitchRef } from "./Player";
import { GameStats } from "@/pages/Game";

// Riferimenti globali per gestire lo stato del gioco e l'audio
export const isPausedRef = { current: false };
export const ambientAudioRef = { current: null as HTMLAudioElement | null };

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
}

const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
];

interface GameSceneProps {
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  onGameOver: () => void;
  onWeaponNearChange: (id: WeaponId, near: boolean) => void;
}

// Monitor dei fotogrammi per il debug delle prestazioni
function FPSCounter({ showFps }: { showFps: boolean }) {
  const [fps, setFps] = useState(60);
  const frameTimes: number[] = [];

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      if (isPausedRef.current) {
        requestAnimationFrame(animate);
        return;
      }
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      frameTimes.push(1 / deltaTime);
      if (frameTimes.length > 60) frameTimes.shift();
      frameCount++;
      if (frameCount % 10 === 0) {
        const avgFps = Math.round(frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length);
        setFps(avgFps);
      }
      lastTime = currentTime;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  if (!showFps) return null;

  const color = fps >= 60 ? "#4ade80" : fps >= 30 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{
      position: "absolute", top: "20px", right: "20px", color,
      fontFamily: "monospace", fontWeight: "bold", zIndex: 100,
      background: "rgba(0,0,0,0.7)", padding: "5px 10px", borderRadius: "5px",
      border: `1px solid ${color}`
    }}>
      FPS: {fps}
    </div>
  );
}

// Reset della camera per evitare rotazioni sballate all'avvio
function CameraReset() {
  const { camera } = useThree();
  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, 0, 0);
  }, [camera]);
  return null;
}

export default function GameScene({ stats, setStats, onGameOver, onWeaponNearChange }: GameSceneProps) {
  const pointerLockRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Controllo se il dispositivo è mobile
  useEffect(() => {
    const checkMobile = () => 
      /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
    setIsMobileDevice(checkMobile());
  }, []);

  // Audio Ambientale
  useEffect(() => {
    const audio = new Audio('/sounds/crickets-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.1;
    ambientAudioRef.current = audio;
    audio.play().catch(() => console.log('Autoplay bloccato'));
    return () => audio.pause();
  }, []);

  // Gestione Pausa
  const togglePause = useCallback(() => {
    const newPaused = !isPausedRef.current;
    isPausedRef.current = newPaused;
    setIsPaused(newPaused);
    
    if (newPaused) {
      document.exitPointerLock?.();
      ambientAudioRef.current?.pause();
    } else {
      setTimeout(() => pointerLockRef.current?.lock(), 50);
      ambientAudioRef.current?.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "KeyP") togglePause();
      if (e.code === "Escape" && isPausedRef.current) togglePause();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePause]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#000" }}>
      <FPSCounter showFps={true} />

      {isMobileDevice && (
        <MobileControls
          onShoot={() => mobileShootRef.fn?.()}
          onReload={() => mobileReloadRef.fn?.()}
          onWeaponSwitch={(dir) => mobileSwitchRef.fn?.(dir)}
        />
      )}
      
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 150, position: [0, 1.7, 0] }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <color attach="background" args={["#0a0810"]} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} />
            
            {/* Fix Nebbia: deve iniziare lontano per non oscurare tutto */}
            <fog attach="fog" args={["#0e0810", 15, 65]} />

            {/* LUCI: Cruciali per non vedere tutto nero */}
            <ambientLight intensity={0.6} color="#ffffff" />
            <directionalLight
              position={[50, 70, -50]}
              intensity={1.5}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            {/* Luce di supporto centrale */}
            <pointLight position={[0, 10, 0]} intensity={1} distance={50} color="#ffccaa" />

            {!isMobileDevice && <PointerLockControls ref={pointerLockRef} />}
            <CameraReset />
            
            {/* Componenti di gioco */}
            <EnvironmentComponent />
            <WeaponWalls stats={stats} setStats={setStats} onNearChange={onWeaponNearChange} />
            <Player stats={stats} setStats={setStats} onGameOver={onGameOver} />
            <ZombieManager stats={stats} setStats={setStats} />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* UI PAUSA */}
      {isPaused && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 1000, color: "white", fontFamily: "monospace"
        }}>
          <h1 style={{ fontSize: "64px", color: "#ff4444", marginBottom: "10px" }}>PAUSA</h1>
          <p style={{ fontSize: "18px", marginBottom: "30px" }}>Premi P per tornare all'azione</p>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
              <small>UCCISIONI</small>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats.kills}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
              <small>PUNTEGGIO</small>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats.score}</div>
            </div>
          </div>

          <button 
            onClick={togglePause}
            style={{
              padding: "15px 40px", fontSize: "20px", background: "#ff4444", 
              color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            RIPRENDI
          </button>
        </div>
      )}

      {/* Mirino centrale (Crosshair) */}
      {!isPaused && !isMobileDevice && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          pointerEvents: "none", zIndex: 10, color: "white", fontSize: "24px", opacity: 0.8
        }}>
          +
        </div>
      )}
    </div>
  );
}
