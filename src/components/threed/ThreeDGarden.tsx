// src/components/threed/ThreeDGarden.tsx (Enhanced)
'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Html,
  Loader,
  Stats as R3FStats,
  Grid,
  Plane,
  Box as DreiBox,
  Circle,
  Sparkles,
  Clouds,
  Cloud,
  Cylinder,
  Cone,
  Sphere,
  Sky,
  Stars,
  useTexture
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Import your custom components
import { GardenBed } from './GardenBed';
import { GardenPlant } from './GardenPlant';
import { WeatherEffects } from './WeatherEffects';
import { FloatingUI } from './FloatingUI';

interface Bed {
  id: number;
  name: string;
  shape: string;
  widthFeet: number;
  lengthFeet: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  color: string;
}

interface RawPlantingData {
  planting: {
    id: number;
    plantingId: string;
    plantId: number;
    bedId: number;
    quantity: number;
    spacingInches: string;
    positionX: string;
    positionY: string;
    positionZ: string;
    plantedDate: string;
    status: string;
    growthStage: string;
    health: string;
    notes: string;
  };
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    type: string;
    daysToMaturity: number;
  };
  bed: {
    id: number;
    name: string;
    shape: string;
    widthFeet: string;
    lengthFeet: string;
    positionX: string;
    positionY: string;
    positionZ: string;
    color: string;
  };
}

interface FlattenedPlanting {
  id: number;
  plantId: number;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  growthStage: string;
  daysToMaturity: number;
  bedId: number;
  // Standardized model fields only
  modelType: string | null;
  modelPath: string | null;
  modelMetadata: {
    scale?: number;
    rotationY?: number;
    offsets?: { x: number; y: number; z: number };
    animations?: string[];
    defaultAnimation?: string;
  } | null;
}

interface ThreeDGardenProps {
  beds: Bed[];
  plantings: RawPlantingData[];
  weather?: {
    temperature: number;
    condition: string;
    rainfall: number;
  };
  onBedSelect?: (bed: Bed) => void;
  onPlantSelect?: (planting: FlattenedPlanting) => void;
}

// Helper function to flatten planting data
// Update the flattenPlanting function to properly extract model data
function flattenPlanting(rawPlanting: RawPlantingData): FlattenedPlanting {
  // Debug logging to see what data we have
  console.log('📦 Raw planting data:', {
    plantingId: rawPlanting.planting.id,
    plantId: rawPlanting.plant?.id,
    plantName: rawPlanting.plant?.commonName,
    rawPlant: rawPlanting.plant,
    modelType: rawPlanting.plant?.modelType,
    modelPath: rawPlanting.plant?.modelPath,
    modelMetadata: rawPlanting.plant?.modelMetadata
  });
  
  return {
    id: rawPlanting.planting.id,
    plantId: rawPlanting.planting.plantId,
    plantName: rawPlanting.plant?.commonName || 'Unknown Plant',
    plantType: rawPlanting.plant?.type || 'Vegetable',
    quantity: rawPlanting.planting.quantity || 1,
    positionX: parseFloat(rawPlanting.planting.positionX || '0'),
    positionY: parseFloat(rawPlanting.planting.positionY || '0'),
    positionZ: parseFloat(rawPlanting.planting.positionZ || '0'),
    growthStage: rawPlanting.planting.growthStage || 'vegetative',
    daysToMaturity: rawPlanting.plant?.daysToMaturity || 60,
    bedId: rawPlanting.planting.bedId,
    // Standardized model fields only
    modelType: rawPlanting.plant?.modelType || 'procedural',
    modelPath: rawPlanting.plant?.modelPath || null,
    modelMetadata: rawPlanting.plant?.modelMetadata || {
      scale: 1,
      rotationY: 0,
      offsets: { x: 0, y: 0, z: 0 }
    }
  };
}

// Enhanced Tree Component with better shading
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle sway
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]} scale={[scale, scale, scale]}>
      {/* Shadow catcher */}
      <Circle args={[0.8, 8]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </Circle>
      {/* Trunk */}
      <Cylinder args={[0.35, 0.45, 1.3]} position={[0, 0.65, 0]}>
        <meshStandardMaterial color="#6B4226" roughness={0.7} metalness={0.1} />
      </Cylinder>
      {/* Foliage layers with better colors */}
      <Cone args={[0.9, 1.1, 8]} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#2E7D32" roughness={0.3} metalness={0.1} />
      </Cone>
      <Cone args={[0.7, 0.9, 8]} position={[0, 2.0, 0]}>
        <meshStandardMaterial color="#388E3C" roughness={0.3} metalness={0.1} />
      </Cone>
      <Cone args={[0.5, 0.7, 8]} position={[0, 2.6, 0]}>
        <meshStandardMaterial color="#43A047" roughness={0.3} metalness={0.1} />
      </Cone>
    </group>
  );
}

// Enhanced Water Feature with reflections
function WaterFeature({ x, z, radius = 1.5 }: { x: number; z: number; radius?: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  
  useFrame((state) => {
    if (waterRef.current) {
      timeRef.current += 0.02;
      // Gentle water ripple effect
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      // Slight scale pulse
      const scale = 1 + Math.sin(timeRef.current) * 0.02;
      waterRef.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <group position={[x, -0.08, z]}>
      {/* Outer ring */}
      <Circle args={[radius + 0.1, 32]}>
        <meshStandardMaterial color="#1E88E5" transparent opacity={0.3} roughness={0.4} />
      </Circle>
      {/* Water surface */}
      <Circle args={[radius, 32]}>
        <meshStandardMaterial 
          color="#4FC3F7" 
          transparent 
          opacity={0.8} 
          roughness={0.2} 
          metalness={0.9}
          emissive="#29B6F6"
          emissiveIntensity={0.1}
        />
      </Circle>
      {/* Inner highlight */}
      <Circle args={[radius * 0.5, 32]} position={[0, 0.02, 0]}>
        <meshStandardMaterial 
          color="#B3E5FC" 
          transparent 
          opacity={0.6} 
          roughness={0.1} 
          metalness={0.95}
        />
      </Circle>
    </group>
  );
}

// Enhanced Decorative Flower Component
function Flower({ x, z, color = "#FF69B4", delay = 0 }: { x: number; z: number; color?: string; delay?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle bobbing
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.03;
    }
  });
  
  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <Cylinder args={[0.04, 0.06, 0.35]} position={[0, 0.175, 0]}>
        <meshStandardMaterial color="#2E7D32" roughness={0.6} />
      </Cylinder>
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const rad = 0.18;
        return (
          <Sphere 
            key={i} 
            args={[0.09, 16, 16]} 
            position={[Math.cos(angle) * rad, 0.38, Math.sin(angle) * rad]}
          >
            <meshStandardMaterial color={color} roughness={0.2} emissive={color} emissiveIntensity={0.1} />
          </Sphere>
        );
      })}
      <Sphere args={[0.12, 16, 16]} position={[0, 0.38, 0]}>
        <meshStandardMaterial color="#FFC107" emissive="#FF9800" emissiveIntensity={0.2} />
      </Sphere>
    </group>
  );
}

// Enhanced Garden Ground Component
function GardenGround() {
  // Use texture for ground variation
  const groundColor = "#4A7A3A";
  
  return (
    <>
      {/* Main ground plane */}
      <Plane 
        args={[50, 50]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.15, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={groundColor} 
          roughness={0.9} 
          metalness={0.05}
        />
      </Plane>
      
      {/* Enhanced Grid helper */}
      <Grid 
        args={[50, 50]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#6B8E23"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#556B2F"
        position={[0, -0.08, 0]}
      />
      
      {/* Grass patches */}
      <Sparkles 
        count={800}
        scale={[50, 2, 50]}
        size={0.08}
        color="#4CAF50"
        opacity={0.5}
      />
      
      {/* Ambient light particles (fireflies/dust) */}
      <Sparkles 
        count={300}
        scale={[40, 8, 40]}
        size={0.05}
        color="#FFD700"
        opacity={0.3}
        speed={0.5}
      />
    </>
  );
}

// Animated Butterfly Component
function Butterfly({ startPos, delay = 0 }: { startPos: [number, number, number]; delay?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const progress = useRef(delay);
  const speed = 0.3;
  
  useFrame((state) => {
    if (groupRef.current) {
      progress.current += 0.01;
      // Figure-8 flight pattern
      const x = Math.sin(progress.current * speed) * 3;
      const z = Math.cos(progress.current * speed * 0.8) * 2;
      const y = 1.5 + Math.sin(progress.current * speed * 2) * 0.5;
      
      groupRef.current.position.set(startPos[0] + x, startPos[1] + y, startPos[2] + z);
      groupRef.current.rotation.y = Math.atan2(x, z);
      
      // Wing flap
      const flap = Math.sin(state.clock.elapsedTime * 15) * 0.8;
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh && child.position.x !== 0) {
          child.rotation.z = flap * (i === 0 ? 1 : -1);
        }
      });
    }
  });
  
  return (
    <group ref={groupRef} position={startPos}>
      {/* Left wing */}
      <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.18, 0.28, 8]} />
        <meshStandardMaterial color="#FF69B4" emissive="#FF1493" emissiveIntensity={0.2} />
      </mesh>
      {/* Right wing */}
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.18, 0.28, 8]} />
        <meshStandardMaterial color="#FF69B4" emissive="#FF1493" emissiveIntensity={0.2} />
      </mesh>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

// Garden Scene Component (Enhanced)
function GardenScene({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const [timeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [sunPosition, setSunPosition] = useState<[number, number, number]>([10, 20, 5]);
  
  // Flatten all plantings with useMemo for performance
  const flattenedPlantings = useMemo(() => plantings.map(flattenPlanting), [plantings]);

  // In GardenScene, before rendering plants
  console.log('🌱 Plantings data:', flattenedPlantings.map(p => ({
    id: p.id,
    name: p.plantName,
    modelType: p.modelType,
    modelPath: p.modelPath,
    position: [p.positionX, p.positionY, p.positionZ]
  })));
  
  // Update lighting based on time
  useEffect(() => {
    switch (timeOfDay) {
      case 'dawn':
        setAmbientIntensity(0.3);
        setSunPosition([5, 8, 10]);
        break;
      case 'day':
        setAmbientIntensity(0.55);
        setSunPosition([12, 22, 5]);
        break;
      case 'dusk':
        setAmbientIntensity(0.3);
        setSunPosition([-5, 8, 10]);
        break;
      case 'night':
        setAmbientIntensity(0.15);
        setSunPosition([0, -10, 0]);
        break;
    }
  }, [timeOfDay]);
  
  return (
    <>
      {/* Enhanced Fog */}
      <fog attach="fog" args={['#87CEEB', 25, 60]} />
      
      {/* Sky with sun position */}
      <Sky 
        distance={450} 
        sunPosition={sunPosition}
        inclination={timeOfDay === 'day' ? 0.6 : 0.2}
        azimuth={0.2}
        rayleigh={0.5}
        mieCoefficient={0.005}
      />
      
      {/* Stars at night */}
      {timeOfDay === 'night' && <Stars radius={100} depth={50} count={2000} factor={4} fade />}
      
      {/* Lighting System */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Main directional light (sun) */}
      <directionalLight
        position={sunPosition}
        intensity={timeOfDay === 'day' ? 1.3 : 0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0001}
      />
      
      {/* Fill lights */}
      <pointLight 
        position={[0, 8, 0]} 
        intensity={timeOfDay === 'night' ? 0.6 : 0.15} 
        color={timeOfDay === 'night' ? '#FFA500' : '#ffffff'}
      />
      <pointLight position={[-5, 5, -8]} intensity={0.25} color="#FFD700" />
      <pointLight position={[8, 4, 6]} intensity={0.2} color="#FFA500" />
      
      {/* Hemisphere light for natural bounce */}
      <hemisphereLight 
        intensity={0.45} 
        color="#87CEEB" 
        groundColor="#4A7A3A" 
      />
      
      {/* Decorative Clouds */}
      <Clouds material={THREE.MeshBasicMaterial} position={[0, 18, -12]} limit={8}>
        <Cloud segments={40} bounds={[12, 2, 12]} volume={10} color="#ffffff" opacity={0.7} />
      </Clouds>
      
      {/* Garden Ground */}
      <GardenGround />
      
      {/* Decorative Elements - Trees */}
      <Tree x={-13} z={-11} scale={1.3} />
      <Tree x={13} z={-11} scale={1.3} />
      <Tree x={-11} z={13} scale={1.1} />
      <Tree x={11} z={13} scale={1.1} />
      <Tree x={-15} z={9} scale={1.0} />
      <Tree x={15} z={9} scale={1.0} />
      <Tree x={-2} z={-15} scale={1.2} />
      <Tree x={2} z={-15} scale={1.2} />
      <Tree x={0} z={15} scale={1.2} />
      <Tree x={-8} z={-14} scale={0.9} />
      <Tree x={8} z={-14} scale={0.9} />
      
      {/* Water Features */}
      <WaterFeature x={-9} z={-9} radius={2.2} />
      <WaterFeature x={9} z={-9} radius={1.8} />
      <WaterFeature x={0} z={-12} radius={1.5} />
      
      {/* Decorative Flowers - More variety */}
      <Flower x={-7} z={-7} color="#FF69B4" delay={0} />
      <Flower x={-6} z={-8} color="#FFD700" delay={0.5} />
      <Flower x={-8} z={-6} color="#FF6347" delay={1} />
      <Flower x={7} z={-7} color="#DA70D6" delay={0.3} />
      <Flower x={6} z={-8} color="#FFD700" delay={0.8} />
      <Flower x={8} z={-6} color="#FF69B4" delay={1.2} />
      <Flower x={-7} z={7} color="#FF6347" delay={0.2} />
      <Flower x={7} z={7} color="#DA70D6" delay={0.7} />
      <Flower x={-9} z={5} color="#E1BEE7" delay={0.4} />
      <Flower x={9} z={5} color="#E1BEE7" delay={0.9} />
      
      {/* Butterflies for life */}
      <Butterfly startPos={[-5, 2, -3]} delay={0} />
      <Butterfly startPos={[4, 1.5, -4]} delay={2} />
      <Butterfly startPos={[2, 2, 5]} delay={4} />
      <Butterfly startPos={[-3, 1.8, 4]} delay={1} />
      
      {/* Garden Beds */}
      {beds.map((bed) => (
        <GardenBed 
          key={`bed-${bed.id}`} 
          bed={bed} 
          onClick={() => onBedSelect?.(bed)} 
        />
      ))}
      
      {/* Plants */}
      {flattenedPlantings.map((planting) => (
        <GardenPlant 
          key={`plant-${planting.id}`} 
          planting={planting} 
          onClick={() => onPlantSelect?.(planting)} 
        />
      ))}
      
      {/* Weather Effects */}
      {weather && weather.condition && (
        <WeatherEffects weather={weather} />
      )}
    </>
  );
}

// Main Component (Enhanced)
export default function ThreeDGarden({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  // Performance-based quality adjustment
  useEffect(() => {
    const totalObjects = beds.length + plantings.length;
    if (totalObjects > 150) setQuality('low');
    else if (totalObjects > 80) setQuality('medium');
    else setQuality('high');
  }, [beds.length, plantings.length]);
  
  // Calculate DPR based on quality
  const dpr = useMemo(() => {
    if (quality === 'low') return 1;
    if (quality === 'medium') return [1, 1.5];
    return [1, 2];
  }, [quality]);
  
  if (!beds.length && !plantings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[800px] bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border">
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-muted-foreground mb-2">No garden data available</p>
          <p className="text-sm text-muted-foreground">Add beds and plantings to see your 3D garden</p>
        </div>
      </div>
    );
  }
  
  // [MM]
  // You can add this to debug positions
  console.log('Plant positions:', plantings.map(p => ({
    name: p.plantName,
    position: [p.positionX, p.positionY, p.positionZ],
    modelPath: p.modelPath,
    id: p.planting.id,
    plantName: p.plant?.commonName,
    modelType: p.plant?.modelType,
    // modelPath: p.plant?.modelPath,
    hasModel: !!(p.plant?.modelType && p.plant?.modelPath)
  })));
  
  return (
    <div className="relative w-full h-[800px] rounded-xl overflow-hidden border bg-black/5 shadow-xl">
      <Canvas
        shadows={quality !== 'low'}
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false
        }}
        camera={{ position: [14, 12, 16], fov: 50, near: 0.1, far: 100 }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[14, 12, 16]} fov={50} />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.0}
            rotateSpeed={0.8}
            panSpeed={0.8}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={40}
            enableDamping={true}
            dampingFactor={0.05}
          />
          
          <Environment preset="forest" background={false} />
          
          <GardenScene 
            beds={beds} 
            plantings={plantings} 
            weather={weather}
            onBedSelect={onBedSelect}
            onPlantSelect={onPlantSelect}
          />
          
          {/* Post-processing effects - only on high quality */}
          {quality === 'high' && (
            <EffectComposer>
              <Bloom 
                intensity={0.3}        // Reduced from 0.4 to reduce flicker
                luminanceThreshold={0.3} // Increased from 0.2 to reduce bloom on dark areas
                luminanceSmoothing={0.8} // Reduced from 0.9 for tighter bloom
                kernelSize={3}          // Smaller kernel = faster, less flicker
                mipmapBlur={false}      // Disable mipmap blur - major cause of flicker
              />
              <Vignette 
                offset={0.5}           // Increased offset for softer vignette
                darkness={0.3}         // Reduced darkness
                eskil={false}          // Disable eskil tone mapping
                blendFunction={BlendFunction.NORMAL}
              />
            </EffectComposer>
          )}
          
          {showStats && <R3FStats />}
        </Suspense>
      </Canvas>
      
      {/* Enhanced Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 text-white text-xs rounded-lg backdrop-blur-sm transition-all shadow-lg ${
            autoRotate 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-black/50 hover:bg-black/70'
          }`}
        >
          {autoRotate ? '⏸️ Stop Rotate' : '▶️ Auto Rotate'}
        </button>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-all shadow-lg"
        >
          📊 {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-all shadow-lg"
        >
          {showControls ? '🔧 Hide Controls' : '🔧 Show Controls'}
        </button>
      </div>
      
      {/* Instruction Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-4 py-2 rounded-lg backdrop-blur-sm z-10 space-y-1 shadow-lg">
          <div className="flex gap-3">
            <span>🖱️ Drag to rotate</span>
            <span>🖱️ Right-click + drag to pan</span>
            <span>📜 Scroll to zoom</span>
          </div>
          <div className="flex gap-3">
            <span>🌿 Click plants or beds for details</span>
            <span>✨ Auto-rotate: {autoRotate ? 'ON' : 'OFF'}</span>
          </div>
          <div className="text-xs text-green-300">
            🌟 {beds.length} beds • {plantings.length} plantings
          </div>
        </div>
      )}
      
      <Loader />
    </div>
  );
}