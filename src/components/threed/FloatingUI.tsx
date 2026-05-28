// src/components/threed/FloatingUI.tsx
'use client';

import { Html } from '@react-three/drei';

interface Bed {
  id: number;
  name: string;
  widthFeet: number;
  lengthFeet: number;
}

interface Planting {
  id: number;
  plantName: string;
  growthStage: string;
}

interface FloatingUIProps {
  beds: Bed[];
  plantings: Planting[];
}

export function FloatingUI({ beds, plantings }: FloatingUIProps) {
  // Calculate total stats
  const totalBeds = beds.length;
  const totalPlants = plantings.length;
  const growingPlants = plantings.filter(p => p.growthStage === 'vegetative' || p.growthStage === 'seedling').length;
  const maturePlants = plantings.filter(p => p.growthStage === 'fruiting' || p.growthStage === 'flowering').length;
  
  return (
    <Html position={[-12, 5, -12]} transform occlude>
      <div className="bg-black/70 backdrop-blur-sm text-white rounded-lg p-3 min-w-[160px] shadow-xl">
        <h4 className="text-sm font-semibold mb-2 border-b border-white/20 pb-1">Garden Stats</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>🌱 Beds:</span>
            <span className="font-medium">{totalBeds}</span>
          </div>
          <div className="flex justify-between">
            <span>🌿 Plants:</span>
            <span className="font-medium">{totalPlants}</span>
          </div>
          <div className="flex justify-between">
            <span>📈 Growing:</span>
            <span className="font-medium text-green-400">{growingPlants}</span>
          </div>
          <div className="flex justify-between">
            <span>🍎 Mature:</span>
            <span className="font-medium text-orange-400">{maturePlants}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-white/60">
          🖱️ Click objects for details
        </div>
      </div>
    </Html>
  );
}