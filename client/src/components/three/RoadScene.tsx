import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { MathUtils } from "three";

// A street seen from the side: traffic flowing both ways, street lamps, and a
// road crew fixing a pothole behind cones, marked with a pulsing pin.

const ROAD_LENGTH = 30;
const CAR_COLORS = ["#8579ff", "#f8fafc", "#3ee8bb", "#f59e0b", "#e11d48", "#a8a3ff"];

function Car({ lane, offset, speed, color }: { lane: number; offset: number; speed: number; color: string }) {
  const ref = useRef<Group>(null);
  const direction = lane > 0 ? 1 : -1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const travelled = (clock.getElapsedTime() * speed + offset) % ROAD_LENGTH;
    ref.current.position.x = direction * (travelled - ROAD_LENGTH / 2);
  });

  return (
    <group ref={ref} position={[0, 0, lane]} rotation={[0, direction > 0 ? 0 : Math.PI, 0]}>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[1.5, 0.36, 0.72]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[-0.1, 0.58, 0]}>
        <boxGeometry args={[0.8, 0.28, 0.62]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* Headlights and tail lights */}
      {[-0.22, 0.22].map((z) => (
        <group key={z}>
          <mesh position={[0.76, 0.3, z]}>
            <boxGeometry args={[0.04, 0.08, 0.14]} />
            <meshBasicMaterial color="#fffbe6" />
          </mesh>
          <mesh position={[-0.76, 0.3, z]}>
            <boxGeometry args={[0.04, 0.08, 0.14]} />
            <meshBasicMaterial color="#ff3b5c" />
          </mesh>
        </group>
      ))}
      {[-0.5, 0.5].map((x) =>
        [-0.36, 0.36].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.12, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
            <meshStandardMaterial color="#0b0a1f" />
          </mesh>
        ))
      )}
    </group>
  );
}

function StreetLamp({ x, side }: { x: number; side: number }) {
  return (
    <group position={[x, 0, side * 2.6]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 2.4, -side * 0.3]}>
        <boxGeometry args={[0.08, 0.06, 0.6]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 2.34, -side * 0.55]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshBasicMaterial color="#fde68a" />
      </mesh>
      {/* Pool of light on the pavement */}
      <mesh position={[0, 0.015, -side * 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 24]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function Worker({ x, z, delay }: { x: number; z: number; delay: number }) {
  const arm = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.z = Math.sin(clock.getElapsedTime() * 4 + delay) * 0.5 - 0.4;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.16, 0.45, 4, 8]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color="#c08457" />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <group ref={arm} position={[0.1, 0.62, 0]}>
        <mesh position={[0.18, -0.1, 0]} rotation={[0, 0, -0.8]}>
          <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>
    </group>
  );
}

function WorkZone() {
  const ring = useRef<Mesh>(null);
  const pin = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pin.current) pin.current.position.y = 1.6 + Math.sin(t * 2) * 0.12;
    if (ring.current) {
      const phase = (t * 0.6) % 1;
      ring.current.scale.setScalar(0.5 + phase * 1.6);
      (ring.current.material as MeshBasicMaterial).opacity = 0.7 * (1 - phase);
    }
  });

  const cones: [number, number][] = [[1.2, 0.2], [2.4, 0.2], [3.6, 0.2], [1.2, 1.6], [3.6, 1.6]];
  return (
    <group position={[-3.6, 0, 0]}>
      {/* Pothole being filled */}
      <mesh position={[2.4, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#05040f" />
      </mesh>
      <mesh ref={ring} position={[2.4, 0.03, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 40]} />
        <meshBasicMaterial color="#3ee8bb" transparent />
      </mesh>
      {cones.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.25, 0]}>
            <coneGeometry args={[0.16, 0.5, 16]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.105, 0.12, 0.08, 16]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}
      <Worker x={1.8} z={0.9} delay={0} />
      <Worker x={3.0} z={1.1} delay={1.5} />
      <group ref={pin} position={[2.4, 1.6, 0.9]}>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshStandardMaterial color="#3ee8bb" emissive="#3ee8bb" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.18, 0.42, 24]} />
          <meshStandardMaterial color="#3ee8bb" emissive="#3ee8bb" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function Street() {
  const group = useRef<Group>(null);
  const dashes = useMemo(() => Array.from({ length: 16 }, (_, i) => -ROAD_LENGTH / 2 + i * 2), []);
  const cars = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        lane: i % 2 === 0 ? 0.75 : -0.75,
        offset: i * 5.3,
        speed: 2.2 + (i % 3) * 0.6,
        color: CAR_COLORS[i % CAR_COLORS.length],
      })),
    []
  );

  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, -0.35 + pointer.x * 0.12, 3, delta);
  });

  return (
    <group ref={group}>
      {/* Asphalt and pavements */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[ROAD_LENGTH, 0.1, 3.4]} />
        <meshStandardMaterial color="#14122e" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.02, side * 2.6]}>
          <boxGeometry args={[ROAD_LENGTH, 0.14, 1.8]} />
          <meshStandardMaterial color="#2a2660" roughness={0.9} />
        </mesh>
      ))}
      {dashes.map((x) => (
        <mesh key={x} position={[x, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.08]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => -12 + i * 4).map((x, i) => (
        <StreetLamp key={x} x={x} side={i % 2 === 0 ? 1 : -1} />
      ))}
      <WorkZone />
      {cars.map((car, i) => (
        <Car key={i} {...car} />
      ))}
    </group>
  );
}

export default function RoadScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 4.2, 9], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <hemisphereLight args={["#c7c2ff", "#120f33", 1]} />
      <directionalLight position={[4, 8, 6]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.5} color="#3ee8bb" />
      <Street />
    </Canvas>
  );
}
