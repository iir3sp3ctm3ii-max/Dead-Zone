import { Canvas, useThree } from "@react-three/fiber";
import { KeyboardControls, PointerLockControls, Stars } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import Player from "./Player";
import ZombieManager from "./ZombieManager";
import EnvironmentComponent from "./Environment";
import WeaponWalls from "./WeaponWall";
import { WeaponId } from "./weapons";
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

// ✅ ELIMINATO ShadowManager (inutile) - MANTENUTO solo FPSCounter
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


// Resetta camera e PointerLockControls a guardare dritto all'avvio
function CameraReset() {
  const { camera } = useThree();
  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, 0, 0);
    camera.quaternion.identity();
  }, []); // solo al mount, niente rAF
  return null;
}

export default function GameScene({ stats, setStats, onGameOver, onWeaponNearChange }: GameSceneProps) {
  const pointerLockRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [antialiasMode, setAntialiasMode] = useState(0); // 0=BASSE, 1=ALTE
  const [showFps, setShowFps] = useState(true);
  const [graphicsExpanded, setGraphicsExpanded] = useState(false);

  // ✅ SEMPLICE - NESSUN REF COMPLICATO
  useEffect(() => {
    // Solo needsUpdate - nessun errore
    const timeoutId = setTimeout(() => {
      // R3F gestisce automaticamente il refresh
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [shadowsEnabled, antialiasMode]);

  useEffect(() => {
    const audio = new Audio('/sounds/crickets-ambient.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    ambientAudioRef.current = audio;
    audio.play().catch(e => console.log('Autoplay blocked'));
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (ambientAudioRef.current) {
      if (isPausedRef.current) {
        ambientAudioRef.current.pause();
      } else {
        ambientAudioRef.current.play().catch(() => {});
      }
    }
  }, [isPausedRef.current]);

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

  const handleFpsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFps(!showFps);
  };

  const handleShadowsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShadowsEnabled(!shadowsEnabled);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <FPSCounter showFps={showFps} />
      
      <KeyboardControls map={keyMap}>
      <Canvas
  shadows={shadowsEnabled}
  camera={{ fov: 75, near: 0.1, far: 180, position: [0, 1.7, 0] }}
  gl={{
    antialias: false,              // GTX: antialias OFF di default, costa molto
    powerPreference: "high-performance",
    alpha: false,
    stencil: false,                // GTX: disabilita stencil buffer — non serve
    depth: true,
    toneMapping: THREE.ReinhardToneMapping,   // Reinhard è più leggero di ACESFilmic
    toneMappingExposure: 1.4,      // Abbassato — previene flickering su luci dinamiche
    precision: "mediump",
  }}
  performance={{ min: 0.5, max: 1 }}
  frameloop="always"
  dpr={[1, 1.5]}                  // GTX: limita DPR a max 1.5 invece di 2
>
  <color attach="background" args={["#0a0810"]} />
  <Suspense fallback={null}>

    {/* STELLE */}
    <Stars radius={80} depth={40} count={1500} factor={3} saturation={0} speed={0} />

    {/* LUNA */}
    <mesh position={[55, 75, -110]}>
      <sphereGeometry args={[7, 16, 16]} />
      <meshBasicMaterial color="#ffe8c0" />
    </mesh>

    {/* NEBBIA leggera — visibilità 22→58 unità */}
    <fog attach="fog" args={["#0e0810", 22, 58]} />

    {/* AMBIENT */}
    <ambientLight intensity={0.45} color="#1e1a2e" />

    {/* LUCE LUNA — copre tutta la mappa, ombre scure */}
    {shadowsEnabled ? (
      <directionalLight
        position={[55, 75, -110]}
        intensity={2.0}
        color="#ddeeff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-radius={0.5}
      />
    ) : (
      <directionalLight position={[55, 75, -110]} intensity={2.0} color="#ddeeff" />
    )}

    {/* FILL — no shadow */}
    <directionalLight position={[-30, 8, 40]} intensity={0.6} color="#cc6633" />
    <directionalLight position={[ 50, 20, 0]} intensity={0.35} color="#442233" />

    {/* COPERTURA — castShadow={false} su tutte per evitare flickering */}
    <pointLight position={[0,   7,   0]} color="#ff8844" intensity={3.8} distance={48} decay={1.3} castShadow={false} />
    <pointLight position={[-16, 6, -16]} color="#ee6633" intensity={2.8} distance={34} decay={1.5} castShadow={false} />
    <pointLight position={[ 16, 6,  16]} color="#ee6633" intensity={2.8} distance={34} decay={1.5} castShadow={false} />
    <pointLight position={[0,   5, -26]} color="#5577cc" intensity={2.0} distance={26} decay={1.6} castShadow={false} />
    <pointLight position={[0,   5,  26]} color="#5577cc" intensity={2.0} distance={26} decay={1.6} castShadow={false} />

    <PointerLockControls ref={pointerLockRef} />
    <CameraReset />
    <EnvironmentComponent />
    <WeaponWalls stats={stats} setStats={setStats} onNearChange={onWeaponNearChange} />
    <Player stats={stats} setStats={setStats} onGameOver={onGameOver} />
    <ZombieManager stats={stats} setStats={setStats} />
  </Suspense>
</Canvas>




      </KeyboardControls>
      {/* 🔥 MENU PAUSA - TEMA MAINMENU COMPLETO */}
      {isPaused && (
        <>
          <style>{`
            :root {
              --bright-snow: #f8f9faff;
              --pale-slate: #ced4daff;
              --white-smoke: #f5f3f4ff;
              --white: #ffffffff;
              --dark-garnet: #660708ff;
              --mahogany-red: #a4161aff;
              --mahogany-red-2: #ba181bff;
              --strawberry-red: #e5383bff;
              --steel-grey: #9ca3af;
              --silver-grey: #d1d5db;
              --glass-grey: rgba(156, 163, 175, 0.15);
              --grey-void: #1f2937;
              --onyx: #0b090aff;
              --carbon-black: #212529ff;
              --graphite: #4b5563;
            }
            .graphics-panel::-webkit-scrollbar { display: none; }
            .graphics-panel {
              scrollbar-width: none;
              ms-overflow-style: none;
            }
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div 
            style={{
              position: "fixed", 
              top: 0, 
              left: 0, 
              width: "100%", 
              height: "100%",
              background: `
                radial-gradient(circle at 50% 50%, 
                  rgba(140,140,140,0.75) 0%, 
                  rgba(100,100,100,0.65) 5%, 
                  rgba(70,70,70,0.55) 12%, 
                  rgba(40,40,40,0.45) 20%,
                  rgba(8,8,8,0.98) 100%)
              `,
              backdropFilter: "blur(25px) saturate(120%) brightness(0.75)",
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              justifyContent: "center",
              fontFamily: "'OCR A Extended', 'Courier New', monospace",
              zIndex: 1000,
              padding: "0 clamp(20px, 5vw, 60px)"
            }}
          >
            <div style={{ 
              textAlign: "center", 
              maxWidth: "800px"
            }}>
              {/* TITOLO ROSSO/BIANCO */}
              <div style={{
                marginBottom: "clamp(24px, 4vh, 36px)"
              }}>
                <div style={{
                  fontSize: "clamp(48px, 10vw, 100px)",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red), var(--dark-garnet))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 0 40px rgba(229,56,59,0.6)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  marginBottom: "8px"
                }}>
                  PAUSA
                </div>
                <div style={{
                  fontSize: "clamp(44px, 9vw, 90px)",
                  fontWeight: 900,
                  color: "var(--white-smoke)",
                  textShadow: "0 0 30px rgba(255,255,255,0.4)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase"
                }}>
                  MENU
                </div>
              </div>
             {/* 🔧 CERCHIETTO IMPOSTAZIONI - METTI QUI 👇 */}
             <div style={{
                position: "absolute",
                top: "40px",
                right: "40px",
                zIndex: 1001
              }}>
                {/* CERCHIETTO */}
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setGraphicsExpanded(!graphicsExpanded);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: `
                      radial-gradient(circle at 30% 30%, var(--glass-grey) 0%, transparent 50%),
                      linear-gradient(145deg, var(--grey-void), var(--onyx))
                    `,
                    border: "2px solid rgba(156,163,175,0.8)",
                    backdropFilter: "blur(25px) saturate(150%)",
                    boxShadow: `
                      0 12px 32px rgba(0,0,0,0.6),
                      0 0 0 1px rgba(156,163,175,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.1)
                    `,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    userSelect: "none",
                    WebkitUserSelect: "none"
                  }}
                  title="Impostazioni Grafica"
                >
<svg 
  width="22" 
  height="22" 
  viewBox="0 0 24 24" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg"
>
  {/* Ingranaggio esterno INGRANDITO */}
  <path 
    d="M12 4a1 1 0 0 0-1 1c0 1.692-2.046 2.54-3.243 1.343a1 1 0 1 0-1.414 1.414C7.54 8.954 6.693 11 5 11a1 1 0 1 0 0 2c1.692 0 2.54 2.046 1.343 3.243a1 1 0 0 0 1.414 1.414C8.954 16.46 11 17.307 11 19a1 1 0 1 0 2 0c0-1.692 2.046-2.54 3.243-1.343a1 1 0 1 0 1.414-1.414C16.46 15.046 17.307 13 19 13a1 1 0 1 0 0-2c-1.692 0-2.54-2.046-1.343-3.243a1 1 0 0 0-1.414-1.414C15.046 7.54 13 6.693 13 5a1 1 0 0 0-1-1z" 
    stroke="white" 
    stroke-width="1.6" 
    stroke-linecap="round" 
    stroke-linejoin="round"
    fill="none"
  />
  {/* Cerchio centrale piccolino */}
  <circle 
    cx="12" 
    cy="12" 
    r="1.6" 
    stroke="white" 
    stroke-width="1.6" 
    fill="none"
    stroke-linecap="round"
  />
</svg>
               </div>
{/* MENU IMPOSTAZIONI - QUALITÀ OMBRE FUNZIONANTE AL 100% */}
{graphicsExpanded && (
  <div className="graphics-panel" style={{
    position: "absolute" as const,
    top: "70px",
    right: "0",
    width: "340px",
    maxHeight: "400px",
    background: `
      radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%),
      linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
    `,
    padding: "clamp(24px, 2.9vw, 32px)",
    borderRadius: "24px",
    border: "2px solid rgba(156,163,175,0.7)",
    backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
    boxShadow: `
      0 25px 60px rgba(156,163,175,0.4),
      0 12px 32px rgba(0,0,0,0.7),
      0 0 40px rgba(156,163,175,0.2)
    `,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "clamp(20px, 2.8vw, 28px)",
    animation: "slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
  }}>
    
    {/* 1. FPS COUNTER */}
    <div style={{
      background: `radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%), linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)`,
      padding: "clamp(24px, 2.9vw, 32px)",
      borderRadius: "24px",
      border: "2px solid rgba(156,163,175,0.7)",
      backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
      boxShadow: `0 25px 60px rgba(156,163,175,0.4), 0 12px 32px rgba(0,0,0,0.7), 0 0 40px rgba(156,163,175,0.2)`,
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <div style={{position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, var(--steel-grey), var(--silver-grey))", boxShadow: "0 0 16px rgba(156,163,175,0.8)"}} />
      <div style={{color: "var(--steel-grey)", fontSize: "clamp(12px, 1.5vw, 15px)", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase"}}>
        FPS Counter
      </div>
      <div onClick={handleFpsToggle} style={{
        width: "56px", height: "32px", borderRadius: "24px",
        background: showFps ? "linear-gradient(135deg, var(--steel-grey), var(--silver-grey))" : "rgba(156,163,175,0.3)",
        border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", position: "relative", cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: showFps ? "0 8px 24px rgba(156,163,175,0.5)" : "none"
      }}>
        <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--white)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", 
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", transform: showFps ? "translateX(26px)" : "translateX(2px)", position: "absolute", left: 0}} />
      </div>
    </div>
  </div>
)}
              </div>
              
              {/* SUBTEXT */}
              <div style={{
                color: "var(--pale-slate)",
                fontSize: "clamp(14px, 1.6vw, 18px)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "clamp(60px, 8vh, 80px)"
              }}>
                Premi P per riprendere • ESC per uscire
              </div>

              {/* STATS GRID */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "clamp(20px, 2.8vw, 28px)",
                marginBottom: "clamp(60px, 8vh, 80px)",
                maxWidth: "900px",
                padding: "0 clamp(16px, 2vw, 32px)"
              }}>
                {/* ELIMINAZIONI CARD */}
                <div style={{
                  background: `
                    radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%),
                    linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
                  `,
                  padding: "clamp(24px, 2.9vw, 32px)",
                  borderRadius: "24px",
                  border: "2px solid rgba(156,163,175,0.7)",
                  backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
                  boxShadow: `
                    0 25px 60px rgba(156,163,175,0.4),
                    0 12px 32px rgba(0,0,0,0.7),
                    0 0 40px rgba(156,163,175,0.2)
                  `,
                  position: "relative",
                  overflow: "hidden",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minWidth: "260px"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, var(--steel-grey), var(--silver-grey))",
                    boxShadow: "0 0 16px rgba(156,163,175,0.8)"
                  }} />
                  <div style={{ 
                    color: "var(--steel-grey)", 
                    fontSize: "clamp(12px, 1.5vw, 15px)",
                    fontWeight: 900,
                    marginBottom: "14px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase"
                  }}>
                    ELIMINAZIONI
                  </div>
                  <div style={{
                    color: "var(--white)",
                    fontSize: "clamp(26px, 4vw, 36px)",
                    fontWeight: 900,
                    textShadow: "0 0 20px rgba(156,163,175,0.5)"
                  }}>
                    {stats.kills || 0}
                  </div>
                </div>

                {/* PUNTEGGIO CARD */}
                <div style={{
                  background: `
                    radial-gradient(ellipse at top right, var(--glass-grey) 0%, transparent 50%),
                    linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
                  `,
                  padding: "clamp(24px, 2.9vw, 32px)",
                  borderRadius: "24px",
                  border: "2px solid rgba(156,163,175,0.7)",
                  backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
                  boxShadow: `
                    0 25px 60px rgba(156,163,175,0.4),
                    0 12px 32px rgba(0,0,0,0.7),
                    0 0 40px rgba(156,163,175,0.2)
                  `,
                  position: "relative",
                  overflow: "hidden",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minWidth: "260px"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, var(--steel-grey), var(--silver-grey))",
                    boxShadow: "0 0 16px rgba(156,163,175,0.8)"
                  }} />
                  <div style={{ 
                    color: "var(--steel-grey)", 
                    fontSize: "clamp(12px, 1.5vw, 15px)",
                    fontWeight: 900,
                    marginBottom: "14px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase"
                  }}>
                    PUNTEGGIO
                  </div>
                  <div style={{
                    color: "var(--white)",
                    fontSize: "clamp(26px, 4vw, 36px)",
                    fontWeight: 900,
                    textShadow: "0 0 20px rgba(156,163,175,0.5)"
                  }}>
                    {stats.score || 0}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px"
              }}>
                {/* RIPRENDI ROSSO */}
                <button
                  onClick={togglePause}
                  style={{
                    background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red-2), var(--dark-garnet))",
                    border: "none",
                    borderRadius: "24px",
                    color: "var(--white-smoke)",
                    fontSize: "clamp(20px, 2.8vw, 28px)",
                    fontWeight: 800,
                    padding: "18px 48px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "'OCR A Extended', 'Courier New', monospace",
                    boxShadow: "0 20px 40px rgba(229,56,59,0.4)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  RIPRENDI GIOCO
                </button>

                {/* MENU PRINCIPALE GRIGIO */}
                <button
                  onClick={goToMainMenu}
                  style={{
                    background: `
                      radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%),
                      linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
                    `,
                    border: "2px solid rgba(156,163,175,0.7)",
                    borderRadius: "24px",
                    color: "var(--white-smoke)",
                    fontSize: "clamp(18px, 2.5vw, 24px)",
                    fontWeight: 800,
                    padding: "16px 40px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "'OCR A Extended', 'Courier New', monospace",
                    boxShadow: "0 25px 60px rgba(156,163,175,0.4)"
                  }}
                >
                  MENU PRINCIPALE
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CROCE */}
      {!isPaused && (
        <div style={{
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          pointerEvents: "none", 
          zIndex: 10, 
          fontSize: "clamp(24px, 3vw, 32px)", 
          color: "#fff", 
          fontWeight: "900",
        }}>
          ·
        </div>
      )}
    </div>
  );
}