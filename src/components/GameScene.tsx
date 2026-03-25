import { Canvas, useThree } from "@react-three/fiber";
import { KeyboardControls, PointerLockControls, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import Player from "./Player";
import ZombieManager from "./ZombieManager";
import EnvironmentComponent from "./Environment";
import WeaponWalls from "./WeaponWall";
import MobileControls, { isMobile } from "./MobileControls";
import { WeaponId, WEAPONS, WEAPON_ORDER } from "./weapons";
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
      if (isPausedRef.current) { requestAnimationFrame(animate); return; }
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      frameTimes.push(1 / deltaTime);
      if (frameTimes.length > 60) frameTimes.shift();
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

  const getFpsColor = (v: number) => v >= 60 ? "#4ade80" : v >= 30 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{
      position: "absolute", top: "12px", right: "12px",
      color: "#fff", fontFamily: "'Courier New', monospace", fontSize: "14px", fontWeight: "bold",
      textShadow: "1px 1px 3px rgba(0,0,0,0.9)", zIndex: 100,
      background: "rgba(0,0,0,0.8)", padding: "6px 10px", borderRadius: "6px",
      backdropFilter: "blur(15px)", border: `2px solid ${getFpsColor(fps)}`,
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
  }, []);
  return null;
}

export default function GameScene({ stats, setStats, onGameOver, onWeaponNearChange }: GameSceneProps) {
  const pointerLockRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [shadowsEnabled, setShadowsEnabled] = useState(!isMobile); // ombre OFF su mobile per performance
  const [showFps, setShowFps] = useState(!isMobile);
  const [graphicsExpanded, setGraphicsExpanded] = useState(false);

  useEffect(() => {
    const audio = new Audio('/sounds/crickets-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    ambientAudioRef.current = audio;
    audio.play().catch(e => console.log('Autoplay blocked'));
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      if (isPausedRef.current) ambientAudioRef.current.pause();
      else ambientAudioRef.current.play().catch(() => {});
    }
  }, [isPausedRef.current]);

  const togglePause = useCallback(() => {
    const newPaused = !isPausedRef.current;
    isPausedRef.current = newPaused;
    setIsPaused(newPaused);
    if (!isMobile) {
      if (newPaused) {
        document.body.style.cursor = "default";
        document.exitPointerLock?.();
      } else {
        document.body.style.cursor = "none";
        setTimeout(() => pointerLockRef.current?.lock(), 50);
      }
    }
  }, []);

  useEffect(() => {
    if (isMobile) return; // su mobile nessun keydown per pausa
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "KeyP") { e.preventDefault(); togglePause(); }
      else if (e.code === "Escape") {
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

  const goToMainMenu = () => { window.location.href = '/'; };

  const handleFpsToggle = (e: React.MouseEvent) => { e.stopPropagation(); setShowFps(!showFps); };
  const handleShadowsToggle = (e: React.MouseEvent) => { e.stopPropagation(); setShadowsEnabled(!shadowsEnabled); };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <FPSCounter showFps={showFps} />

      {/* Pulsante pausa su mobile */}
      {isMobile && (
        <div
          onClick={togglePause}
          style={{
            position: "absolute",
            top: 16, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.70)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            padding: "6px 18px",
            borderRadius: 20,
            cursor: "pointer",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          ⏸ PAUSA
        </div>
      )}

      {/* Controlli mobile */}
      {isMobile && (
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
            alpha: false,
            stencil: false,
            depth: true,
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 1.4,
            precision: isMobile ? "lowp" : "mediump",
          }}
          performance={{ min: 0.5, max: 1 }}
          frameloop="always"
          dpr={isMobile ? [1, 1] : [1, 1.5]}
        >
          <color attach="background" args={["#0a0810"]} />
          <Suspense fallback={null}>
            <Stars radius={80} depth={40} count={isMobile ? 600 : 1500} factor={3} saturation={0} speed={0} />

            <mesh position={[55, 75, -110]}>
              <sphereGeometry args={[7, 16, 16]} />
              <meshBasicMaterial color="#ffe8c0" />
            </mesh>

            <fog attach="fog" args={["#0e0810", isMobile ? 15 : 22, isMobile ? 45 : 58]} />
            <ambientLight intensity={0.45} color="#1e1a2e" />

            {shadowsEnabled ? (
              <directionalLight
                position={[55, 75, -110]} intensity={2.0} color="#ddeeff" castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0002} shadow-normalBias={0.02}
                shadow-camera-near={1} shadow-camera-far={220}
                shadow-camera-left={-60} shadow-camera-right={60}
                shadow-camera-top={60} shadow-camera-bottom={-60}
                shadow-radius={0.5}
              />
            ) : (
              <directionalLight position={[55, 75, -110]} intensity={2.0} color="#ddeeff" />
            )}

            <directionalLight position={[-30, 8, 40]} intensity={0.6} color="#cc6633" />
            <directionalLight position={[50, 20, 0]} intensity={0.35} color="#442233" />
            <pointLight position={[0, 7, 0]} color="#ff8844" intensity={3.8} distance={48} decay={1.3} castShadow={false} />
            <pointLight position={[-16, 6, -16]} color="#ee6633" intensity={2.8} distance={34} decay={1.5} castShadow={false} />
            <pointLight position={[16, 6, 16]} color="#ee6633" intensity={2.8} distance={34} decay={1.5} castShadow={false} />
            <pointLight position={[0, 5, -26]} color="#5577cc" intensity={2.0} distance={26} decay={1.6} castShadow={false} />
            <pointLight position={[0, 5, 26]} color="#5577cc" intensity={2.0} distance={26} decay={1.6} castShadow={false} />

            {/* PointerLockControls solo su desktop */}
            {!isMobile && <PointerLockControls ref={pointerLockRef} />}
            <CameraReset />
            <EnvironmentComponent />
            <WeaponWalls stats={stats} setStats={setStats} onNearChange={onWeaponNearChange} />
            <Player stats={stats} setStats={setStats} onGameOver={onGameOver} />
            <ZombieManager stats={stats} setStats={setStats} />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* ── MENU PAUSA ─────────────────────────────────────────── */}
      {isPaused && (
        <>
          <style>{`
            :root {
              --bright-snow: #f8f9faff; --pale-slate: #ced4daff; --white-smoke: #f5f3f4ff;
              --white: #ffffffff; --dark-garnet: #660708ff; --mahogany-red: #a4161aff;
              --mahogany-red-2: #ba181bff; --strawberry-red: #e5383bff;
              --steel-grey: #9ca3af; --silver-grey: #d1d5db; --glass-grey: rgba(156,163,175,0.15);
              --grey-void: #1f2937; --onyx: #0b090aff; --carbon-black: #212529ff;
            }
            @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
          `}</style>

          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: `radial-gradient(circle at 50% 50%, rgba(140,140,140,0.75) 0%, rgba(100,100,100,0.65) 5%, rgba(70,70,70,0.55) 12%, rgba(40,40,40,0.45) 20%, rgba(8,8,8,0.98) 100%)`,
            backdropFilter: "blur(25px) saturate(120%) brightness(0.75)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            fontFamily: "'OCR A Extended', 'Courier New', monospace",
            zIndex: 1000, padding: "0 clamp(20px, 5vw, 60px)"
          }}>
            <div style={{ textAlign: "center", maxWidth: "800px", width: "100%" }}>
              <div style={{ marginBottom: "clamp(24px, 4vh, 36px)" }}>
                <div style={{
                  fontSize: "clamp(48px, 10vw, 100px)", fontWeight: 900,
                  background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red), var(--dark-garnet))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  textShadow: "0 0 40px rgba(229,56,59,0.6)", lineHeight: 1, letterSpacing: "-0.02em",
                  textTransform: "uppercase", marginBottom: "8px"
                }}>PAUSA</div>
                <div style={{
                  fontSize: "clamp(44px, 9vw, 90px)", fontWeight: 900, color: "var(--white-smoke)",
                  textShadow: "0 0 30px rgba(255,255,255,0.4)", lineHeight: 1,
                  letterSpacing: "-0.02em", textTransform: "uppercase"
                }}>MENU</div>
              </div>

              <div style={{
                color: "var(--pale-slate)", fontSize: "clamp(12px, 1.4vw, 16px)",
                letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500,
                marginBottom: "clamp(40px, 6vh, 60px)"
              }}>
                {isMobile ? "Premi PAUSA per riprendere" : "Premi P per riprendere • ESC per uscire"}
              </div>

              {/* Stats grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(16px, 2vw, 24px)",
                marginBottom: "clamp(40px, 6vh, 60px)", maxWidth: "700px", margin: "0 auto clamp(40px,6vh,60px) auto",
                padding: "0 clamp(12px, 2vw, 24px)"
              }}>
                {[
                  { label: "ELIMINAZIONI", value: stats.kills || 0 },
                  { label: "PUNTEGGIO",    value: stats.score || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: `radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%), linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)`,
                    padding: "clamp(20px, 2.5vw, 28px)", borderRadius: "20px",
                    border: "2px solid rgba(156,163,175,0.7)",
                    backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
                    boxShadow: "0 25px 60px rgba(156,163,175,0.4), 0 12px 32px rgba(0,0,0,0.7)",
                    position: "relative", overflow: "hidden", textAlign: "center",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--steel-grey), var(--silver-grey))", boxShadow: "0 0 16px rgba(156,163,175,0.8)" }} />
                    <div style={{ color: "var(--steel-grey)", fontSize: "clamp(11px, 1.3vw, 14px)", fontWeight: 900, marginBottom: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ color: "var(--white)", fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 900, textShadow: "0 0 20px rgba(156,163,175,0.5)" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                <button
                  onClick={togglePause}
                  style={{
                    background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red-2), var(--dark-garnet))",
                    border: "none", borderRadius: "20px", color: "var(--white-smoke)",
                    fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800,
                    padding: "16px 44px", cursor: "pointer", textTransform: "uppercase",
                    letterSpacing: "0.05em", fontFamily: "'OCR A Extended', 'Courier New', monospace",
                    boxShadow: "0 20px 40px rgba(229,56,59,0.4)",
                  }}
                >
                  ▶ RIPRENDI GIOCO
                </button>
                <button
                  onClick={goToMainMenu}
                  style={{
                    background: `radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%), linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)`,
                    border: "2px solid rgba(156,163,175,0.7)", borderRadius: "20px",
                    color: "var(--white-smoke)", fontSize: "clamp(16px, 2.2vw, 22px)", fontWeight: 800,
                    padding: "14px 36px", cursor: "pointer", textTransform: "uppercase",
                    letterSpacing: "0.05em", fontFamily: "'OCR A Extended', 'Courier New', monospace",
                    boxShadow: "0 25px 60px rgba(156,163,175,0.4)",
                  }}
                >
                  MENU PRINCIPALE
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mirino */}
      {!isPaused && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none", zIndex: 10,
          fontSize: "clamp(24px, 3vw, 32px)", color: "#fff", fontWeight: "900",
        }}>·</div>
      )}
    </div>
  );
}
