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
      if (frameTimes.length > 60) {
        frameTimes.shift();
      }
      
      frameCount++;
      if (frameCount % 4 === 0) {
        const avgFps = Math.round(frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length);
        setFps(avgFps);
      }
      
      lastTime = currentTime;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  if (!showFps) return null;

  const getFpsColor = (fpsValue: number) => {
    if (fpsValue >= 60) return "#4ade80";
    if (fpsValue >= 30) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <div style={{
      position: "absolute",
      top: "12px",
      right: "12px",
      color: "#fff",
      fontFamily: "'Courier New', monospace",
      fontSize: "14px",
      fontWeight: "bold",
      textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
      zIndex: 100,
      background: "rgba(0,0,0,0.8)",
      padding: "6px 10px",
      borderRadius: "6px",
      backdropFilter: "blur(15px)",
      border: `2px solid ${getFpsColor(fps)}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.5)"
    }}>
      FPS: <span style={{ color: getFpsColor(fps) }}>{fps}</span>
    </div>
  );
}

function CameraReset() {
  const { camera } = useThree();
  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, 0, 0);
    camera.quaternion.identity();
  }, [camera]);
  return null;
}

export default function GameScene({ stats, setStats, onGameOver, onWeaponNearChange }: GameSceneProps) {
  const pointerLockRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [shadowsEnabled] = useState(true);
  const [showFps, setShowFps] = useState(true);
  const [graphicsExpanded, setGraphicsExpanded] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => 
      typeof navigator !== "undefined" && 
      (/Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1);
    
    setIsMobileDevice(checkMobile());
    const handleResize = () => setIsMobileDevice(checkMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const audio = new Audio('/sounds/crickets-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    ambientAudioRef.current = audio;
    audio.play().catch(() => console.log('Autoplay blocked'));
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      if (isPaused) {
        ambientAudioRef.current.pause();
      } else {
        ambientAudioRef.current.play().catch(() => {});
      }
    }
  }, [isPaused]);

  const togglePause = useCallback(() => {
    const newPaused = !isPausedRef.current;
    isPausedRef.current = newPaused;
    setIsPaused(newPaused);
    
    if (newPaused) {
      document.body.style.cursor = "default";
      document.exitPointerLock?.();
    } else {
      document.body.style.cursor = "none";
      setTimeout(() => pointerLockRef.current?.lock(), 50);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "Escape") {
        e.preventDefault();
        isPausedRef.current = false;
        setIsPaused(false);
        document.body.style.cursor = "default";
        document.exitPointerLock?.();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePause]);

  const goToMainMenu = () => {
    window.location.href = '/';
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <FPSCounter showFps={showFps} />

      {isMobileDevice && (
        <MobileControls
          onShoot={() => mobileShootRef.fn?.()}
          onReload={() => mobileReloadRef.fn?.()}
          onWeaponSwitch={(dir) => mobileSwitchRef.fn?.(dir)}
        />
      )}
      
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows={shadowsEnabled}
          camera={{ fov: 75, near: 0.1, far: 180, position: [0, 1.7, 0] }}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 1.4,
          }}
          frameloop="always"
          dpr={[1, 1.5]}
        >
          <color attach="background" args={["#0a0810"]} />
          <Suspense fallback={null}>
            <Stars radius={80} depth={40} count={1500} factor={3} saturation={0} speed={0} />
            <mesh position={[55, 75, -110]}>
              <sphereGeometry args={[7, 16, 16]} />
              <meshBasicMaterial color="#ffe8c0" />
            </mesh>
            <fog attach="fog" args={["#0e0810", 22, 58]} />
            <ambientLight intensity={0.45} color="#1e1a2e" />
            
            <directionalLight
              position={[55, 75, -110]}
              intensity={2.0}
              color="#ddeeff"
              castShadow={shadowsEnabled}
              shadow-mapSize={[2048, 2048]}
              shadow-camera-far={220}
              shadow-camera-left={-60}
              shadow-camera-right={60}
              shadow-camera-top={60}
              shadow-camera-bottom={-60}
            />

            <pointLight position={[0, 7, 0]} color="#ff8844" intensity={3.8} distance={48} castShadow={false} />

            {!isMobileDevice && <PointerLockControls ref={pointerLockRef} />}
            <CameraReset />
            <EnvironmentComponent />
            <WeaponWalls stats={stats} setStats={setStats} onNearChange={onWeaponNearChange} />
            <Player stats={stats} setStats={setStats} onGameOver={onGameOver} />
            <ZombieManager stats={stats} setStats={setStats} />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {isPaused && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontFamily: "monospace", zIndex: 1000
        }}>
          <h1 style={{ color: "#e5383b", fontSize: "80px", margin: 0 }}>PAUSA</h1>
          <p style={{ color: "#ced4da", letterSpacing: "2px" }}>Premi P per riprendere • ESC per uscire</p>
          
          <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "20px", borderRadius: "15px", textAlign: "center", minWidth: "150px" }}>
              <div style={{ color: "#9ca3af", fontSize: "12px" }}>KILLS</div>
              <div style={{ color: "white", fontSize: "30px", fontWeight: "bold" }}>{stats.kills}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "20px", borderRadius: "15px", textAlign: "center", minWidth: "150px" }}>
              <div style={{ color: "#9ca3af", fontSize: "12px" }}>SCORE</div>
              <div style={{ color: "white", fontSize: "30px", fontWeight: "bold" }}>{stats.score}</div>
            </div>
          </div>

          <button onClick={togglePause} style={{
            marginTop: "50px", padding: "15px 40px", fontSize: "20px",
            background: "#e5383b", color: "white", border: "none", borderRadius: "30px", cursor: "pointer"
          }}>RIPRENDI</button>
          
          <button onClick={goToMainMenu} style={{
            marginTop: "15px", padding: "10px 30px", background: "transparent",
            color: "#9ca3af", border: "1px solid #4b5563", borderRadius: "30px", cursor: "pointer"
          }}>MENU PRINCIPALE</button>
        </div>
      )}

      {!isPaused && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          pointerEvents: "none", zIndex: 10, fontSize: "32px", color: "#fff", fontWeight: "900"
        }}>·</div>
      )}
    </div>
  );
}
