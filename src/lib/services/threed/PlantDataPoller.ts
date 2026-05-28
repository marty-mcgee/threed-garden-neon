// src/lib/services/threed/PlantDataPoller.ts
import { db } from '@/lib/db/client';
import { plants } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// This poller can fetch from multiple sources:
// - OpenFarm API (openfarm.cc)
// - USDA Plants Database
// - Your own WordPress plant database
// - CSV/JSON import

interface PlantSource {
  id: string;
  name: string;
  scientificName: string;
  type: string;
  daysToMaturity: number;
  spacing: number;
  sunRequirements: string;
  waterNeeds: string;
  description: string;
}

export class PlantDataPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;

  /**
   * Fetch plants from OpenFarm API (free, open-source plant database)
   */
  private async fetchFromOpenFarm(query: string = ''): Promise<any[]> {
    const url = `https://openfarm.cc/api/v1/crops${query ? `?filter=${query}` : ''}`;
    
    try {
      console.log(`[${new Date().toISOString()}] Fetching plants from OpenFarm...`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ThreeD-Garden/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const crops = data.data || [];
      
      console.log(`  Fetched ${crops.length} plants from OpenFarm`);
      return crops;
      
    } catch (error) {
      console.error('OpenFarm API error:', error);
      return [];
    }
  }

  /**
   * Transform OpenFarm crop data to your schema
   */
  private transformOpenFarmCrop(crop: any): any {
    const attributes = crop.attributes || {};
    
    return {
      plantId: crop.id,
      commonName: attributes.name || 'Unknown',
      scientificName: attributes.binomial_name || '',
      type: this.mapPlantType(attributes),
      daysToMaturity: attributes.days_to_maturity || null,
      spacingInches: attributes.row_spacing ? Math.round(attributes.row_spacing / 25.4) : null, // mm to inches
      sunlight: attributes.sun_requirements || '',
      waterNeeds: attributes.water_needs || '',
      description: attributes.description || '',
      rawData: crop,
    };
  }

  /**
   * Map plant category to your type enum
   */
  private mapPlantType(attributes: any): string {
    const category = attributes.category || '';
    if (category.includes('vegetable')) return 'Vegetable';
    if (category.includes('fruit')) return 'Fruit';
    if (category.includes('herb')) return 'Herb';
    if (category.includes('flower')) return 'Flower';
    return 'Other';
  }

  /**
   * Import plants from a local JSON/CSV file (seed data)
   */
  async importFromSeedData(seedData: any[]): Promise<{ newCount: number; updatedCount: number }> {
    console.log(`\n🌱 Importing ${seedData.length} plants from seed data...`);
    
    let newCount = 0;
    let updatedCount = 0;
    
    for (const plant of seedData) {
      const existing = await db
        .select()
        .from(plants)
        .where(eq(plants.plantId, plant.plantId))
        .limit(1);
      
      const plantData = {
        plantId: plant.plantId,
        commonName: plant.commonName,
        scientificName: plant.scientificName,
        variety: plant.variety,
        family: plant.family,
        type: plant.type,
        growthHabit: plant.growthHabit,
        sunlight: plant.sunlight,
        waterNeeds: plant.waterNeeds,
        soilType: plant.soilType,
        soilPH: plant.soilPH,
        daysToMaturity: plant.daysToMaturity,
        daysToGermination: plant.daysToGermination,
        spacingInches: plant.spacingInches,
        rowSpacingInches: plant.rowSpacingInches,
        plantingDepthInches: plant.plantingDepthInches,
        frostTolerant: plant.frostTolerant || false,
        perennial: plant.perennial || false,
        description: plant.description,
        careInstructions: plant.careInstructions,
        harvestInstructions: plant.harvestInstructions,
        companionPlants: plant.companionPlants,
        avoidPlants: plant.avoidPlants,
        rawData: plant.rawData,
        updatedAt: new Date(),
      };
      
      if (existing.length > 0) {
        await db.update(plants).set(plantData).where(eq(plants.plantId, plant.plantId));
        updatedCount++;
      } else {
        await db.insert(plants).values(plantData);
        newCount++;
      }
    }
    
    console.log(`  Import complete: ${newCount} new, ${updatedCount} updated`);
    return { newCount, updatedCount };
  }

  /**
   * Poll OpenFarm API for plants
   */
  async pollOpenFarm(options?: { query?: string; limit?: number }): Promise<{ success: boolean; stats?: any }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🌱 Starting OpenFarm plant poll at ${new Date().toISOString()}`);
      
      const crops = await this.fetchFromOpenFarm(options?.query);
      const limit = options?.limit || crops.length;
      
      let newCount = 0;
      let updatedCount = 0;
      
      for (let i = 0; i < Math.min(crops.length, limit); i++) {
        const plantData = this.transformOpenFarmCrop(crops[i]);
        
        const existing = await db
          .select()
          .from(plants)
          .where(eq(plants.plantId, plantData.plantId))
          .limit(1);
        
        if (existing.length > 0) {
          await db.update(plants).set(plantData).where(eq(plants.plantId, plantData.plantId));
          updatedCount++;
        } else {
          await db.insert(plants).values(plantData);
          newCount++;
        }
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        totalFetched: Math.min(crops.length, limit),
        newCount, 
        updatedCount,
        duration
      };
      
      console.log(`✅ Plant poll complete: ${newCount} new, ${updatedCount} updated`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Plant polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }

  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(plants);
    
    const byType = await db
      .select({
        type: plants.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(plants)
      .groupBy(plants.type)
      .orderBy(sql`count DESC`);
    
    return {
      total: total[0]?.count || 0,
      byType: byType,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }

  isPollingActive(): boolean {
    return this.pollingActive;
  }
}