'use client';
import { useState } from "react";
import GameScene from "@/components/GameScene";
import HUD from "@/components/HUD";
import GameOverScreen from "@/components/GameOverScreen";
import MainMenu from "@/components/MainMenu";
import { WeaponId } from "@/components/weapons";

export interface GameStats {
  health: number;
  score: number;
  wave: number;
  kills: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  currentWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  // Munizioni per arma — mantenute al cambio arma
  weaponAmmo:    Partial<Record<WeaponId, number>>;
  weaponReserve: Partial<Record<WeaponId, number>>;
}

const INITIAL_STATS: GameStats = {
  health: 100,
  score: 0,
  wave: 1,
  kills: 0,
  ammo: 8,
  maxAmmo: 8,
  reserveAmmo: 48,
  isReloading: false,
  currentWeapon: "pistol",
  unlockedWeapons: ["pistol"],
  weaponAmmo:    { pistol: 8 },
  weaponReserve: { pistol: 48 },
};

type GameState = "menu" | "playing" | "gameover";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [stats, setStats]         = useState<GameStats>(INITIAL_STATS);
  const [nearWeapon, setNearWeapon] = useState<WeaponId | null>(null);

  const handleWeaponNear = (id: WeaponId, near: boolean) => {
    setNearWeapon(near ? id : null);
  };

  const handleStart = () => {
    setStats(INITIAL_STATS);
    setNearWeapon(null);
    setGameState("playing");
  };

  const handleGameOver = () => {
    setGameState("gameover");
    setNearWeapon(null);
  };

  const handleRestart = () => {
    setStats(INITIAL_STATS);
    setNearWeapon(null);
    setGameState("playing");
  };

  const handleMenu = () => {
    setStats(INITIAL_STATS);
    setNearWeapon(null);
    setGameState("menu");
  };

  if (gameState === "menu") {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <MainMenu onStart={handleStart} />
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <GameOverScreen stats={stats} onRestart={handleRestart} onMenu={handleMenu} />
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <GameScene
        stats={stats}
        setStats={setStats}
        onGameOver={handleGameOver}
        onWeaponNearChange={handleWeaponNear}
      />
      <HUD
        stats={stats}
        nearAmmoCrate={false}
        nearWeapon={nearWeapon}
      />
    </div>
  );
}