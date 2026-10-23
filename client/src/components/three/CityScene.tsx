import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { MathUtils } from "three";

// Stylised city block: a few streets, buildings, trees and three issue pins
// whose colours match complaint statuses (pending, in progress, resolved).

const COLORS = {
  ground: "#1d1a4a",
  road: "#0f0d2b",
  lane: "#3a3580",
  buildings: ["#5536f5", "#6552ff", "#4728d8", "#8579ff", "#3b23ae", "#a8a3ff"],
  roof: "#3ee8bb",
  tree: "#14d1a0",
  trunk: "#3b2f5c",
};

// Deterministic pseudo-random so the city looks the same on every load.
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const BLOCKS: [number, number][] = [];
for (const x of [-4, -2.4, 2.4, 4]) for (const z of [-4, -2.4, 2.4, 4]) BLOCKS.push([x, z]);

function Buildings() {
  const items = useMemo(
    () =>
      BLOCKS.map(([x, z], i) => {
        const h = 0.6 + rand(i + 1) * 2.6;
        return { x, z, h, w: 1 + rand(i + 7) * 0.35, color: COLORS.buildings[i % COLORS.buildings.length], lit: rand(i + 3) > 0.55 };
      }),
    []
  );
  return (
    <>
      {items.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshStandardMaterial color={b.color} roughness={0.55} metalness={0.15} />
          </mesh>
          {b.lit && (
            <mesh position={[0, b.h + 0.04, 0]}>
              <boxGeometry args={[b.w * 0.7, 0.08, b.w * 0.7]} />
              <meshStandardMaterial color={COLORS.roof} emissive={COLORS.roof} emissiveIntensity={0.9} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function Streets() {
  const lanes = useMemo(() => Array.from({ length: 9 }, (_, i) => -4.8 + i * 1.2), []);
  return (
    <>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 1.4]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[12, 1.4]} />
        <meshStandardMaterial color={COLORS.road} />
      </mesh>
      {lanes.map((p) => (
        <group key={p}>
          <mesh position={[p, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.06]} />
            <meshBasicMaterial color={COLORS.lane} />
          </mesh>
          <mesh position={[0, 0.02, p]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.5, 0.06]} />
            <meshBasicMaterial color={COLORS.lane} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Trees() {
  const spots: [number, number][] = [[-1.1, -3.2], [1.1, 3.4], [-3.2, 1.1], [3.3, -1.1], [-1.1, 4.6], [4.6, 1.1]];
  return (
    <>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} scale={0.8 + rand(i + 20) * 0.4}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.3, 6]} />
            <meshStandardMaterial color={COLORS.trunk} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.26, 0.6, 7]} />
            <meshStandardMaterial color={COLORS.tree} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Pin({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const pin = useRef<Group>(null);
  const ring = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + delay;
    if (pin.current) pin.current.position.y = 1.15 + Math.sin(t * 2) * 0.12;
    if (ring.current) {
      const phase = (t * 0.6) % 1;
      ring.current.scale.setScalar(0.4 + phase * 1.4);
      (ring.current.material as MeshBasicMaterial).opacity = 0.7 * (1 - phase);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.32, 0.4, 40]} />
        <meshBasicMaterial color={color} transparent />
      </mesh>
      <group ref={pin}>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.45, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function City() {
  const group = useRef<Group>(null);

  useFrame(({ pointer, clock }, delta) => {
    if (!group.current) return;
    // Slow idle rotation plus a gentle tilt toward the pointer.
    const idle = clock.getElapsedTime() * 0.08;
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, idle + pointer.x * 0.35, 3, delta);
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -pointer.y * 0.08, 3, delta);
  });

  return (
    <group ref={group}>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[12, 0.4, 12]} />
        <meshStandardMaterial color={COLORS.ground} roughness={0.9} />
      </mesh>
      <Streets />
      <Buildings />
      <Trees />
      {/* Pothole on the main road */}
      <mesh position={[1.4, 0.025, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial color="#05040f" />
      </mesh>
      <Pin position={[1.4, 0, 0.15]} color="#f59e0b" delay={0} />
      <Pin position={[-0.1, 0, -2.6]} color="#8579ff" delay={1.3} />
      <Pin position={[-2.9, 0, 0.1]} color="#3ee8bb" delay={2.4} />
    </group>
  );
}

export default function CityScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [15, 13, 18], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <hemisphereLight args={["#c7c2ff", "#120f33", 0.9]} />
      <directionalLight position={[6, 10, 4]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-8, 4, -6]} intensity={0.6} color="#3ee8bb" />
      <City />
    </Canvas>
  );
}
