import { Line, OrbitControls, Text } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { magnitude } from "../physics/complex";
import { sampleFields, surfaceCurrent } from "../physics/waveguide";
import type {
  LayerVisibility,
  Vector3Value,
  WaveguideParams,
  WaveguideResults,
} from "../physics/types";

const COLORS = {
  E: "#32d5ff",
  H: "#ff5d8f",
  Jd: "#f6c85f",
  Jsigma: "#b48cff",
  S: "#72e69b",
  Js: "#ff9f43",
};

function Arrow({
  position,
  vector,
  color,
  scale,
}: {
  position: [number, number, number];
  vector: Vector3Value;
  color: string;
  scale: number;
}) {
  const object = useMemo(() => {
    const direction = new THREE.Vector3(vector.x, vector.y, vector.z);
    const rawLength = direction.length();
    if (rawLength < 1e-30) return null;
    direction.normalize();
    return new THREE.ArrowHelper(
      direction,
      new THREE.Vector3(...position),
      Math.min(0.45, 0.08 + rawLength * scale),
      color,
      0.09,
      0.045,
    );
  }, [color, position, scale, vector.x, vector.y, vector.z]);

  return object ? <primitive object={object} /> : null;
}

function Scene({
  params,
  results,
  layers,
}: {
  params: WaveguideParams;
  results: WaveguideResults;
  layers: LayerVisibility;
}) {
  const sx = 2;
  const sy = (2 * params.b) / params.a;
  const sz = 4;
  const toScene = (x: number, y: number, z: number) =>
    [
      (x / params.a - 0.5) * sx,
      (y / params.b - 0.5) * sy,
      (z / params.length - 0.5) * sz,
    ] as [number, number, number];

  const volumeSamples = useMemo(() => {
    const values = [];
    const nx = 4;
    const ny = 3;
    const nz = 7;
    for (let iz = 0; iz < nz; iz += 1) {
      for (let iy = 0; iy < ny; iy += 1) {
        for (let ix = 0; ix < nx; ix += 1) {
          const x = ((ix + 0.5) / nx) * params.a;
          const y = ((iy + 0.5) / ny) * params.b;
          const z = ((iz + 0.5) / nz) * params.length;
          values.push({
            position: toScene(x, y, z),
            fields: sampleFields(params, results, x, y, z),
          });
        }
      }
    }
    return values;
  }, [params, results]);

  const maxima = useMemo(() => {
    const keys = ["E", "H", "Jd", "Jsigma", "S"] as const;
    return Object.fromEntries(
      keys.map((key) => [
        key,
        Math.max(...volumeSamples.map((sample) => magnitude(sample.fields[key])), 1e-30),
      ]),
    ) as Record<(typeof keys)[number], number>;
  }, [volumeSamples]);

  const surfaceSamples = useMemo(() => {
    const samples: {
      position: [number, number, number];
      vector: Vector3Value;
    }[] = [];
    for (let iz = 0; iz < 7; iz += 1) {
      const z = ((iz + 0.5) / 7) * params.length;
      for (let i = 0; i < 4; i += 1) {
        const t = (i + 0.5) / 4;
        samples.push({
          position: toScene(0, t * params.b, z),
          vector: surfaceCurrent(params, results, "x0", t * params.b, z),
        });
        samples.push({
          position: toScene(params.a, t * params.b, z),
          vector: surfaceCurrent(params, results, "xa", t * params.b, z),
        });
        samples.push({
          position: toScene(t * params.a, 0, z),
          vector: surfaceCurrent(params, results, "y0", t * params.a, z),
        });
        samples.push({
          position: toScene(t * params.a, params.b, z),
          vector: surfaceCurrent(params, results, "yb", t * params.a, z),
        });
      }
    }
    return samples;
  }, [params, results]);
  const jsMax = Math.max(
    ...surfaceSamples.map((sample) => magnitude(sample.vector)),
    1e-30,
  );

  const box = useMemo(
    () => new THREE.BoxGeometry(sx, sy, sz),
    [sx, sy, sz],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box]);

  return (
    <>
      <color attach="background" args={["#0d1624"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 5, 3]} intensity={1.5} />
      <mesh geometry={box}>
        <meshPhysicalMaterial
          color="#21415f"
          transparent
          opacity={0.075}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#8aa2ba" transparent opacity={0.75} />
      </lineSegments>

      {results.valid &&
        volumeSamples.map((sample, index) =>
          (["E", "H", "Jd", "Jsigma", "S"] as const).map((key) => {
            const enabled =
              layers[key] && !(key === "Jsigma" && params.sigma === 0);
            if (!enabled) return null;
            return (
              <Arrow
                key={`${key}-${index}`}
                position={sample.position}
                vector={sample.fields[key]}
                color={COLORS[key]}
                scale={0.28 / maxima[key]}
              />
            );
          }),
        )}

      {results.valid &&
        layers.Js &&
        surfaceSamples.map((sample, index) => (
          <Arrow
            key={`js-${index}`}
            position={sample.position}
            vector={sample.vector}
            color={COLORS.Js}
            scale={0.25 / jsMax}
          />
        ))}

      <Line points={[[-1.2, -sy / 2 - 0.22, -2], [1.2, -sy / 2 - 0.22, -2]]} color="#91a0b5" />
      <Text position={[0, -sy / 2 - 0.35, -2]} fontSize={0.12} color="#cbd5e1">
        x
      </Text>
      <Text position={[-1.18, 0, -2]} fontSize={0.12} color="#cbd5e1">
        y
      </Text>
      <Text position={[1.15, -sy / 2 - 0.22, 0]} fontSize={0.12} color="#cbd5e1">
        z →
      </Text>
      <OrbitControls makeDefault minDistance={4} maxDistance={10} />
    </>
  );
}

export function Waveguide3D(props: {
  params: WaveguideParams;
  results: WaveguideResults;
  layers: LayerVisibility;
}) {
  return (
    <div className="three-card">
      <div className="view-title">
        <strong>Widok 3D</strong>
        <span>obrót: LPM · zoom: rolka</span>
      </div>
      <Canvas camera={{ position: [4.6, 3.3, 5.6], fov: 42 }}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
