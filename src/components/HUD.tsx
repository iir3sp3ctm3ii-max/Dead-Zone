import { useState, useEffect, useRef } from "react";
import { GameStats } from "@/pages/Game";
import { WEAPONS, WEAPON_ORDER, WeaponId } from "./weapons";
import MobileControls, { isMobile } from "./MobileControls";

interface HUDProps {
  stats: GameStats;
  nearAmmoCrate: boolean;
  nearWeapon: WeaponId | null;
}

export default function HUD({ stats, nearAmmoCrate, nearWeapon }: HUDProps) {
  const healthPercent = Math.max(0, stats.health);
  const healthColor =
    healthPercent > 60 ? "#22cc44" :
    healthPercent > 30 ? "#ddaa22" : "#cc2222";

  const currentWeapon: WeaponId     = stats.currentWeapon ?? "pistol";
  const unlockedWeapons: WeaponId[] = stats.unlockedWeapons ?? ["pistol"];
  const wpn = WEAPONS[currentWeapon];

  // ── HITMARKER ─────────────────────────────────────────────
  const [showHit, setShowHit] = useState(false);
  const hitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onHit = () => {
      setShowHit(true);
      if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
      hitTimerRef.current = setTimeout(() => setShowHit(false), 150);
    };
    window.addEventListener("hitmarker", onHit);
    return () => window.removeEventListener("hitmarker", onHit);
  }, []);

  // Banner ondata
  const prevWaveRef = useRef(stats.wave);
  const [showBanner, setShowBanner]       = useState(false);
  const [countdown, setCountdown]         = useState(4);
  const [completedWave, setCompletedWave] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stats.wave > prevWaveRef.current) {
      setCompletedWave(prevWaveRef.current);
      setShowBanner(true);
      setCountdown(4);
      prevWaveRef.current = stats.wave;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); setShowBanner(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stats.wave]);

  const nearWpn      = nearWeapon ? WEAPONS[nearWeapon] : null;
  const nearWpnOwned = nearWeapon ? unlockedWeapons.includes(nearWeapon) : false;
  const nearWpnCost  = nearWpn ? (nearWpnOwned ? nearWpn.ammoCost : nearWpn.cost) : 0;
  const canAfford    = nearWpnCost <= stats.score;

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: "none", fontFamily: "'Courier New', monospace", userSelect: "none",
    }}>

      {/* ── HITMARKER stile CoD ──────────────────────────────── */}
      {showHit && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "20px", height: "20px",
          animation: "hitmarkerAnim 0.15s ease-out forwards",
        }}>
          <div style={{ position:"absolute", top:"50%", left:0, width:"7px", height:"2px", background:"#ffffff", transform:"translateY(-50%)", boxShadow:"0 0 3px rgba(255,255,255,0.8)" }} />
          <div style={{ position:"absolute", top:"50%", right:0, width:"7px", height:"2px", background:"#ffffff", transform:"translateY(-50%)", boxShadow:"0 0 3px rgba(255,255,255,0.8)" }} />
          <div style={{ position:"absolute", left:"50%", top:0, width:"2px", height:"7px", background:"#ffffff", transform:"translateX(-50%)", boxShadow:"0 0 3px rgba(255,255,255,0.8)" }} />
          <div style={{ position:"absolute", left:"50%", bottom:0, width:"2px", height:"7px", background:"#ffffff", transform:"translateX(-50%)", boxShadow:"0 0 3px rgba(255,255,255,0.8)" }} />
        </div>
      )}
      {/* MUNIZIONI */}
      <div style={{ position: "absolute", bottom: 110, right: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {stats.isReloading && (
          <div style={{ color: "#707070", fontSize: 18, fontWeight: "bold", textShadow: "0 0 8px #999", letterSpacing: 3, animation: "pulse 0.5s infinite" }}>
            RICARICA...
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: stats.ammo <= 2 ? "#cc2222" : "#fff", fontSize: 44, fontWeight: "bold", textShadow: stats.ammo <= 2 ? "0 0 12px #cc2222" : "0 0 8px rgba(255,255,255,0.4)", lineHeight: 1, letterSpacing: 2 }}>
            {stats.ammo}
          </div>
          <div style={{ color: "#777", fontSize: 24, fontWeight: "bold", lineHeight: 1 }}>/ {stats.reserveAmmo}</div>
        </div>
        <div style={{ color: "#ccc", fontSize: 16, letterSpacing: 4, textTransform: "uppercase" }}>{wpn.name}</div>
      </div>

      {/* SLOT ARMI */}
      <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", gap: 6 }}>
        {WEAPON_ORDER.map((id, i) => {
          const w = WEAPONS[id];
          const isUnlocked = unlockedWeapons.includes(id);
          const isActive   = currentWeapon === id;
          return (
            <div key={id} style={{
              width: 62, height: 62,
              border: isActive ? "2px solid #fff" : isUnlocked ? "2px solid rgba(255,255,255,0.35)" : "2px solid rgba(255,255,255,0.12)",
              background: isActive ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              position: "relative", boxShadow: isActive ? "0 0 14px rgba(255,255,255,0.35)" : "none",
            }}>
              <div style={{ position: "absolute", top: 3, left: 5, color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "bold" }}>{i + 1}</div>
              <div style={{ color: isActive ? "#fff" : isUnlocked ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" }}>{w.name}</div>
              {!isUnlocked ? <div style={{ fontSize: 13 }}>🔒</div> : <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 8 }}>{w.maxAmmo}+{w.maxReserve}</div>}
            </div>
          );
        })}
      </div>

      {/* SALUTE */}
      <div style={{ position: "absolute", bottom: 24, left: 24, display: "flex", gap: 10 }}>
        <div style={{ width: 200, height: 16, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", position: "relative", overflow: "hidden" }}>
          <div style={{ width: `${healthPercent}%`, height: "100%", background: healthColor, transition: "width 0.30s, background 0.15s", boxShadow: `0 0 8px ${healthColor}` }} />
        </div>
        <div style={{ color: healthColor, fontSize: 22, fontWeight: "bold", textShadow: `0 0 8px ${healthColor}`, lineHeight: 1 }}>{Math.round(stats.health)}</div>
      </div>

      {/* NUMERO ONDATA */}
      <div style={{ position: "absolute", bottom: 125, left: 70, transform: "translateX(-50%)" }}>
        <div style={{ color: "#990000", fontSize: 100, letterSpacing: 6, fontWeight: "bold", textShadow: "0 0 8px rgb(0,0,0,0.5)" }}>{stats.wave}</div>
      </div>

      {/* PUNTEGGIO */}
      <div style={{ position: "absolute", bottom: 175, right: 230, textAlign: "right" }}>
        <div style={{ color: "#fff", fontSize: 32, fontWeight: "bold", background: "rgba(0,0,0,0.33)", border: "1px solid #fff", padding: "5px 10px", lineHeight: 1.2, letterSpacing: 2 }}>{stats.score}</div>
      </div>

      {/* PROMPT CASSA [E] o AZIONE */}
      {nearAmmoCrate && (
        <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", border: "1px solid #ddaa33", color: "#ddaa33", fontSize: 13, letterSpacing: 4, padding: "8px 20px", textAlign: "center", textTransform: "uppercase", boxShadow: "0 0 12px rgba(221,170,51,0.4)", whiteSpace: "nowrap" }}>
          {stats.score >= wpn.ammoCost
            ? `${isMobile ? '[AZIONE]' : '[E]'} MUNIZIONI ${wpn.name} — ${wpn.ammoCost} PT`
            : `MUNIZIONI — ${wpn.ammoCost} PT  (mancano ${wpn.ammoCost - stats.score} pt)`}
        </div>
      )}

      {/* PROMPT MURO [F] o AZIONE */}
      {nearWeapon && nearWpn && (
        <div style={{ position: "absolute", bottom: nearAmmoCrate ? 152 : 110, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", border: `1px solid ${nearWpnOwned ? "#22aa44" : "#4488ff"}`, color: nearWpnOwned ? "#33dd66" : "#66aaff", fontSize: 13, letterSpacing: 4, padding: "8px 20px", textAlign: "center", textTransform: "uppercase", boxShadow: `0 0 14px ${nearWpnOwned ? "rgba(34,170,68,0.45)" : "rgba(68,136,255,0.45)"}`, whiteSpace: "nowrap" }}>
          {canAfford
            ? `${isMobile ? '[AZIONE]' : '[F]'} ${nearWpnOwned ? `RICARICA ${nearWpn.name}` : `ACQUISTA ${nearWpn.name}`} — ${nearWpnCost} PT`
            : `${nearWpn.name} — ${nearWpnCost} PT  (mancano ${nearWpnCost - stats.score} pt)`}
        </div>
      )}

      {/* BANNER ONDATA */}
      {showBanner && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "waveIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          <div style={{ color: "#ddaa33", fontSize: 13, letterSpacing: 8, textTransform: "uppercase", textShadow: "0 0 16px rgba(221,170,51,0.8)", fontWeight: 700 }}>ONDATA {completedWave} COMPLETATA</div>
          <div style={{ color: "#fff", fontSize: 90, fontWeight: 900, lineHeight: 1, letterSpacing: -2, textShadow: "0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(229,56,59,0.4)" }}>ONDATA {stats.wave}</div>
          <div style={{ color: "#22cc44", fontSize: 18, letterSpacing: 5, fontWeight: 700, textShadow: "0 0 12px rgba(34,204,68,0.8)" }}>+ 500 PT · + 20 SALUTE</div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ color: "#555", fontSize: 12, letterSpacing: 5, textTransform: "uppercase" }}>INIZIA TRA</div>
            <div style={{ color: "#cc3333", fontSize: 48, fontWeight: 900, lineHeight: 1, textShadow: "0 0 20px rgba(204,51,51,0.9)", minWidth: 40, textAlign: "center", animation: "countPulse 1s infinite" }}>{countdown}</div>
          </div>
        </div>
      )}

      {/* Vignetta */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />

      {/* Bordo sangue */}
      {stats.health < 30 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, border: "10px solid rgba(200,0,0,0.6)", boxShadow: "inset 0 0 60px rgba(175,0,0,0.3)", pointerEvents: "none", animation: "bloodPulse 1.2s infinite" }} />
      )}

      <style>{`
        @keyframes pulse      { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes bloodPulse { 0%,100%{opacity:0.6}50%{opacity:1} }
        @keyframes waveIn     { from{opacity:0;transform:translate(-50%,-50%) scale(0.85)}to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes countPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.15)} }
        @keyframes hitmarkerAnim {
          0%   { opacity:1; transform:translate(-50%,-50%) scale(1.3); }
          60%  { opacity:1; transform:translate(-50%,-50%) scale(1.0); }
          100% { opacity:0; transform:translate(-50%,-50%) scale(1.0); }
        }
      `}</style>
    </div>
  );
}
