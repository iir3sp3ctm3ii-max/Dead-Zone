// weapons.ts — definizioni centralizzate delle armi

export type WeaponId = "pistol" | "shotgun" | "smg";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  cost: number;           // punti per sbloccare
  ammoCost: number;       // punti per ricaricare riserva
  maxAmmo: number;        // colpi nel caricatore
  maxReserve: number;     // riserva massima
  damage: number;         // danno base per proiettile
  pellets: number;        // proiettili per sparo (shotgun = più di 1)
  spread: number;         // angolo spread in radianti (0 = nessuno)
  fireRate: number;       // colpi al secondo (per auto-fire SMG)
  reloadTime: number;     // ms ricarica
  auto: boolean;          // fuoco automatico tenendo premuto
  bulletSpeed: number;    // velocità proiettile
  description: string;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: {
    id: "pistol",
    name: "1911",
    cost: 0,
    ammoCost: 500,
    maxAmmo: 8,
    maxReserve: 48,
    damage: 30,
    pellets: 1,
    spread: 0,
    fireRate: 3,
    reloadTime: 1800,
    auto: false,
    bulletSpeed: 40,
    description: "Pistola affidabile. Precisa, lenta.",
  },
  shotgun: {
    id: "shotgun",
    name: "SHOTGUN",
    cost: 1500,
    ammoCost: 400,
    maxAmmo: 6,
    maxReserve: 30,
    damage: 18,           // per pallettone × 6 pallettoni = 108 danno max ravvicinato
    pellets: 6,
    spread: 0.12,
    fireRate: 1.2,
    reloadTime: 2400,
    auto: false,
    bulletSpeed: 35,
    description: "Devastante a corto raggio.",
  },
  smg: {
    id: "smg",
    name: "SMG",
    cost: 3000,
    ammoCost: 600,
    maxAmmo: 30,
    maxReserve: 120,
    damage: 15,
    pellets: 1,
    spread: 0.03,
    fireRate: 10,
    reloadTime: 1400,
    auto: true,
    bulletSpeed: 45,
    description: "Fuoco automatico. Alto DPS.",
  },
};

export const WEAPON_ORDER: WeaponId[] = ["pistol", "shotgun", "smg"];