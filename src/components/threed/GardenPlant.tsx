// src/components/threed/GardenPlant.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlantModel } from './PlantModels';

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
  modelType: string | null;
  modelPath: string | null;
  modelMetadata?: {
    scale?: number;
    rotationY?: number;
    offsets?: { x: number; y: number; z: number };
    animations?: string[];
    defaultAnimation?: string;
  };
}

interface GardenPlantProps {
  planting: FlattenedPlanting;
  onClick?: () => void;
}

// Model cache for better performance
const modelCache = new Map<string, THREE.Group>();

// Custom Model Loader Component
function CustomModel({ 
  modelPath, 
  modelType, 
  position, 
  scale = 1, 
  rotationY = 0,
  offsetY = 0,
  growthStage = 'vegetative',
  plantName,
  onClick 
}: { 
  modelPath: string; 
  modelType: string;
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  offsetY?: number;
  growthStage?: string;
  plantName?: string;
  onClick?: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isLoadingRef = useRef(false);
  
  const growthScales: Record<string, number> = {
    'seed': 0.1,
    'seedling': 0.3,
    'vegetative': 0.6,
    'flowering': 0.8,
    'fruiting': 1.0,
    'mature': 1.2
  };
  const growthScale = growthScales[growthStage] || 0.6;
  
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    const loadModel = async () => {
      isLoadingRef.current = true;
      
      try {
        const cacheKey = `${modelPath}-${modelType}`;
        let loadedModel: THREE.Group;
        
        if (modelCache.has(cacheKey)) {
          loadedModel = modelCache.get(cacheKey)!.clone();
        } else {
          if (modelType.toLowerCase() === 'fbx') {
            const loader = new FBXLoader();
            loadedModel = await loader.loadAsync(modelPath);
          } else {
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(modelPath);
            loadedModel = gltf.scene;
          }
          modelCache.set(cacheKey, loadedModel.clone());
        }
        
        // Apply transforms
        loadedModel.scale.setScalar(scale * growthScale);
        loadedModel.rotation.y = (rotationY * Math.PI) / 180;
        loadedModel.position.y = offsetY;
        
        // Enable shadows
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        setModel(loadedModel);
      } catch (err) {
        console.error(`Error loading model:`, err);
        setError(err.message);
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    if (modelPath) {
      loadModel();
    }
  }, [modelPath, modelType, scale, growthScale, rotationY, offsetY]);
  
  useFrame(({ clock }) => {
    if (groupRef.current && (growthStage === 'fruiting' || growthStage === 'mature')) {
      const sway = Math.sin(clock.getElapsedTime() * 0.8) * 0.02;
      groupRef.current.rotation.z = sway;
    }
  });
  
  if (error || !model) {
    // Fallback to simple cube
    return (
      <group position={position}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#888888" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }
  
  return (
    <group 
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={model} />
      {hovered && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap shadow-lg z-50">
            🌱 {plantName || 'Plant'} - {growthStage}
          </div>
        </Html>
      )}
    </group>
  );
}

// Main GardenPlant Component
export function GardenPlant({ planting, onClick }: GardenPlantProps) {
  const posX = planting.positionX ?? 0;
  const posY = planting.positionY ?? 0;
  const posZ = planting.positionZ ?? 0;
  
  const spacing = 1.2;
  const offset = (planting.quantity - 1) * spacing / 2;
  
  const hasCustomModel = planting.modelType && 
    ['gltf', 'glb', 'fbx'].includes(planting.modelType.toLowerCase()) && 
    planting.modelPath;
  
  const modelScale = planting.modelMetadata?.scale || 1;
  const modelRotation = planting.modelMetadata?.rotationY || 0;
  const modelOffsetY = planting.modelMetadata?.offsets?.y || 0;
  
  if (hasCustomModel && planting.modelPath) {
    if (planting.quantity > 1) {
      return (
        <group position={[posX, posY, posZ]}>
          {Array.from({ length: planting.quantity }).map((_, i) => {
            const xOffset = (i * spacing) - offset;
            return (
              <CustomModel
                key={`${planting.id}-${planting.plantId}-${i}`}
                modelPath={planting.modelPath!}
                modelType={planting.modelType!.toLowerCase()}
                position={[xOffset, modelOffsetY, 0]}
                scale={modelScale}
                rotationY={modelRotation}
                growthStage={planting.growthStage}
                plantName={planting.plantName}
                onClick={onClick}
              />
            );
          })}
        </group>
      );
    }
    
    return (
      <CustomModel
        key={`${planting.id}-${planting.plantId}`}
        modelPath={planting.modelPath}
        modelType={planting.modelType!.toLowerCase()}
        position={[posX, posY + modelOffsetY, posZ]}
        scale={modelScale}
        rotationY={modelRotation}
        growthStage={planting.growthStage}
        plantName={planting.plantName}
        onClick={onClick}
      />
    );
  }
  
  // Fallback to procedural plant models
  if (planting.quantity > 1) {
    return (
      <group position={[posX, posY, posZ]}>
        {Array.from({ length: planting.quantity }).map((_, i) => {
          const xOffset = (i * spacing) - offset;
          return (
            <group key={`${planting.id}-${i}`} position={[xOffset, 0, 0]}>
              <PlantModel
                plantName={planting.plantName}
                growthStage={planting.growthStage}
                onClick={onClick}
              />
            </group>
          );
        })}
      </group>
    );
  }
  
  return (
    <group position={[posX, posY, posZ]}>
      <PlantModel
        plantName={planting.plantName}
        growthStage={planting.growthStage}
        onClick={onClick}
      />
    </group>
  );
}