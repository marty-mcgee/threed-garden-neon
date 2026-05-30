// src/components/threed/GardenPlant.tsx
'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Import your procedural plant models as fallback
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
  modelType?: string;
  modelPath?: string;
  modelMetadata?: {
    scale?: number;
    rotationY?: number;
    offsets?: { x: number; y: number; z: number };
  };
}

interface GardenPlantProps {
  planting: FlattenedPlanting;
  onClick?: () => void;
}

// Custom Model Loader Component with position support
function CustomModel({ 
  modelPath, 
  modelType, 
  position, 
  scale = 1, 
  rotationY = 0,
  offsetY = 0,
  growthStage = 'vegetative',
  onClick 
}: { 
  modelPath: string; 
  modelType: string;
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  offsetY?: number;
  growthStage?: string;
  onClick?: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Growth stage scale multiplier
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
    const loadModel = async () => {
      try {
        let loadedModel: THREE.Group;
        
        if (modelType.toLowerCase() === 'fbx') {
          const loader = new FBXLoader();
          loadedModel = await loader.loadAsync(modelPath);
        } else {
          const loader = new GLTFLoader();
          const gltf = await loader.loadAsync(modelPath);
          loadedModel = gltf.scene;
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
        console.error(`Error loading model from ${modelPath}:`, err);
        setError(err.message);
      }
    };
    
    if (modelPath) {
      loadModel();
    }
  }, [modelPath, modelType, scale, growthScale, rotationY, offsetY]);
  
  // Gentle sway animation for mature plants
  useFrame(({ clock }) => {
    if (groupRef.current && (growthStage === 'fruiting' || growthStage === 'mature')) {
      const sway = Math.sin(clock.getElapsedTime() * 1.5) * 0.03;
      groupRef.current.rotation.z = sway;
    }
  });
  
  if (error) {
    console.warn(`Failed to load custom model, using fallback: ${error}`);
    // Fallback to procedural model
    return (
      <group position={position}>
        <PlantModel
          plantName={planting.plantName}
          growthStage={growthStage}
          customColor={undefined}
          onClick={onClick}
        />
      </group>
    );
  }
  
  if (!model) {
    // Show loading placeholder
    return (
      <group position={position}>
        <mesh>
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
            🌱 {planting.plantName} - {growthStage}
            {modelType && <span className="ml-1 text-blue-300">({modelType.toUpperCase()})</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// Main GardenPlant Component
export function GardenPlant({ planting, onClick }: GardenPlantProps) {
  // Parse position - ensure we have numbers
  const posX = planting.positionX ?? 0;
  const posY = planting.positionY ?? 0;
  const posZ = planting.positionZ ?? 0;
  
  // Spacing between individual plants in the same planting
  const spacing = 1.2; // feet between plants
  const offset = (planting.quantity - 1) * spacing / 2;
  
  // Check if we should use a custom 3D model
  const hasCustomModel = planting.modelType && 
    ['gltf', 'glb', 'fbx'].includes(planting.modelType.toLowerCase()) && 
    planting.modelPath;
  
  // Get custom model properties
  const modelScale = planting.modelMetadata?.scale || 1;
  const modelRotation = planting.modelMetadata?.rotationY || 0;
  const modelOffsetY = planting.modelMetadata?.offsets?.y || 0;
  
  // Debug logging
  console.log(`🌱 Rendering plant: ${planting.plantName}`, {
    id: planting.id,
    position: { x: posX, y: posY, z: posZ },
    quantity: planting.quantity,
    growthStage: planting.growthStage,
    hasCustomModel,
    modelType: planting.modelType,
    modelPath: planting.modelPath
  });
  
  // If using custom model
  if (hasCustomModel) {
    // For multiple plants, we need to position them within the bed
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
                onClick={onClick}
              />
            );
          })}
        </group>
      );
    }
    
    // Single plant with custom model at exact bed position
    return (
      <CustomModel
        key={`${planting.id}-${planting.plantId}`}
        modelPath={planting.modelPath!}
        modelType={planting.modelType!.toLowerCase()}
        position={[posX, posY + modelOffsetY, posZ]}
        scale={modelScale}
        rotationY={modelRotation}
        growthStage={planting.growthStage}
        onClick={onClick}
      />
    );
  }
  
  // Fallback to procedural plant models
  // For multiple plants, distribute them within the bed
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
                customColor={undefined}
                onClick={onClick}
              />
            </group>
          );
        })}
      </group>
    );
  }
  
  // Single plant with procedural model
  return (
    <group position={[posX, posY, posZ]}>
      <PlantModel
        plantName={planting.plantName}
        growthStage={planting.growthStage}
        customColor={undefined}
        onClick={onClick}
      />
    </group>
  );
}