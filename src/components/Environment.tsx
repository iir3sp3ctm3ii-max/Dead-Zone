import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── MATERIALI ─────────────────────────────────────────────────
const asphaltMat  = new THREE.MeshStandardMaterial({ color: "#555250", roughness: 0.95, metalness: 0.0 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: "#6e6b67", roughness: 0.92, metalness: 0.0 });
const brickMat    = new THREE.MeshStandardMaterial({ color: "#7a4e34", roughness: 0.86, metalness: 0.04 });
const brickDkMat  = new THREE.MeshStandardMaterial({ color: "#5c3822", roughness: 0.90, metalness: 0.03 });
const cementMat   = new THREE.MeshStandardMaterial({ color: "#6a6860", roughness: 0.90, metalness: 0.02 });
const rustMat     = new THREE.MeshStandardMaterial({ color: "#7a4820", roughness: 0.80, metalness: 0.45 });
const woodMat     = new THREE.MeshStandardMaterial({ color: "#6a4a28", roughness: 0.92, metalness: 0.0 });
const boardMat    = new THREE.MeshStandardMaterial({ color: "#503818", roughness: 0.88, metalness: 0.0 });
const ashMat      = new THREE.MeshStandardMaterial({ color: "#3a3530", roughness: 0.98, metalness: 0.0 });
const poleMat     = new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.55, metalness: 0.92 });
const lampHoodMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.50, metalness: 0.95 });
const lampGlowMat = new THREE.MeshStandardMaterial({
  color: "#fff8e0", emissive: new THREE.Color("#ffdd44"),
  emissiveIntensity: 4.0, roughness: 0.1, metalness: 0.0,
});
const carBodyMat  = new THREE.MeshStandardMaterial({ color: "#5a4a40", roughness: 0.70, metalness: 0.55 });
const carRoofMat  = new THREE.MeshStandardMaterial({ color: "#4a3a30", roughness: 0.75, metalness: 0.50 });
const carWheelMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.90, metalness: 0.10 });
const carRimMat   = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: 0.60, metalness: 0.80 });
const carGlassMat = new THREE.MeshStandardMaterial({ color: "#2a3540", roughness: 0.20, metalness: 0.15, transparent: true, opacity: 0.45 });
const carUndMat   = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.95, metalness: 0.30 });
const flameMat    = new THREE.MeshBasicMaterial({ color: "#ff6600" });
const emberMat    = new THREE.MeshBasicMaterial({ color: "#ffbb00", transparent: true, opacity: 0.75 });

const coneLampMat = new THREE.MeshBasicMaterial({
  color: "#ffeeaa", transparent: true, opacity: 0.055,
  side: THREE.BackSide, depthWrite: false,
});
const coneFireMat = new THREE.MeshBasicMaterial({
  color: "#ff7700", transparent: true, opacity: 0.09,
  side: THREE.BackSide, depthWrite: false,
});

// ── LAMPIONE ──────────────────────────────────────────────────
function Lamppost({ position, broken = false }: {
  position: [number,number,number]; broken?: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * 100);
  useFrame((_, delta) => {
    if (!lightRef.current || !broken) return;
    t.current += delta;
    const n = Math.sin(t.current*17)*Math.sin(t.current*5.1)*Math.sin(t.current*29);
    lightRef.current.intensity = Math.max(0, 5.5 + n*4.0);
  });
  const armAngle = -Math.PI/8, armLen = 1.4;
  const headX = Math.sin(-armAngle)*armLen*0.9;
  const headY = Math.cos(-armAngle)*armLen*0.5;
  const poleRot: [number,number,number] = broken ? [0,0,0.10] : [0,0,0];
  return (
    <group position={position} rotation={poleRot}>
      <mesh position={[0,2.8,0]} material={poleMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.07,0.11,5.6,10]} />
      </mesh>
      <mesh position={[0,5.6,0]} material={poleMat}>
        <sphereGeometry args={[0.09,8,8]} />
      </mesh>
      <group position={[0,5.6,0]}>
        <mesh position={[Math.sin(-armAngle)*armLen*0.5, Math.cos(-armAngle)*armLen*0.5-armLen*0.5, 0]}
          rotation={[0,0,armAngle]} material={poleMat} castShadow>
          <cylinderGeometry args={[0.045,0.045,armLen,8]} />
        </mesh>
        <group position={[headX,headY,0]}>
          <mesh position={[0,0.14,0]} material={lampHoodMat} castShadow>
            <cylinderGeometry args={[0.06,0.30,0.28,12]} />
          </mesh>
          <mesh position={[0,0.01,0]} material={lampHoodMat}>
            <cylinderGeometry args={[0.33,0.31,0.06,12]} />
          </mesh>
          <mesh position={[0,0.02,0]} material={lampGlowMat}>
            <sphereGeometry args={[0.11,10,8]} />
          </mesh>
          <mesh position={[0,-1.5,0]}>
            <coneGeometry args={[2.2,3.0,18,1,true]} />
            <primitive object={coneLampMat} attach="material" />
          </mesh>
          <mesh position={[0,-0.8,0]}>
            <coneGeometry args={[0.8,1.6,14,1,true]} />
            <primitive object={coneLampMat} attach="material" />
          </mesh>
          <pointLight ref={lightRef} position={[0,0,0]} color="#ffd060"
            intensity={broken ? 5.5 : 8.0} distance={24} decay={1.5} />
        </group>
      </group>
    </group>
  );
}

// ── FIAMMA ────────────────────────────────────────────────────
function Flame({ position, scale = 1 }: { position: [number,number,number]; scale?: number }) {
  const coneRef  = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random()*10);
  useFrame((_, delta) => {
    t.current += delta;
    if (coneRef.current) {
      coneRef.current.scale.y    = 0.85 + Math.sin(t.current*7.2)*0.22;
      coneRef.current.scale.x    = 0.92 + Math.sin(t.current*5.0)*0.13;
      coneRef.current.rotation.y = t.current*1.9;
    }
    if (lightRef.current) lightRef.current.intensity = (3.5+Math.sin(t.current*8.5)*1.0)*scale;
  });
  return (
    <group position={position} scale={[scale,scale,scale]}>
      <mesh ref={coneRef} material={flameMat} position={[0,0.3,0]}>
        <coneGeometry args={[0.17,0.65,7]} />
      </mesh>
      <mesh position={[0,0.05,0]} material={emberMat}>
        <sphereGeometry args={[0.21,7,7]} />
      </mesh>
      <mesh position={[0,-0.3,0]}>
        <coneGeometry args={[1.5,3.0,12,1,true]} />
        <primitive object={coneFireMat} attach="material" />
      </mesh>
      <pointLight ref={lightRef} color="#ff6600" intensity={3.5} distance={12} decay={1.5} />
    </group>
  );
}

// ── AUTO ──────────────────────────────────────────────────────
function BurnedCar({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0,rotation,0]}>
      <mesh position={[0,0.18,0]} material={carUndMat} castShadow receiveShadow>
        <boxGeometry args={[1.90,0.18,4.10]} />
      </mesh>
      <mesh position={[0,0.52,0]} material={carBodyMat} castShadow receiveShadow>
        <boxGeometry args={[1.85,0.42,4.00]} />
      </mesh>
      <mesh position={[0,0.46,-1.6]} material={carBodyMat} castShadow receiveShadow>
        <boxGeometry args={[1.95,0.30,0.70]} />
      </mesh>
      <mesh position={[0,0.46, 1.6]} material={carBodyMat} castShadow receiveShadow>
        <boxGeometry args={[1.95,0.30,0.70]} />
      </mesh>
      <mesh position={[0,0.88,0.10]} material={carRoofMat} castShadow receiveShadow>
        <boxGeometry args={[1.65,0.38,2.10]} />
      </mesh>
      <mesh position={[0,0.82,-0.95]} rotation={[0.40,0,0]} material={carGlassMat}>
        <boxGeometry args={[1.50,0.42,0.05]} />
      </mesh>
      <mesh position={[0,0.82, 1.08]} rotation={[-0.40,0,0]} material={carGlassMat}>
        <boxGeometry args={[1.50,0.38,0.05]} />
      </mesh>
      <mesh position={[-0.83,0.88,0.10]} rotation={[0,Math.PI/2,0]} material={carGlassMat}>
        <boxGeometry args={[1.60,0.30,0.04]} />
      </mesh>
      <mesh position={[0.83,0.88,0.10]} rotation={[0,Math.PI/2,0]} material={carGlassMat}>
        <boxGeometry args={[1.60,0.30,0.04]} />
      </mesh>
      {([-0.92,0.92] as number[]).flatMap((x,i) =>
        ([-1.35,1.35] as number[]).map((z,j) => (
          <group key={`${i}-${j}`} position={[x,0.28,z]}>
            <mesh rotation={[0,0,Math.PI/2]} material={carWheelMat} castShadow receiveShadow>
              <cylinderGeometry args={[0.28,0.28,0.22,14]} />
            </mesh>
            <mesh rotation={[0,0,Math.PI/2]} material={carRimMat}>
              <cylinderGeometry args={[0.16,0.16,0.24,8]} />
            </mesh>
          </group>
        ))
      )}
      <mesh position={[0,0.01,0]} rotation={[-Math.PI/2,0,0]} material={ashMat} receiveShadow>
        <planeGeometry args={[2.2,4.5]} />
      </mesh>
    </group>
  );
}

// ── EDIFICIO ──────────────────────────────────────────────────
function Building({ position, width, depth, height, rotation = 0, destroyed = false }: {
  position: [number,number,number]; width: number; depth: number;
  height: number; rotation?: number; destroyed?: boolean;
}) {
  const winCount = Math.floor(width/2.8);
  return (
    <group position={position} rotation={[0,rotation,0]}>
      <mesh position={[0,height/2, depth/2]} material={brickMat}  castShadow receiveShadow>
        <boxGeometry args={[width,height,0.4]} />
      </mesh>
      <mesh position={[0,height/2,-depth/2]} material={brickDkMat} castShadow receiveShadow>
        <boxGeometry args={[width,height,0.4]} />
      </mesh>
      <mesh position={[-width/2,height/2,0]} material={brickDkMat} castShadow receiveShadow>
        <boxGeometry args={[0.4,height,depth]} />
      </mesh>
      <mesh position={[ width/2,height/2,0]} material={brickMat}  castShadow receiveShadow>
        <boxGeometry args={[0.4,height,depth]} />
      </mesh>
      <mesh position={[0,height+0.12,0]} material={cementMat} castShadow receiveShadow>
        <boxGeometry args={[width+0.1,0.25,depth+0.1]} />
      </mesh>
      {destroyed && (
        <>
          <mesh position={[ width*0.22,height+0.28, 0.1]} material={cementMat} castShadow receiveShadow>
            <boxGeometry args={[width*0.45,0.18,depth*0.8]} />
          </mesh>
          <mesh position={[-width*0.18,height-0.4,-0.15]} material={brickMat} castShadow receiveShadow>
            <boxGeometry args={[width*0.35,0.14,depth*0.5]} />
          </mesh>
        </>
      )}
      {[...Array(winCount)].map((_,i) => (
        <group key={i} position={[(-width/2)+1.5+i*2.8, height*0.50, depth/2+0.22]}>
          <mesh material={boardMat}><boxGeometry args={[0.9,1.1,0.06]} /></mesh>
          <mesh rotation={[0,0, 0.55]} material={woodMat}><boxGeometry args={[1.2,0.09,0.07]} /></mesh>
          <mesh rotation={[0,0,-0.55]} material={woodMat}><boxGeometry args={[1.2,0.09,0.07]} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ── MACERIE ───────────────────────────────────────────────────
function Debris({ position }: { position: [number,number,number] }) {
  const pieces: [number,number,number,number,number][] = [
    [-0.7,0.06, 0.5,0,  0.3],[ 0.6,0.06,-0.3,0.8,0  ],
    [-0.3,0.06,-0.7,0.5,0.2],[ 0.8,0.06, 0.4,1.2,0.1],
    [-0.5,0.10, 0.2,2.1,0  ],[ 0.2,0.10,-0.6,0.3,0.1],
    [-0.9,0.06,-0.1,1.8,0  ],[ 0.4,0.10, 0.8,0.6,0.1],
  ];
  return (
    <group position={position}>
      {pieces.map(([x,y,z,ry,rz],i) => (
        <mesh key={i} position={[x,y,z]} rotation={[0,ry,rz]}
          material={i%2===0 ? brickMat : cementMat} castShadow receiveShadow>
          <boxGeometry args={[0.32,0.10,0.22]} />
        </mesh>
      ))}
    </group>
  );
}

// ── BARRICATA ─────────────────────────────────────────────────
function Barricade({ position, rotation = 0 }: { position: [number,number,number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0,rotation,0]}>
      {[0.22,0.62,1.02].map((y,i) => (
        <mesh key={i} position={[0,y,0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[2.1,0.13,0.11]} />
        </mesh>
      ))}
      {[-0.88,0.88].map((x,i) => (
        <mesh key={i} position={[x,0.62,0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[0.11,1.45,0.13]} />
        </mesh>
      ))}
    </group>
  );
}

// ── EXPORT ────────────────────────────────────────────────────
export default function Environment() {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        // Coni fiamma/glow e piani sono Basic — non ricevono luci, skip
        if (mesh.material instanceof THREE.MeshBasicMaterial) return;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
  }, []);

  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} material={asphaltMat} receiveShadow>
        <planeGeometry args={[60,60]} />
      </mesh>
      {([[0,-22],[0,22]] as [number,number][]).map(([x,z],i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x,0.03,z]} material={sidewalkMat} receiveShadow>
          <planeGeometry args={[60,6]} />
        </mesh>
      ))}
      {([[-22,0],[22,0]] as [number,number][]).map(([x,z],i) => (
        <mesh key={i} rotation={[-Math.PI/2,0,0]} position={[x,0.03,z]} material={sidewalkMat} receiveShadow>
          <planeGeometry args={[6,60]} />
        </mesh>
      ))}
      {([-19,19] as number[]).map((x,i) => (
        <mesh key={i} position={[x,0.06,0]} material={cementMat} castShadow receiveShadow>
          <boxGeometry args={[0.20,0.12,58]} />
        </mesh>
      ))}
      {([-19,19] as number[]).map((z,i) => (
        <mesh key={i} position={[0,0.06,z]} material={cementMat} castShadow receiveShadow>
          <boxGeometry args={[58,0.12,0.20]} />
        </mesh>
      ))}

      <mesh position={[0,4,-30]}  material={cementMat} castShadow receiveShadow><boxGeometry args={[60,8,0.6]} /></mesh>
      <mesh position={[0,4, 30]}  material={cementMat} castShadow receiveShadow><boxGeometry args={[60,8,0.6]} /></mesh>
      <mesh position={[-30,4,0]}  material={cementMat} castShadow receiveShadow><boxGeometry args={[0.6,8,60]} /></mesh>
      <mesh position={[ 30,4,0]}  material={cementMat} castShadow receiveShadow><boxGeometry args={[0.6,8,60]} /></mesh>

      <Building position={[-18,0,-26]} width={8} depth={4} height={6} destroyed />
      <Building position={[-6, 0,-26]} width={7} depth={4} height={7} />
      <Building position={[5,  0,-26]} width={6} depth={4} height={5} destroyed />
      <Building position={[16, 0,-26]} width={8} depth={4} height={8} />
      <Building position={[-16,0, 26]} width={9} depth={4} height={6} rotation={Math.PI} />
      <Building position={[-4, 0, 26]} width={6} depth={4} height={7} rotation={Math.PI} destroyed />
      <Building position={[7,  0, 26]} width={7} depth={4} height={5} rotation={Math.PI} />
      <Building position={[18, 0, 26]} width={8} depth={4} height={8} rotation={Math.PI} destroyed />
      <Building position={[-26,0,-14]} width={4} depth={7} height={6} rotation={Math.PI/2} />
      <Building position={[-26,0,  0]} width={4} depth={6} height={5} rotation={Math.PI/2} destroyed />
      <Building position={[-26,0, 14]} width={4} depth={8} height={7} rotation={Math.PI/2} />
      <Building position={[26, 0,-14]} width={4} depth={7} height={5} rotation={-Math.PI/2} destroyed />
      <Building position={[26, 0,  0]} width={4} depth={6} height={6} rotation={-Math.PI/2} />
      <Building position={[26, 0, 14]} width={4} depth={8} height={8} rotation={-Math.PI/2} destroyed />

      {/* AUTO — posizioni verificate, nessun oggetto nel raggio 2.5u */}
      <BurnedCar position={[-8, 0,  6]} rotation={0.3}  />
      <BurnedCar position={[10, 0, -8]} rotation={-0.5} />
      <BurnedCar position={[-12,0,-10]} rotation={1.2}  />
      <BurnedCar position={[6,  0, 14]} rotation={2.8}  />
      <BurnedCar position={[-5, 0, 18]} rotation={0.8}  />
      <BurnedCar position={[15, 0,  5]} rotation={-1.1} />

      {/*
        CASSE — griglia di sicurezza:
        Auto occupano circa: (-8±2,6±2), (10±2,-8±2), (-12±2,-10±2),
                             (6±2,14±2), (-5±2,18±2), (15±2,5±2)
        Ogni cassa è a min 3u da qualsiasi auto e 1.5u da altre casse
      */}
      {([
        // Zona centro-nord libera
        [ 0,   0.45,  -4,  0.30],  // centro, lontano da tutto
        [ 3,   0.45,  -7,  0.70],  // centro-nord
        // Stack zona centro-ovest (lontano da auto)
        [-4,   0.45, -12,  0.20],  // base
        [-4,   1.35, -12,  0.55],  // sopra
        // Zona ovest sicura
        [-16,  0.45,  -3,  0.90],
        [-17,  0.45,   8,  0.40],
        // Zona est sicura (lontano da auto a 15,5 e 10,-8)
        [ 18,  0.45,  -5,  1.20],
        [ 17,  0.45,  11,  0.60],
        // Zona sud (lontano da auto a -5,18 e 6,14)
        [  2,  0.45,  22,  0.15],  // vicino marciapiede sud
        [-12,  0.45,  14,  0.80],  // zona ovest-sud, fuori dal raggio auto
        // Zona nord
        [ -2,  0.45, -20,  0.50],
        [ 13,  0.45, -17,  1.10],
      ] as [number,number,number,number][]).map(([x,y,z,r],i) => (
        <mesh key={i} position={[x,y,z]} rotation={[0,r,0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[0.9,0.9,0.9]} />
        </mesh>
      ))}

      {/*
        BARILI — a 3u min da auto, 1.5u min da casse
        y=0.60 sempre (metà altezza cilindro 1.2)
      */}
      {([
        // Centro libero
        [ -3,  0.60,  -9],   // lontano da tutto
        [  4,  0.60, -14],   // zona sud-est
        // Ovest
        [-14,  0.60,  -7],
        [-15,  0.60,  10],
        // Est (lontano da auto 10,-8 e 15,5)
        [ 21,  0.60,  -9],   // vicino muro est
        [ 20,  0.60,  12],
        // Nord/Sud lontani
        [  8,  0.60, -19],   // zona nord
        [ -9,  0.60,  23],   // zona sud vicino marciapiede
      ] as [number,number,number][]).map((pos,i) => (
        <mesh key={i} position={pos} material={rustMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.35,0.35,1.2,8]} />
        </mesh>
      ))}

      {/* BARRICADE — in zone aperte, non bloccano passaggi principali */}
      <Barricade position={[ 0,  0, -6]} />
      <Barricade position={[-7,  0,  5]} rotation={0.8} />
      <Barricade position={[ 9,  0,  2]} rotation={-0.3} />
      <Barricade position={[-11, 0, -5]} rotation={1.5} />
      <Barricade position={[ 5,  0, 11]} rotation={0.5} />

      {/* MACERIE */}
      <Debris position={[-16,0,-8]}  /><Debris position={[13, 0, 7]}  />
      <Debris position={[-6, 0,-19]} /><Debris position={[19, 0,-13]} />
      <Debris position={[-19,0, 11]} /><Debris position={[4,  0, 19]} />
      <Debris position={[-9, 0, 15]} /><Debris position={[15, 0,-2]}  />

      {/* LAMPIONI */}
      <Lamppost position={[-21,0,-21]} /><Lamppost position={[ -7,0,-21]} />
      <Lamppost position={[  7,0,-21]} /><Lamppost position={[ 21,0,-21]} />
      <Lamppost position={[-21,0, 21]} /><Lamppost position={[ -7,0, 21]} />
      <Lamppost position={[  7,0, 21]} /><Lamppost position={[ 21,0, 21]} />
      <Lamppost position={[-21,0, -7]} /><Lamppost position={[-21,0,  7]} />
      <Lamppost position={[ 21,0, -7]} /><Lamppost position={[ 21,0,  7]} />
      <Lamppost position={[-21,0,  0]} broken />
      <Lamppost position={[ 21,0,  0]} broken />
      <Lamppost position={[  0,0,-21]} broken />

      {/* FIAMME */}
      <Flame position={[-8, 0, 6]}  />
      <Flame position={[10, 0,-8]}  />
      <Flame position={[-12,0,-10]} />
      <Flame position={[4,  0, 14]} />
      <Flame position={[15, 0, 5]}  />
      <Flame position={[-18,6.5,-26]} scale={2.0} />
      <Flame position={[5,  5.5,-26]} scale={1.6} />
      <Flame position={[-4, 7.5, 26]} scale={1.8} />
      <Flame position={[26, 5.5,-14]} scale={1.5} />
    </group>
  );
}