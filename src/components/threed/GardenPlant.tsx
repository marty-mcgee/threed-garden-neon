// src/components/threed/GardenPlant.tsx
'use client';

import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PlantModel } from './PlantModels';
import { useEffect, useState } from 'react';
import { Group } from 'three';

interface GardenPlantProps {
  planting: {
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
    modelType?: string;      // Optional: override default 3D model (procedural, gltf, glb, fbx)
    modelPath?: string;       // Optional: path to custom model file
    customColor?: string;    // Optional: override foliage color
    fruitColor?: string;     // Optional: override fruit color
    modelMetadata?: {
      scale?: number;
      rotationY?: number;
      offsets?: { x: number; y: number; z: number };
      animations?: string[];
      defaultAnimation?: string;
    };
  };
  onClick?: () => void;
}

// Component for rendering custom 3D models (GLTF/GLB/FBX)
function CustomModel({ 
  modelPath, 
  modelType, 
  scale = 1, 
  rotationY = 0,
  offsetY = 0,
  onClick 
}: { 
  modelPath: string; 
  modelType: string;
  scale?: number;
  rotationY?: number;
  offsetY?: number;
  onClick?: () => void;
}) {
  const [model, setModel] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadModel = async () => {
      try {
        if (modelType === 'fbx') {
          // Load FBX model
          const loader = new FBXLoader();
          const fbxModel = await loader.loadAsync(modelPath);
          setModel(fbxModel);
        } else {
          // Load GLTF/GLB model
          const loader = new GLTFLoader();
          const gltfModel = await loader.loadAsync(modelPath);
          setModel(gltfModel.scene);
        }
      } catch (err) {
        console.error(`Error loading ${modelType} model:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadModel();
  }, [modelPath, modelType]);
  
  if (loading) {
    return null; // Or return a simple placeholder if desired
  }
  
  if (error || !model) {
    console.warn(`Failed to load custom model: ${modelPath}`);
    return null;
  }
  
  // Clone the model to avoid mutations
  const clonedModel = model.clone();
  
  // Apply transforms
  clonedModel.scale.setScalar(scale);
  clonedModel.rotation.y = (rotationY * Math.PI) / 180;
  clonedModel.position.y = offsetY;
  
  return <primitive object={clonedModel} onClick={onClick} />;
}

export function GardenPlant({ planting, onClick }: GardenPlantProps) {
  // Debug logging
  console.log(`🌱 Rendering GardenPlant:`, {
    id: planting.id,
    name: planting.plantName,
    quantity: planting.quantity,
    position: { x: planting.positionX, y: planting.positionY, z: planting.positionZ },
    bedId: planting.bedId,
    growthStage: planting.growthStage,
    modelType: planting.modelType,
    modelPath: planting.modelPath,
    customColor: planting.customColor
  });
  
  // If no position is set, default to (0,0,0) which is the center of the bed
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
  
  // Get model metadata
  const modelScale = planting.modelMetadata?.scale || 1;
  const modelRotation = planting.modelMetadata?.rotationY || 0;
  const modelOffsetY = planting.modelMetadata?.offsets?.y || 0;
  
  return (
    <group position={[posX, posY, posZ]}>
      {Array.from({ length: planting.quantity }).map((_, i) => {
        const xOffset = (i * spacing) - offset;
        
        // If using custom model and it's a single plant, render the custom model
        if (hasCustomModel && planting.quantity === 1) {
          return (
            <CustomModel
              key={`${planting.id}-${i}`}
              modelPath={planting.modelPath!}
              modelType={planting.modelType!.toLowerCase()}
              scale={modelScale}
              rotationY={modelRotation}
              offsetY={modelOffsetY}
              onClick={onClick}
            />
          );
        }
        
        // For multiple plants or fallback, use the procedural PlantModel
        // This ensures consistent rendering when quantity > 1
        return (
          <group 
            key={`${planting.id}-${i}`}
            position={[xOffset, 0, 0]}
          >
            <PlantModel
              plantName={planting.plantName}
              growthStage={planting.growthStage}
              customModelType={planting.modelType}
              customColor={planting.customColor}
              onClick={onClick}
            />
          </group>
        );
      })}
    </group>
  );
}

// Optional: Export a standalone FBX plant component for use elsewhere
export function FBXPlant({ 
  url, 
  position = [0, 0, 0], 
  scale = 1, 
  rotationY = 0,
  onClick 
}: { 
  url: string; 
  position?: [number, number, number]; 
  scale?: number; 
  rotationY?: number;
  onClick?: () => void;
}) {
  const [model, setModel] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loader = new FBXLoader();
    loader.load(
      url,
      (fbxModel) => {
        setModel(fbxModel);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading FBX:', error);
        setLoading(false);
      }
    );
  }, [url]);
  
  if (loading) return null;
  if (!model) return null;
  
  const clonedModel = model.clone();
  clonedModel.scale.setScalar(scale);
  clonedModel.rotation.y = (rotationY * Math.PI) / 180;
  
  return <primitive object={clonedModel} position={position} onClick={onClick} />;
}