'use client';
import React, { useRef, useEffect, useState } from 'react';

interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const normalizedX = (x / rect.width) * 100;
      const normalizedY = (y / rect.height) * 100;
      
      setMousePos({ x: normalizedX, y: normalizedY });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const brightness = Math.max(50, 90 - (mousePos.x * 0.3 + mousePos.y * 0.25));

  return (
    <div 
      ref={containerRef}
      style={{
        width: "100%", 
        height: "100%",
        background: `
          radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, 
            rgba(140,140,140,${brightness/100}) 0%, 
            rgba(100,100,100,${brightness/100}) 5%, 
            rgba(70,70,70,${brightness/100}) 12%, 
            rgba(40,40,40,${brightness/100}) 20%,
            rgba(8,8,8,0.99) 100%)
        `,
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "'OCR A Extended', 'Courier New', monospace",
        userSelect: "none", 
        position: "relative", 
        overflow: "hidden",
        padding: "0 clamp(20px, 5vw, 60px)",
        transition: 'background 0.06s ease-out'
      }}
    >
      <style>{`
        :root {
          /* COLORI ORIGINALI */
          --bright-snow: #f8f9faff;
          --platinum: #e9ecefff;
          --alabaster-grey: #dee2e6ff;
          --pale-slate: #ced4daff;
          --pale-slate-2: #adb5bdff;
          --slate-grey: #6c757dff;
          --iron-grey: #495057ff;
          --gunmetal: #343a40ff;
          --carbon-black: #212529ff;
          --onyx: #0b090aff;
          --carbon-black-dark: #161a1dff;
          --dark-garnet: #660708ff;
          --mahogany-red: #a4161aff;
          --mahogany-red-2: #ba181bff;
          --strawberry-red: #e5383bff;
          --silver: #b1a7a6ff;
          --dust-grey: #d3d3d3ff;
          --white-smoke: #f5f3f4ff;
          --white: #ffffffff;
          
          /* TUTTE LE CARDS ORA GRIGIE - GAMING STYLE */
          --steel-grey: #9ca3af;
          --silver-grey: #d1d5db;
          --dark-steel: #6b7280;
          --graphite: #4b5563;
          --chrome-glow: #e5e7eb;
          --glass-grey: rgba(156, 163, 175, 0.15);
          --grey-void: #1f2937;
        }
      `}</style>

      <div style={{ 
        textAlign: "center", 
        zIndex: 2,
        maxWidth: "800px"
      }}>
        {/* TITOLO E BUTTON - invariati */}
        <div style={{
          marginBottom: "clamp(24px, 4vh, 36px)",
          position: "relative"
        }}>
          <div style={{
            fontSize: "clamp(48px, 10vw, 120px)",
            fontWeight: 900,
            background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red), var(--dark-garnet))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 0 40px rgba(229,56,59,0.6)",
            lineHeight: 1, 
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            marginBottom: "clamp(4px, 0.8vh, 8px)"
          }}>
            DEAD
          </div>
          <div style={{
            fontSize: "clamp(44px, 9vw, 110px)",
            fontWeight: 900,
            color: "var(--white-smoke)",
            textShadow: "0 0 30px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.5)",
            lineHeight: 1, 
            letterSpacing: "-0.02em",
            textTransform: "uppercase"
          }}>
            ZONE
          </div>
        </div>

        <div style={{
          color: "var(--pale-slate)",
          fontSize: "clamp(14px, 1.6vw, 18px)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 500,
          marginBottom: "clamp(60px, 8vh, 80px)",
          textShadow: "0 1px 3px rgba(0,0,0,0.8)"
        }}>
          ZOMBIE SURVIVAL · ONDE INFINITE · SOPRAVVIVENZA EXTREME
        </div>

        <button
          onClick={onStart}
          style={{
            background: "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red-2), var(--dark-garnet))",
            border: "none",
            borderRadius: "clamp(16px, 2vw, 24px)",
            color: "var(--white-smoke)",
            fontSize: "clamp(20px, 2.8vw, 28px)",
            fontWeight: 800,
            padding: "clamp(18px, 2.5vw, 28px) clamp(48px, 6vw, 72px)",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontFamily: "'OCR A Extended', 'Courier New', monospace",
            boxShadow: `
              0 20px 40px rgba(229,56,59,0.4),
              0 0 0 1px rgba(255,255,255,0.1),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `,
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            position: "relative",
            overflow: "hidden",
            marginBottom: "clamp(60px, 8vh, 80px)"
          }}
          onMouseEnter={(e) => {
            const btn = e.target as HTMLElement;
            btn.style.transform = "translateY(-4px) scale(1.02)";
            btn.style.boxShadow = `
              0 30px 60px rgba(229,56,59,0.6),
              0 0 0 1px rgba(255,255,255,0.2),
              inset 0 1px 0 rgba(255,255,255,0.3)
            `;
            btn.style.background = "linear-gradient(135deg, #ff6b6b, var(--strawberry-red), var(--mahogany-red))";
          }}
          onMouseLeave={(e) => {
            const btn = e.target as HTMLElement;
            btn.style.transform = "translateY(0) scale(1)";
            btn.style.boxShadow = `
              0 20px 40px rgba(229,56,59,0.4),
              0 0 0 1px rgba(255,255,255,0.1),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `;
            btn.style.background = "linear-gradient(135deg, var(--strawberry-red), var(--mahogany-red-2), var(--dark-garnet))";
          }}
        >
          PLAY
        </button>

        {/* CARDS CONTROLLI - TUTTE GRIGIE */}
        <div style={{
          transform: "scale(0.85)",
          transformOrigin: "center",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch",
          gap: "clamp(20px, 2.8vw, 28px)",
          maxWidth: "900px",
          margin: "0 auto clamp(40px, 5vh, 60px) auto",
          padding: "0 clamp(16px, 2vw, 32px)"
        }}>
          
          {/* MOVIMENTO - GRIGIO STEEL */}
          <div style={{
            background: `
              radial-gradient(ellipse at top left, var(--glass-grey) 0%, transparent 50%),
              linear-gradient(145deg, rgba(156,163,175,0.12), rgba(107,114,128,0.08)),
              linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
            `,
            padding: "clamp(24px, 2.9vw, 32px) clamp(24px, 3.2vw, 32px)",
            borderRadius: "24px",
            border: "2px solid rgba(156,163,175,0.7)",
            backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
            boxShadow: `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `,
            position: "relative",
            overflow: "hidden",
            flex: "1",
            minWidth: "260px",
            maxWidth: "280px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(-6px) scale(1.02)";
            card.style.boxShadow = `
              0 40px 80px rgba(156,163,175,0.6),
              0 20px 40px rgba(0,0,0,0.8),
              0 0 0 1px rgba(156,163,175,0.7),
              inset 0 1px 0 rgba(255,255,255,0.35),
              0 0 60px rgba(156,163,175,0.35)
            `;
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(0) scale(1)";
            card.style.boxShadow = `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `;
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
              marginBottom: "clamp(10px, 1.4vw, 14px)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: "0 0 24px rgba(156,163,175,0.95)"
            }}>
              MOVIMENTO
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(14px, 1.8vw, 18px)",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "0.04em",
              marginBottom: "3px",
              textShadow: "0 0 20px rgba(156,163,175,0.5)"
            }}>
              WASD
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "0.03em"
            }}>
              Muovi • Corri
            </div>
          </div>

          {/* COMBAT - GRIGIO STEEL (IDENTICO) */}
          <div style={{
            background: `
              radial-gradient(ellipse at top right, var(--glass-grey) 0%, transparent 50%),
              linear-gradient(145deg, rgba(156,163,175,0.12), rgba(107,114,128,0.08)),
              linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
            `,
            padding: "clamp(24px, 2.9vw, 32px) clamp(24px, 3.2vw, 32px)",
            borderRadius: "24px",
            border: "2px solid rgba(156,163,175,0.7)",
            backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
            boxShadow: `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `,
            position: "relative",
            overflow: "hidden",
            flex: "1",
            minWidth: "260px",
            maxWidth: "280px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(-6px) scale(1.02)";
            card.style.boxShadow = `
              0 40px 80px rgba(156,163,175,0.6),
              0 20px 40px rgba(0,0,0,0.8),
              0 0 0 1px rgba(156,163,175,0.7),
              inset 0 1px 0 rgba(255,255,255,0.35),
              0 0 60px rgba(156,163,175,0.35)
            `;
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(0) scale(1)";
            card.style.boxShadow = `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `;
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
              marginBottom: "clamp(10px, 1.4vw, 14px)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: "0 0 24px rgba(156,163,175,0.95)"
            }}>
              COMBAT
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(14px, 1.8vw, 18px)",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "0.04em",
              marginBottom: "3px",
              textShadow: "0 0 20px rgba(156,163,175,0.5)"
            }}>
              Click Sinistro
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "0.03em"
            }}>
              Spara • R Ricarica
            </div>
          </div>

          {/* UTILITY - GRIGIO STEEL (IDENTICO) */}
          <div style={{
            background: `
              radial-gradient(ellipse at top center, var(--glass-grey) 0%, transparent 50%),
              linear-gradient(145deg, rgba(156,163,175,0.12), rgba(107,114,128,0.08)),
              linear-gradient(145deg, var(--grey-void) 0%, var(--onyx) 50%, var(--carbon-black) 100%)
            `,
            padding: "clamp(24px, 2.9vw, 32px) clamp(24px, 3.2vw, 32px)",
            borderRadius: "24px",
            border: "2px solid rgba(156,163,175,0.7)",
            backdropFilter: "blur(35px) saturate(150%) brightness(1.4)",
            boxShadow: `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `,
            position: "relative",
            overflow: "hidden",
            flex: "1",
            minWidth: "260px",
            maxWidth: "280px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(-6px) scale(1.02)";
            card.style.boxShadow = `
              0 40px 80px rgba(156,163,175,0.6),
              0 20px 40px rgba(0,0,0,0.8),
              0 0 0 1px rgba(156,163,175,0.7),
              inset 0 1px 0 rgba(255,255,255,0.35),
              0 0 60px rgba(156,163,175,0.35)
            `;
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget as HTMLElement;
            card.style.transform = "translateY(0) scale(1)";
            card.style.boxShadow = `
              0 25px 60px rgba(156,163,175,0.4),
              0 12px 32px rgba(0,0,0,0.7),
              0 0 0 1px rgba(156,163,175,0.4),
              inset 0 1px 0 rgba(255,255,255,0.25),
              0 0 40px rgba(156,163,175,0.2)
            `;
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
              marginBottom: "clamp(10px, 1.4vw, 14px)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow: "0 0 24px rgba(156,163,175,0.95)"
            }}>
              UTILITY
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(14px, 1.8vw, 18px)",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "0.04em",
              marginBottom: "3px",
              textShadow: "0 0 20px rgba(156,163,175,0.5)"
            }}>
              E Cassa
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "0.03em",
              marginBottom: "3px"
            }}>
              P Pausa
            </div>
            <div style={{
              color: "var(--white)",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "0.03em"
            }}>
              ESC Esci
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
