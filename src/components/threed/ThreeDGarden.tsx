// src/components/threed/ThreeDGarden.tsx
'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Html,
  Loader,
  Stats as R3FStats
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Import our custom components
import { GardenBed } from '@/components/threed/GardenBed';
import { GardenPlant } from '@/components/threed/GardenPlant';
import { GardenGround } from '@/components/threed/GardenGround';
import { WeatherEffects } from '@/components/threed/WeatherEffects';
import { FloatingUI } from '@/components/threed/FloatingUI';

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

interface Planting {
  id: number;
  plantName: string;
  plantType: string;
  quantity: number;
  positionX: number;
  positionZ: number;
  growthStage: string;
  daysToMaturity: number;
}

interface ThreeDGardenProps {
  beds: Bed[];
  plantings: Planting[];
  weather?: {
    temperature: number;
    condition: string;
    rainfall: number;
  };
  onBedSelect?: (bed: Bed) => void;
  onPlantSelect?: (planting: Planting) => void;
}

// Main Garden Scene Component
function GardenScene({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const { camera, gl } = useThree();
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [sunPosition, setSunPosition] = useState([10, 20, 5]);
  
  // Simulate time of day based on weather or user preference
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setTimeOfDay('night');
    else if (hour < 8) setTimeOfDay('dawn');
    else if (hour < 18) setTimeOfDay('day');
    else if (hour < 20) setTimeOfDay('dusk');
    else setTimeOfDay('night');
    
    // Adjust lighting based on time
    switch (timeOfDay) {
      case 'dawn':
        setAmbientIntensity(0.3);
        setSunPosition([5, 5, 10]);
        break;
      case 'day':
        setAmbientIntensity(0.5);
        setSunPosition([10, 20, 5]);
        break;
      case 'dusk':
        setAmbientIntensity(0.3);
        setSunPosition([-5, 5, 10]);
        break;
      case 'night':
        setAmbientIntensity(0.1);
        setSunPosition([0, -10, 0]);
        break;
    }
  }, [timeOfDay]);
  
  return (
    <>
      {/* Lighting based on time of day */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={sunPosition as [number, number, number]}
        intensity={timeOfDay === 'day' ? 1.2 : 0.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight 
        position={[0, 5, 0]} 
        intensity={timeOfDay === 'night' ? 0.3 : 0.1} 
        color="#FFA500"
      />
      
      {/* Fill light for shadows */}
      <hemisphereLight 
        intensity={0.4} 
        color="#87CEEB" 
        groundColor="#4A7A3A" 
      />
      
      {/* Garden Ground */}
      <GardenGround />
      
      {/* Garden Beds */}
      {beds.map((bed) => (
        <GardenBed 
          key={bed.id} 
          bed={bed} 
          onClick={() => onBedSelect?.(bed)} 
        />
      ))}
      
      {/* Plants */}
      {plantings.map((planting) => (
        <GardenPlant 
          key={planting.id} 
          planting={planting} 
          onClick={() => onPlantSelect?.(planting)} 
        />
      ))}
      
      {/* Weather Effects */}
      {weather && <WeatherEffects weather={weather} />}
      
      {/* Floating UI Elements */}
      <FloatingUI beds={beds} plantings={plantings} />
    </>
  );
}

// Main Component
export default function ThreeDGarden({ beds, plantings, weather, onBedSelect, onPlantSelect }: ThreeDGardenProps) {
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  if (!beds.length && !plantings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-muted rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No garden data available</p>
          <p className="text-sm text-muted-foreground">Add beds and plantings to see your 3D garden</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[800px] rounded-xl overflow-hidden border bg-black/5">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={45} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={1.2}
            rotateSpeed={0.8}
            panSpeed={0.8}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={30}
          />
          <Environment preset="forest" />
          
          <GardenScene 
            beds={beds} 
            plantings={plantings} 
            weather={weather}
            onBedSelect={onBedSelect}
            onPlantSelect={onPlantSelect}
          />
          
          <EffectComposer>
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
          
          {showStats && <R3FStats />}
        </Suspense>
      </Canvas>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
        >
          {showControls ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>
      
      {/* Instruction Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
          🖱️ Drag to rotate | Right-click to pan | Scroll to zoom
        </div>
      )}
      
      <Loader />
    </div>
  );
}