import { useEffect, useRef, useCallback } from "react";

// ── REFS GLOBALI — letti dal Player ogni frame ─────────────────
export const mobileJoystick = {
  x: 0,  // -1 (sinistra) → +1 (destra)
  y: 0,  // -1 (indietro) → +1 (avanti)
};
export const mobileLook = {
  dx: 0, // delta rotazione camera X
  dy: 0, // delta rotazione camera Y
};
export const mobileShoot  = { current: false };
export const mobileReload = { current: false };
export const isMobile = /Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 1);

// ── COMPONENTE ─────────────────────────────────────────────────
interface MobileControlsProps {
  onShoot:  () => void;
  onReload: () => void;
  onWeaponSwitch: (dir: 1 | -1) => void;
}

export default function MobileControls({ onShoot, onReload, onWeaponSwitch }: MobileControlsProps) {
  // Joystick
  const joystickRef     = useRef<HTMLDivElement>(null);
  const knobRef         = useRef<HTMLDivElement>(null);
  const joystickActive  = useRef(false);
  const joystickOrigin  = useRef({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);

  // Camera swipe (metà destra dello schermo)
  const lookTouchId   = useRef<number | null>(null);
  const lookLast      = useRef({ x: 0, y: 0 });

  const JOYSTICK_RADIUS = 55;

  // ── JOYSTICK ──────────────────────────────────────────────
  const onJoystickStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    joystickActive.current  = true;
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

        // Joystick
        if (touch.identifier === joystickTouchId.current) {
          const dx = touch.clientX - joystickOrigin.current.x;
          const dy = touch.clientY - joystickOrigin.current.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const clamped = Math.min(dist, JOYSTICK_RADIUS);
          const angle   = Math.atan2(dy, dx);
          const nx = Math.cos(angle) * clamped / JOYSTICK_RADIUS;
          const ny = Math.sin(angle) * clamped / JOYSTICK_RADIUS;
          mobileJoystick.x = nx;
          mobileJoystick.y = -ny; // y invertita: su = avanti
          if (knobRef.current) {
            // correzione: schermo Y down = ny positivo = back
            knobRef.current.style.transform =
              `translate(calc(-50% + ${nx * JOYSTICK_RADIUS}px), calc(-50% + ${Math.sin(angle)*clamped}px))`;
          }
        }

        // Camera look
        if (touch.identifier === lookTouchId.current) {
          mobileLook.dx += (touch.clientX - lookLast.current.x) * 0.003;
          mobileLook.dy += (touch.clientY - lookLast.current.y) * 0.003;
          lookLast.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === joystickTouchId.current) {
          joystickTouchId.current = null;
          joystickActive.current  = false;
          mobileJoystick.x = 0;
          mobileJoystick.y = 0;
          if (knobRef.current) {
            knobRef.current.style.transform = "translate(-50%, -50%)";
          }
        }
        if (touch.identifier === lookTouchId.current) {
          lookTouchId.current = null;
        }
      }
    };

    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    window.addEventListener("touchcancel",onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("touchcancel",onTouchEnd);
    };
  }, []);

  const onLookStart = useCallback((e: React.TouchEvent) => {
    // Solo se il touch parte nella metà destra e non è già attivo
    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    if (touch.clientX < window.innerWidth * 0.45) return;
    lookTouchId.current = touch.identifier;
    lookLast.current    = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
  }, []);

  if (!isMobile) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onTouchStart={onLookStart}
    >
      {/* ── PULSANTE PAUSA (P) ─────────────────────────── */}
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }));
        }}
        style={{
          position: "absolute",
          top: 20, left: 20,
          width: 48, height: 48,
          borderRadius: "12px",
          background: "rgba(0,0,0,0.5)",
          border: "2px solid rgba(255,255,255,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>⏸</span>
      </div>

      {/* ── JOYSTICK SINISTRO ─────────────────────────── */}
      <div
        ref={joystickRef}
        onTouchStart={onJoystickStart}
        style={{
          position: "absolute",
          bottom: 40, left: 40,
          width:  120, height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "2px solid rgba(255,255,255,0.25)",
          pointerEvents: "auto",
          touchAction: "none",
        }}
      >
        {/* Knob */}
        <div
          ref={knobRef}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 48, height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.35)",
            border: "2px solid rgba(255,255,255,0.6)",
            transition: "transform 0.05s",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── PULSANTE AZIONE (E / F) ─────────────────────────── */}
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          // Emette gli eventi tastiera in modo che AmmoCrate e WeaponWall funzionino nativamente
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }));
        }}
        style={{
          position: "absolute",
          bottom: 200, left: 68,
          width: 64, height: 64,
          borderRadius: "50%",
          background: "rgba(34,204,68,0.75)",
          border: "3px solid rgba(80,255,100,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 16px rgba(34,204,68,0.4)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
          AZIONE
        </span>
      </div>

      {/* ── PULSANTE SPARA ────────────────────────────── */}
      <div
        onTouchStart={(e) => { e.preventDefault(); onShoot(); }}
        style={{
          position: "absolute",
          bottom: 60, right: 160,
          width: 72, height: 72,
          borderRadius: "50%",
          background: "rgba(220,30,30,0.75)",
          border: "3px solid rgba(255,80,80,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 20px rgba(220,30,30,0.5)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
          SPARA
        </span>
      </div>

      {/* ── PULSANTE RICARICA ─────────────────────────── */}
      <div
        onTouchStart={(e) => { e.preventDefault(); onReload(); }}
        style={{
          position: "absolute",
          bottom: 150, right: 50,
          width: 60, height: 60,
          borderRadius: "50%",
          background: "rgba(255,170,0,0.75)",
          border: "3px solid rgba(255,200,80,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 16px rgba(255,170,0,0.4)",
        }}
      >
        <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
          RICARICA
        </span>
      </div>

      {/* ── FRECCE CAMBIO ARMA ────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 40, right: 40,
        display: "flex", gap: 8,
        pointerEvents: "auto",
      }}>
        <div
          onTouchStart={(e) => { e.preventDefault(); onWeaponSwitch(-1); }}
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(100,100,100,0.6)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            touchAction: "none",
          }}
        >
          <span style={{ color: "#fff", fontSize: 18 }}>◀</span>
        </div>
        <div
          onTouchStart={(e) => { e.preventDefault(); onWeaponSwitch(1); }}
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: "rgba(100,100,100,0.6)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            touchAction: "none",
          }}
        >
          <span style={{ color: "#fff", fontSize: 18 }}>▶</span>
        </div>
      </div>

      {/* ── AREA CAMERA (destra) — indicatore visivo ──── */}
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: "55%", height: "100%",
        background: "transparent",
        pointerEvents: "none",
      }} />
    </div>
  );
}