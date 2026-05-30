// src/components/threed/PlantModels.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Group, MeshStandardMaterial, Color } from 'three';

// Plant model configuration for each plant type
export const plantModels: Record<string, {
  type: string;
  colors: {
    foliage: string;
    fruit?: string;
    flower?: string;
  };
  growthStages: {
    seed: { height: number; radius: number; color?: string };
    seedling: { height: number; radius: number; color?: string };
    vegetative: { height: number; radius: number; color?: string };
    flowering: { height: number; radius: number; color?: string };
    fruiting: { height: number; radius: number; color?: string };
    mature: { height: number; radius: number; color?: string };
  };
}> = {
  'tomato': {
    type: 'Vegetable',
    colors: { foliage: '#4CAF50', fruit: '#FF5722' },
    growthStages: {
      seed: { height: 0.1, radius: 0.1, color: '#8B4513' },
      seedling: { height: 0.3, radius: 0.15, color: '#6B8E23' },
      vegetative: { height: 0.8, radius: 0.4, color: '#4CAF50' },
      flowering: { height: 1.0, radius: 0.5, color: '#66BB6A' },
      fruiting: { height: 1.2, radius: 0.6, color: '#4CAF50' },
      mature: { height: 1.5, radius: 0.7, color: '#388E3C' }
    }
  },
  'basil': {
    type: 'Herb',
    colors: { foliage: '#6B8E23' },
    growthStages: {
      seed: { height: 0.05, radius: 0.08 },
      seedling: { height: 0.15, radius: 0.12 },
      vegetative: { height: 0.4, radius: 0.25 },
      flowering: { height: 0.6, radius: 0.35 },
      fruiting: { height: 0.7, radius: 0.4 },
      mature: { height: 0.8, radius: 0.45 }
    }
  },
  'lettuce': {
    type: 'Vegetable',
    colors: { foliage: '#7CB342' },
    growthStages: {
      seed: { height: 0.05, radius: 0.08 },
      seedling: { height: 0.1, radius: 0.15 },
      vegetative: { height: 0.25, radius: 0.35 },
      flowering: { height: 0.4, radius: 0.45 },
      fruiting: { height: 0.45, radius: 0.5 },
      mature: { height: 0.5, radius: 0.55 }
    }
  },
  'pepper': {
    type: 'Vegetable',
    colors: { foliage: '#4CAF50', fruit: '#FF0000' },
    growthStages: {
      seed: { height: 0.1, radius: 0.1 },
      seedling: { height: 0.25, radius: 0.2 },
      vegetative: { height: 0.6, radius: 0.45 },
      flowering: { height: 0.8, radius: 0.55 },
      fruiting: { height: 1.0, radius: 0.65 },
      mature: { height: 1.2, radius: 0.7 }
    }
  },
  'strawberry': {
    type: 'Fruit',
    colors: { foliage: '#4CAF50', fruit: '#E53935' },
    growthStages: {
      seed: { height: 0.05, radius: 0.08 },
      seedling: { height: 0.1, radius: 0.15 },
      vegetative: { height: 0.2, radius: 0.35 },
      flowering: { height: 0.25, radius: 0.45 },
      fruiting: { height: 0.3, radius: 0.55 },
      mature: { height: 0.35, radius: 0.6 }
    }
  },
  'corn': {
    type: 'Vegetable',
    colors: { foliage: '#8BC34A', fruit: '#FFC107' },
    growthStages: {
      seed: { height: 0.1, radius: 0.08 },
      seedling: { height: 0.3, radius: 0.15 },
      vegetative: { height: 1.0, radius: 0.35 },
      flowering: { height: 1.5, radius: 0.4 },
      fruiting: { height: 2.0, radius: 0.45 },
      mature: { height: 2.5, radius: 0.5 }
    }
  },
  'sunflower': {
    type: 'Flower',
    colors: { foliage: '#4CAF50', flower: '#FFD700' },
    growthStages: {
      seed: { height: 0.1, radius: 0.08 },
      seedling: { height: 0.3, radius: 0.2 },
      vegetative: { height: 0.8, radius: 0.4 },
      flowering: { height: 1.2, radius: 0.5 },
      fruiting: { height: 1.5, radius: 0.55 },
      mature: { height: 1.8, radius: 0.6 }
    }
  },
  'rose': {
    type: 'Flower',
    colors: { foliage: '#2E7D32', flower: '#E91E63' },
    growthStages: {
      seed: { height: 0.05, radius: 0.08 },
      seedling: { height: 0.15, radius: 0.15 },
      vegetative: { height: 0.4, radius: 0.35 },
      flowering: { height: 0.6, radius: 0.45 },
      fruiting: { height: 0.7, radius: 0.5 },
      mature: { height: 0.8, radius: 0.55 }
    }
  }
};

// Helper function to get model key from plant name
function getModelKeyFromName(plantName: string): string {
  const lowerName = plantName.toLowerCase();
  if (lowerName.includes('tomato')) return 'tomato';
  if (lowerName.includes('basil')) return 'basil';
  if (lowerName.includes('lettuce')) return 'lettuce';
  if (lowerName.includes('pepper')) return 'pepper';
  if (lowerName.includes('strawberry')) return 'strawberry';
  if (lowerName.includes('corn')) return 'corn';
  if (lowerName.includes('sunflower')) return 'sunflower';
  if (lowerName.includes('rose')) return 'rose';
  return 'tomato'; // Default fallback
}

// Helper function to get growth stage scale factor
export function getGrowthStageScale(growthStage: string): number {
  const scales: Record<string, number> = {
    'seed': 0.1,
    'seedling': 0.3,
    'vegetative': 0.6,
    'flowering': 0.8,
    'fruiting': 1.0,
    'mature': 1.2
  };
  return scales[growthStage] || 1.0;
}

// Helper function to get growth stage color
export function getGrowthStageColor(growthStage: string, baseColor: string): string {
  const colorMix: Record<string, number> = {
    'seed': 0.3,
    'seedling': 0.5,
    'vegetative': 0.7,
    'flowering': 0.85,
    'fruiting': 1.0,
    'mature': 1.0
  };
  
  const factor = colorMix[growthStage] || 1.0;
  // Simple color lightening/darkening based on stage
  return baseColor; // For now, return base color (can be enhanced)
}

// Simple procedural plant model
export function PlantModel({ 
  plantName, 
  growthStage, 
  customModelType,
  customColor,
  onClick 
}: { 
  plantName: string; 
  growthStage: string; 
  customModelType?: string;
  customColor?: string;
  onClick?: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Get plant configuration
  const modelKey = customModelType || getModelKeyFromName(plantName);
  const config = plantModels[modelKey] || plantModels['tomato'];
  const stageConfig = config.growthStages[growthStage as keyof typeof config.growthStages] || config.growthStages.vegetative;
  
  // Colors
  const foliageColor = customColor || config.colors.foliage;
  const fruitColor = config.colors.fruit || '#FF5722';
  const flowerColor = config.colors.flower || '#FFC107';
  
  // Scale factor based on growth stage
  const scale = getGrowthStageScale(growthStage);
  
  // Gentle sway animation for mature plants
  useFrame(({ clock }) => {
    if (groupRef.current && (growthStage === 'fruiting' || growthStage === 'mature')) {
      const sway = Math.sin(clock.getElapsedTime() * 1.5) * 0.02;
      groupRef.current.rotation.z = sway;
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, stageConfig.height / 2, 0]}
      scale={[scale, scale, scale]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Stem */}
      <mesh position={[0, -stageConfig.height / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.08, stageConfig.height, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      
      {/* Foliage (main plant body) */}
      <mesh position={[0, stageConfig.height * 0.3, 0]}>
        <sphereGeometry args={[stageConfig.radius * 0.8, 16, 16]} />
        <meshStandardMaterial 
          color={foliageColor} 
          roughness={0.4} 
          emissive={hovered ? '#333333' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* Leaves */}
      {['left', 'right', 'front', 'back'].map((side, index) => {
        const xOffset = side === 'left' ? -0.3 : side === 'right' ? 0.3 : side === 'front' ? 0 : 0;
        const zOffset = side === 'front' ? 0.3 : side === 'back' ? -0.3 : 0;
        const yPos = stageConfig.height * 0.5;
        
        return (
          <mesh key={index} position={[xOffset, yPos, zOffset]} rotation={[0.5, index * Math.PI / 2, 0.3]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial color={foliageColor} roughness={0.5} />
          </mesh>
        );
      })}
      
      {/* Fruits (if in fruiting stage) */}
      {growthStage === 'fruiting' && (
        <>
          {[1, 2, 3].map((i) => (
            <mesh key={i} position={[0.2 * i, stageConfig.height * 0.2, 0.2 * i]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={fruitColor} roughness={0.3} emissive="#FF0000" emissiveIntensity={0.2} />
            </mesh>
          ))}
          {[1, 2].map((i) => (
            <mesh key={`fruit-${i + 3}`} position={[-0.2 * i, stageConfig.height * 0.15, -0.15 * i]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color={fruitColor} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}
      
      {/* Flowers (if in flowering stage) */}
      {growthStage === 'flowering' && (
        <>
          {[1, 2, 3, 4].map((i) => (
            <mesh key={`flower-${i}`} position={[Math.sin(i) * 0.25, stageConfig.height * 0.6, Math.cos(i) * 0.25]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color={flowerColor} roughness={0.2} emissive="#FFD700" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </>
      )}
      
      {/* Hover tooltip */}
      {hovered && (
        <Html position={[0, stageConfig.height + 0.3, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none z-50">
            {plantName} - {growthStage}
          </div>
        </Html>
      )}
    </group>
  );
}

// Export a simple fruit/berry model for strawberries, etc.
export function BerryBush({ 
  color = '#E53935', 
  size = 0.15, 
  position = [0, 0, 0] 
}: { 
  color?: string; 
  size?: number; 
  position?: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  );
}

// Export a utility to get all available plant models
export function getAvailablePlantModels() {
  return Object.keys(plantModels).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    type: plantModels[key].type,
    colors: plantModels[key].colors
  }));
}

// Export the plant models configuration for use elsewhere
export { getModelKeyFromName };