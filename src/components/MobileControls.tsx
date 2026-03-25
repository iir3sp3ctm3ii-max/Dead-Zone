import { useEffect, useRef, useCallback } from "react";

// ── RILEVAMENTO MOBILE ─────────────────────────────────────────
export const isMobile =
  /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) ||
  navigator.maxTouchPoints > 1;

// ── REFS GLOBALI — letti dal Player ogni frame ─────────────────
export const mobileJoystick = { x: 0, y: 0 };
export const mobileLook     = { dx: 0, dy: 0 };
export const mobileShoot    = { current: false };
export const mobileReload   = { current: false };

interface MobileControlsProps {
  onShoot:        () => void;
  onReload:       () => void;
  onWeaponSwitch: (dir: 1 | -1) => void;
}

export default function MobileControls({ onShoot, onReload, onWeaponSwitch }: MobileControlsProps) {
  /* ── JOYSTICK ───────────────────────────────────────────── */
  const joystickRef     = useRef<HTMLDivElement>(null);
  const knobRef         = useRef<HTMLDivElement>(null);
  const joystickOrigin  = useRef({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);

  /* ── CAMERA SWIPE ──────────────────────────────────────── */
  const lookTouchId = useRef<number | null>(null);
  const lookLast    = useRef({ x: 0, y: 0 });

  const JOYSTICK_RADIUS = 52;

  /* ── AUTO-FIRE ─────────────────────────────────────────── */
  const shootInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const shootingRef   = useRef(false);

  const startShooting = useCallback(() => {
    if (shootingRef.current) return;
    shootingRef.current = true;
    onShoot();
    shootInterval.current = setInterval(() => onShoot(), 150);
  }, [onShoot]);

  const stopShooting = useCallback(() => {
    shootingRef.current = false;
    if (shootInterval.current) { clearInterval(shootInterval.current); shootInterval.current = null; }
  }, []);

  /* ── JOYSTICK START ────────────────────────────────────── */
  const onJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    joystickOrigin.current = {
      x: rect.left + rect.width  / 2,
      y: rect.top  + rect.height / 2,
    };
  }, []);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        /* Joystick */
        if (touch.identifier === joystickTouchId.current) {
          const dx   = touch.clientX - joystickOrigin.current.x;
          const dy   = touch.clientY - joystickOrigin.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const clamp = Math.min(dist, JOYSTICK_RADIUS);
          const angle = Math.atan2(dy, dx);
          const nx = Math.cos(angle) * clamp / JOYSTICK_RADIUS;
          const ny = Math.sin(angle) * clamp / JOYSTICK_RADIUS;
          mobileJoystick.x =  nx;
          mobileJoystick.y = -ny; // schermo: y↓ = indietro
          if (knobRef.current) {
            knobRef.current.style.transform =
              `translate(calc(-50% + ${Math.cos(angle) * clamp}px), calc(-50% + ${Math.sin(angle) * clamp}px))`;
          }
        }

        /* Camera look */
        if (touch.identifier === lookTouchId.current) {
          mobileLook.dx += (touch.clientX - lookLast.current.x) * 0.004;
          mobileLook.dy += (touch.clientY - lookLast.current.y) * 0.004;
          lookLast.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          mobileJoystick.x = 0;
          mobileJoystick.y = 0;
          if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
        }
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null;
        }
      }
    };

    window.addEventListener("touchmove",   onTouchMove,  { passive: true });
    window.addEventListener("touchend",    onTouchEnd,   { passive: true });
    window.addEventListener("touchcancel", onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchmove",   onTouchMove);
      window.removeEventListener("touchend",    onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  /* ── CAMERA AREA (metà destra schermo) ─────────────────── */
  const onLookStart = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // ignora se già attivo o se il touch è nella metà sinistra (joystick)
      if (lookTouchId.current !== null) continue;
      if (touch.clientX < window.innerWidth * 0.45) continue;
      lookTouchId.current = touch.identifier;
      lookLast.current    = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  if (!isMobile) return null;

  /* ── RENDER ─────────────────────────────────────────────── */
  const btn = (
    label: string,
    bottom: number,
    right: number,
    size: number,
    color: string,
    border: string,
    glow: string,
    onStart: () => void,
    onEnd?: () => void,
    fontSize = 10,
  ) => (
    <div
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onStart(); }}
      onTouchEnd={(e)   => { e.preventDefault(); e.stopPropagation(); onEnd?.(); }}
      style={{
        position: "absolute",
        bottom, right,
        width: size, height: size,
        borderRadius: "50%",
        background: color,
        border: `3px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "auto",
        touchAction: "none",
        boxShadow: `0 0 18px ${glow}`,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <span style={{
        color: "#fff",
        fontSize,
        fontWeight: 900,
        letterSpacing: 1,
        textTransform: "uppercase",
        textAlign: "center",
        lineHeight: 1.2,
        pointerEvents: "none",
      }}>
        {label}
      </span>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
      }}
      onTouchStart={onLookStart}
    >
      {/* ── ZONA CAMERA — indicatore visivo leggero ───────── */}
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: "55%", height: "100%",
        background: "transparent",
        pointerEvents: "none",
      }} />

      {/* ── JOYSTICK SINISTRO ─────────────────────────────── */}
      <div
        ref={joystickRef}
        onTouchStart={onJoystickStart}
        style={{
          position: "absolute",
          bottom: 50, left: 40,
          width: 120, height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          border: "2px solid rgba(255,255,255,0.28)",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 24px rgba(255,255,255,0.08)",
        }}
      >
        {/* Segni direzionali */}
        {["↑","↓","←","→"].map((arrow, i) => {
          const positions = [
            { top: 4,  left: "50%", transform: "translateX(-50%)" },
            { bottom: 4, left: "50%", transform: "translateX(-50%)" },
            { top: "50%", left: 4, transform: "translateY(-50%)" },
            { top: "50%", right: 4, transform: "translateY(-50%)" },
          ];
          return (
            <div key={i} style={{
              position: "absolute",
              ...positions[i],
              color: "rgba(255,255,255,0.35)",
              fontSize: 12,
              pointerEvents: "none",
              userSelect: "none",
            }}>{arrow}</div>
          );
        })}
        {/* Knob */}
        <div
          ref={knobRef}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 46, height: 46,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.30)",
            border: "2px solid rgba(255,255,255,0.55)",
            transition: "transform 0.04s",
            pointerEvents: "none",
            boxShadow: "0 0 10px rgba(255,255,255,0.15)",
          }}
        />
      </div>

      {/* ── ETICHETTA MOVIMENTO ───────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 178, left: 60,
        color: "rgba(255,255,255,0.30)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        MUOVI
      </div>

      {/* ── ETICHETTA CAMERA ──────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 20, right: 20,
        color: "rgba(255,255,255,0.20)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        TRASCINA PER MIRARE →
      </div>

      {/* ── PULSANTE SPARA (grande, basso destra) ─────────── */}
      {btn(
        "🔫\nSPARA",
        55, 155,
        80,
        "rgba(200,20,20,0.80)",
        "rgba(255,80,80,0.90)",
        "rgba(220,30,30,0.60)",
        startShooting,
        stopShooting,
        11,
      )}

      {/* ── PULSANTE RICARICA ─────────────────────────────── */}
      {btn(
        "🔄\nRICAR.",
        160, 50,
        62,
        "rgba(200,140,0,0.80)",
        "rgba(255,200,60,0.90)",
        "rgba(220,170,0,0.50)",
        onReload,
        undefined,
        10,
      )}

      {/* ── FRECCE CAMBIO ARMA ────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 50, right: 40,
        display: "flex",
        gap: 10,
        pointerEvents: "auto",
      }}>
        {([-1, 1] as const).map((dir) => (
          <div
            key={dir}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); onWeaponSwitch(dir); }}
            style={{
              width: 50, height: 50,
              borderRadius: 12,
              background: "rgba(80,80,80,0.65)",
              border: "2px solid rgba(255,255,255,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              touchAction: "none",
              boxShadow: "0 0 10px rgba(0,0,0,0.4)",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <span style={{ color: "#fff", fontSize: 20, pointerEvents: "none" }}>
              {dir === -1 ? "◀" : "▶"}
            </span>
          </div>
        ))}
      </div>

      {/* ── ETICHETTA ARMI ────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 108, right: 60,
        color: "rgba(255,255,255,0.28)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        ARMA
      </div>
    </div>
  );
}
