// HUD.tsx — aggiornato con supporto mobile
// Mostra automaticamente i controlli touch se il dispositivo ha touchscreen
import { useEffect, useState } from "react";
import { GameStats } from "@/pages/Game";
import MobileControls from "./MobileControls";

interface HUDProps {
  stats: GameStats;
  nearAmmoCrate: boolean;
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsTouch(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isTouch;
}

export default function HUD({ stats, nearAmmoCrate }: HUDProps) {
  const healthPercent = Math.max(0, stats.health);
  const healthColor =
    healthPercent > 60 ? "#22cc44" :
    healthPercent > 30 ? "#ddaa22" :
    "#cc2222";

  const isTouch = useIsTouchDevice();

  // Offset verticale per non sovrapporre i controlli mobile
  const bottomOffset = isTouch ? 240 : 24;

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: "none",
      fontFamily: "'Courier New', monospace",
      userSelect: "none",
    }}>

      {/* ── MUNIZIONI (basso destra) ── */}
      <div style={{
        position: "absolute",
        bottom: bottomOffset,
        right: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}>
        {stats.isReloading && (
          <div style={{
            color: "#707070",
            fontSize: 18,
            fontWeight: "bold",
            textShadow: "0 0 8px #999999",
            letterSpacing: 3,
            animation: "pulse 0.5s infinite",
          }}>
            RICARICA...
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            color: stats.ammo === 2 ? "#cc2222" : "#ffffff",
            fontSize: 44,
            fontWeight: "bold",
            textShadow: stats.ammo === 2 ? "0 0 12px #cc2222" : "0 0 8px rgba(255,255,255,0.4)",
            lineHeight: 1,
            letterSpacing: 2,
          }}>
            {stats.ammo}
          </div>
          <div style={{ color: "#777777", fontSize: 24, fontWeight: "bold", lineHeight: 1 }}>
            / {stats.reserveAmmo}
          </div>
        </div>

        <div style={{ color: "#cccccc", fontSize: 16, letterSpacing: 4, textTransform: "uppercase" }}>
          1911
        </div>
      </div>

      {/* ── SALUTE (basso sinistra) ── */}
      <div style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 24,
        display: "flex",
        gap: 10,
      }}>
        <div style={{
          width: 200, height: 16,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.2)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            width: `${healthPercent}%`, height: "100%",
            background: healthColor,
            transition: "width 0.30s, background 0.15s",
            boxShadow: `0 0 8px ${healthColor}`,
          }} />
        </div>
        <div style={{
          color: healthColor, fontSize: 22, fontWeight: "bold",
          textShadow: `0 0 8px ${healthColor}`, lineHeight: 1,
        }}>
          {Math.round(stats.health)}
        </div>
      </div>

      {/* ── NUMERO ONDATA ── */}
      <div style={{
        position: "absolute",
        bottom: isTouch ? 350 : 125,
        left: 70,
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}>
        <div style={{
          color: "#990000",
          fontSize: 100,
          letterSpacing: 6,
          fontWeight: "bold",
          textTransform: "uppercase",
          textShadow: "0 0 8px rgb(0, 0, 0, 0.5)",
        }}>
          {stats.wave}
        </div>
      </div>

      {/* ── PUNTEGGIO ── */}
      <div style={{
        position: "absolute",
        bottom: isTouch ? 300 : 175,
        right: 24,
        textAlign: "right",
      }}>
        <div style={{
          color: "#ffffff",
          fontSize: 32,
          fontWeight: "bold",
          background: "rgba(0, 0, 0, 0.33)",
          border: "1px solid #ffffff",
          padding: "5px 10px",
          lineHeight: 1.2,
          letterSpacing: 2,
        }}>
          {stats.score}
        </div>
      </div>

      {/* ── PROMPT CASSA — solo su desktop, su mobile c'è il pulsante E ── */}
      {nearAmmoCrate && !isTouch && (
        <div style={{
          position: "absolute",
          bottom: 333,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.33)",
          border: "1px solid #ddaa33",
          color: "#ddaa33",
          fontSize: 14,
          letterSpacing: 4,
          padding: "10px 24px",
          textAlign: "center",
          textTransform: "uppercase",
          boxShadow: "0 0 12px rgba(221,170,51,0.4)",
        }}>
          {stats.score >= 500
            ? "[E] CARICATORE PIENO — 500 pt"
            : `CARICATORE — 500 pt (mancano ${500 - stats.score} pt)`}
        </div>
      )}

      {/* ── VIGNETTE ── */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── BORDO SANGUE ── */}
      {stats.health < 30 && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          border: "10px solid rgba(200,0,0,0.6)",
          boxShadow: "inset 0 0 60px rgba(175, 0, 0, 0.3)",
          pointerEvents: "none",
          animation: "bloodPulse 1.2s infinite",
        }} />
      )}

      {/* ── CONTROLLI MOBILE (solo touchscreen) ── */}
      {isTouch && <MobileControls nearAmmoCrate={nearAmmoCrate} />}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes bloodPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
