// MobileControls.tsx - Controlli touch per mobile
// Joystick sinistro = movimento, pulsanti destra = azioni
//
// ARCHITETTURA:
//   mobileJoystickRef  → scritto qui, letto da Player.tsx nel useFrame
//   mobileActionsRef   → shoot/reload/buy assegnati da Player.tsx e AmmoCrate.tsx
//
import { useEffect, useRef, useCallback } from "react";

// ── Ref globali ─────────────────────────────────────────────────────
export const mobileJoystickRef = {
  current: { x: 0, y: 0 },  // x = strafe, y = avanti(−)/indietro(+)
};

export const mobileActionsRef: {
  shoot: (() => void) | null;
  reload: (() => void) | null;
  buy:    (() => void) | null;
} = {
  shoot:  null,
  reload: null,
  buy:    null,
};
// ────────────────────────────────────────────────────────────────────

interface MobileControlsProps {
  nearAmmoCrate: boolean;
}

export default function MobileControls({ nearAmmoCrate }: MobileControlsProps) {
  const joystickAreaRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  const JOYSTICK_RADIUS = 55;

  const updateJoystick = useCallback((touchX: number, touchY: number) => {
    const cx = joystickCenterRef.current.x;
    const cy = joystickCenterRef.current.y;
    let dx = touchX - cx;
    let dy = touchY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_RADIUS) {
      dx = (dx / dist) * JOYSTICK_RADIUS;
      dy = (dy / dist) * JOYSTICK_RADIUS;
    }
    mobileJoystickRef.current = { x: dx / JOYSTICK_RADIUS, y: dy / JOYSTICK_RADIUS };
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  }, []);

  const resetJoystick = useCallback(() => {
    mobileJoystickRef.current = { x: 0, y: 0 };
    joystickTouchIdRef.current = null;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = "translate(-50%, -50%)";
    }
  }, []);

  useEffect(() => {
    const area = joystickAreaRef.current;
    if (!area) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joystickTouchIdRef.current = t.identifier;
      const rect = area.getBoundingClientRect();
      joystickCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateJoystick(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchIdRef.current)
          updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === joystickTouchIdRef.current) resetJoystick();
    };

    area.addEventListener("touchstart", onTouchStart, { passive: false });
    area.addEventListener("touchmove",  onTouchMove,  { passive: false });
    area.addEventListener("touchend",   onTouchEnd,   { passive: false });
    area.addEventListener("touchcancel",onTouchEnd,   { passive: false });
    return () => {
      area.removeEventListener("touchstart", onTouchStart);
      area.removeEventListener("touchmove",  onTouchMove);
      area.removeEventListener("touchend",   onTouchEnd);
      area.removeEventListener("touchcancel",onTouchEnd);
    };
  }, [updateJoystick, resetJoystick]);

  return (
    <div style={{
      position: "absolute",
      bottom: 0, left: 0, right: 0,
      height: "220px",
      pointerEvents: "none",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: "0 20px 28px 20px",
      zIndex: 50,
    }}>

      {/* ──────────── JOYSTICK SINISTRO ──────────── */}
      <div
        ref={joystickAreaRef}
        style={{
          width: 140, height: 140,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.35)",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: "0 0 24px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)",
          position: "relative",
          pointerEvents: "auto",
          backdropFilter: "blur(6px)",
          flexShrink: 0,
        }}
      >
        {/* anello interno decorativo */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 90, height: 90, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          pointerEvents: "none",
        }} />

        {/* frecce cardinali */}
        {[
          { top: 10, left: "50%", label: "▲", ml: -6, mt: 0 },
          { bottom: 10, left: "50%", label: "▼", ml: -6, mt: 0 },
          { left: 10, top: "50%", label: "◀", ml: 0, mt: -8 },
          { right: 10, top: "50%", label: "▶", ml: 0, mt: -8 },
        ].map(({ label, ml, mt, ...pos }, i) => (
          <div key={i} style={{
            position: "absolute", ...pos,
            marginLeft: ml, marginTop: mt,
            color: "rgba(255,255,255,0.28)",
            fontSize: 12, pointerEvents: "none", userSelect: "none",
          }}>{label}</div>
        ))}

        {/* knob */}
        <div
          ref={joystickKnobRef}
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 50, height: 50, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
            border: "2px solid rgba(255,255,255,0.45)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.55)",
            transition: "transform 0.05s ease-out",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ──────────── PULSANTI DESTRA ──────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, pointerEvents: "auto" }}>

        {/* SPARA — grande */}
        <ActionButton
          label="🔫"
          sublabel="SPARA"
          color="#cc2222"
          glowColor="rgba(204,34,34,0.6)"
          size={72}
          onPress={() => mobileActionsRef.shoot?.()}
        />

        {/* RICARICA + MUNIZIONI — piccoli, su riga */}
        <div style={{ display: "flex", gap: 14 }}>
          <ActionButton
            label="R"
            sublabel="RICARICA"
            color="#555555"
            glowColor="rgba(150,150,150,0.4)"
            size={56}
            onPress={() => mobileActionsRef.reload?.()}
          />
          {nearAmmoCrate && (
            <ActionButton
              label="E"
              sublabel="500 pt"
              color="#997700"
              glowColor="rgba(221,170,51,0.55)"
              size={56}
              onPress={() => mobileActionsRef.buy?.()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pulsante azione generico ─── */
function ActionButton({
  label, sublabel, color, glowColor, size, onPress,
}: {
  label: string;
  sublabel: string;
  color: string;
  glowColor: string;
  size: number;
  onPress: () => void;
}) {
  const btnRef = useRef<HTMLDivElement>(null);

  const press = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (btnRef.current) { btnRef.current.style.transform = "scale(0.87)"; btnRef.current.style.opacity = "0.72"; }
    onPress();
  };
  const release = (e: React.TouchEvent) => {
    e.preventDefault();
    if (btnRef.current) { btnRef.current.style.transform = "scale(1)"; btnRef.current.style.opacity = "1"; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        ref={btnRef}
        onTouchStart={press}
        onTouchEnd={release}
        onTouchCancel={release}
        style={{
          width: size, height: size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}55)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 18px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size > 60 ? 28 : 20, fontWeight: "bold", color: "#ffffff",
          fontFamily: "'Courier New', monospace",
          cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
          transition: "transform 0.08s ease, opacity 0.08s ease",
          backdropFilter: "blur(4px)",
        }}
      >
        {label}
      </div>
      <div style={{
        color: "rgba(255,255,255,0.45)",
        fontSize: 9, letterSpacing: 1.5,
        fontFamily: "'Courier New', monospace",
        fontWeight: "bold", textTransform: "uppercase",
      }}>
        {sublabel}
      </div>
    </div>
  );
}
