import { GameStats } from "@/pages/Game";

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ stats, onRestart, onMenu }: GameOverScreenProps) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "rgba(10,0,0,0.95)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      userSelect: "none",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 80, fontWeight: "bold",
          color: "#cc0000",
          textShadow: "0 0 40px #cc0000, 0 0 80px #660000",
          lineHeight: 1, letterSpacing: 4, marginBottom: 8,
          animation: "fadeIn 0.5s ease-out",
        }}>
          SEI MORTO
        </div>

        <div style={{
          color: "#553333", fontSize: 12, letterSpacing: 6,
          textTransform: "uppercase", marginBottom: 48,
        }}>
          I MORTI HANNO PRESO IL CONTROLLO
        </div>

        <div style={{
          display: "flex", gap: 60, justifyContent: "center",
          marginBottom: 48, padding: "24px 48px",
          border: "1px solid rgba(204,0,0,0.3)",
          background: "rgba(0,0,0,0.5)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#555544", fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>PUNTEGGIO</div>
            <div style={{ color: "#dddddd", fontSize: 32, fontWeight: "bold", letterSpacing: 2 }}>
              {stats.score}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#555544", fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>ONDATA</div>
            <div style={{ color: "#ddaa33", fontSize: 32, fontWeight: "bold", letterSpacing: 2 }}>
              {stats.wave}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#555544", fontSize: 10, letterSpacing: 3, marginBottom: 6 }}>UCCISIONI</div>
            <div style={{ color: "#dd4433", fontSize: 32, fontWeight: "bold", letterSpacing: 2 }}>
              {stats.kills}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <button
            onClick={onRestart}
            style={{
              background: "transparent",
              border: "2px solid #cc3300", color: "#cc3300",
              fontSize: 14, letterSpacing: 5, padding: "12px 36px",
              cursor: "pointer", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", fontWeight: "bold",
              textShadow: "0 0 8px #cc3300", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(204,51,0,0.2)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}
          >
            RIPROVA
          </button>

          <button
            onClick={onMenu}
            style={{
              background: "transparent",
              border: "2px solid #555533", color: "#888866",
              fontSize: 14, letterSpacing: 5, padding: "12px 36px",
              cursor: "pointer", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", fontWeight: "bold",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(85,85,51,0.2)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}
          >
            MENU PRINCIPALE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
