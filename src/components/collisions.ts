import * as THREE from "three";

export interface CollisionBox {
  cx: number; cz: number;
  hw: number; hd: number;
}

// ── EDIFICI — solo la faccia che sporge in campo ──────────────
const BUILDINGS: CollisionBox[] = [
  // Nord z=-26, muro frontale a z≈-24
  { cx: -18, cz: -24.5, hw: 4.0, hd: 2.0 },
  { cx:  -6, cz: -24.5, hw: 3.5, hd: 2.0 },
  { cx:   5, cz: -24.5, hw: 3.0, hd: 2.0 },
  { cx:  16, cz: -24.5, hw: 4.0, hd: 2.0 },
  // Sud z=26, muro frontale a z≈24
  { cx: -16, cz:  24.5, hw: 4.5, hd: 2.0 },
  { cx:  -4, cz:  24.5, hw: 3.0, hd: 2.0 },
  { cx:   7, cz:  24.5, hw: 3.5, hd: 2.0 },
  { cx:  18, cz:  24.5, hw: 4.0, hd: 2.0 },
  // Ovest x=-26, muro frontale a x≈-24
  { cx: -24.5, cz: -14, hw: 2.0, hd: 3.5 },
  { cx: -24.5, cz:   0, hw: 2.0, hd: 3.0 },
  { cx: -24.5, cz:  14, hw: 2.0, hd: 4.0 },
  // Est x=26, muro frontale a x≈24
  { cx:  24.5, cz: -14, hw: 2.0, hd: 3.5 },
  { cx:  24.5, cz:   0, hw: 2.0, hd: 3.0 },
  { cx:  24.5, cz:  14, hw: 2.0, hd: 4.0 },
];

// ── AUTO BRUCIATE — hitbox stretta, solo il corpo centrale ────
// BurnedCar reale: 2.0×4.2 ma usiamo ~1.0×2.0 per non bloccare
const CARS: CollisionBox[] = [
  { cx:  -8, cz:   6, hw: 1.0, hd: 1.8 },
  { cx:  10, cz:  -8, hw: 1.8, hd: 1.0 },
  { cx: -12, cz: -10, hw: 1.0, hd: 1.8 },
  { cx:   6, cz:  14, hw: 1.0, hd: 1.8 },
  { cx:  -5, cz:  18, hw: 1.0, hd: 1.8 },
  { cx:  15, cz:   5, hw: 1.8, hd: 1.0 },
];

// ── CASSE ─────────────────────────────────────────────────────
const CRATES: CollisionBox[] = [
  { cx:   4,  cz:  -5, hw: 0.48, hd: 0.48 },
  { cx:  -7,  cz:   3, hw: 0.48, hd: 0.48 },
  { cx:   9,  cz:   9, hw: 0.48, hd: 0.48 },
  { cx: -11,  cz:  -9, hw: 0.48, hd: 0.48 },
  { cx:  13,  cz: -13, hw: 0.48, hd: 0.48 },
  { cx: -14,  cz:  11, hw: 0.48, hd: 0.48 },
  { cx:   2,  cz:  15, hw: 0.48, hd: 0.48 },
  { cx:  -3,  cz: -15, hw: 0.48, hd: 0.48 },
  { cx:   7,  cz:   9, hw: 0.48, hd: 0.48 },
  { cx:   5,  cz:  -7, hw: 0.48, hd: 0.48 }, // stack
];

// ── BARILI ────────────────────────────────────────────────────
const BARRELS: CollisionBox[] = [
  { cx:   8, cz:  -8, hw: 0.38, hd: 0.38 },
  { cx:  -9, cz:   5, hw: 0.38, hd: 0.38 },
  { cx:  15, cz:   4, hw: 0.38, hd: 0.38 },
  { cx:  -6, cz: -15, hw: 0.38, hd: 0.38 },
  { cx:   3, cz:  12, hw: 0.38, hd: 0.38 },
  { cx: -13, cz:   8, hw: 0.38, hd: 0.38 },
  { cx:  11, cz:  -3, hw: 0.38, hd: 0.38 },
  { cx:  -4, cz:  -7, hw: 0.38, hd: 0.38 },
];

// ── BARRICADE ─────────────────────────────────────────────────
const BARRICADES: CollisionBox[] = [
  { cx:   0, cz:  -8, hw: 1.05, hd: 0.20 },
  { cx:  -6, cz:   4, hw: 0.20, hd: 1.05 },
  { cx:   8, cz:   2, hw: 1.05, hd: 0.20 },
  { cx: -10, cz:  -4, hw: 0.20, hd: 1.05 },
  { cx:   4, cz:  10, hw: 1.05, hd: 0.20 },
];

// ── PALI LAMPIONI — sottili, solo il palo ─────────────────────
const LAMPPOSTS: CollisionBox[] = [
  { cx: -21, cz: -21, hw: 0.12, hd: 0.12 },
  { cx:  -7, cz: -21, hw: 0.12, hd: 0.12 },
  { cx:   7, cz: -21, hw: 0.12, hd: 0.12 },
  { cx:  21, cz: -21, hw: 0.12, hd: 0.12 },
  { cx: -21, cz:  21, hw: 0.12, hd: 0.12 },
  { cx:  -7, cz:  21, hw: 0.12, hd: 0.12 },
  { cx:   7, cz:  21, hw: 0.12, hd: 0.12 },
  { cx:  21, cz:  21, hw: 0.12, hd: 0.12 },
  { cx: -21, cz:  -7, hw: 0.12, hd: 0.12 },
  { cx: -21, cz:   7, hw: 0.12, hd: 0.12 },
  { cx:  21, cz:  -7, hw: 0.12, hd: 0.12 },
  { cx:  21, cz:   7, hw: 0.12, hd: 0.12 },
  { cx: -21, cz:   0, hw: 0.12, hd: 0.12 },
  { cx:  21, cz:   0, hw: 0.12, hd: 0.12 },
  { cx:   0, cz: -21, hw: 0.12, hd: 0.12 },
];

export const ALL_COLLIDERS: CollisionBox[] = [
  ...BUILDINGS,
  ...CARS,
  ...CRATES,
  ...BARRELS,
  ...BARRICADES,
  ...LAMPPOSTS,
];

// ─────────────────────────────────────────────────────────────
// resolveCollision — spinge pos fuori dagli ostacoli AABB
// ─────────────────────────────────────────────────────────────
export function resolveCollision(
  pos: THREE.Vector3,
  radius: number,
  boxes: CollisionBox[] = ALL_COLLIDERS
): boolean {
  let hit = false;
  const CULL = 6 + radius; // ignora box più lontane di 6u — risparmia ~80% dei check
  for (const box of boxes) {
    const dx = pos.x - box.cx;
    const dz = pos.z - box.cz;
    // Early-exit AABB ampio — evita abs/subtract se troppo lontano
    if (Math.abs(dx) > CULL || Math.abs(dz) > CULL) continue;
    const ox = box.hw + radius - Math.abs(dx);
    const oz = box.hd + radius - Math.abs(dz);
    if (ox > 0 && oz > 0) {
      if (ox < oz) {
        pos.x += ox * Math.sign(dx);
      } else {
        pos.z += oz * Math.sign(dz);
      }
      hit = true;
    }
  }
  return hit;
}
