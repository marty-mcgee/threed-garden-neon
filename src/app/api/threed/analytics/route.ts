// src/app/api/threed/analytics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedHarvests, threedPlants, threedPlantings } from '@/lib/auth/schema';
import { sql, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get total harvests and weight
    const harvestStats = await db
      .select({
        totalHarvests: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
        totalQuantity: sql<number>`SUM(${threedHarvests.quantity})`,
      })
      .from(threedHarvests);
    
    // Get monthly trends (last 6 months)
    const monthlyTrend = await db.execute(sql`
      SELECT 
        TO_CHAR(harvest_date, 'YYYY-MM') as month,
        COUNT(*) as harvest_count,
        SUM(weight_lbs) as total_weight
      FROM threed_harvests
      WHERE harvest_date > NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(harvest_date, 'YYYY-MM')
      ORDER BY month DESC
    `);
    
    // Get top producing plants
    const topPlants = await db
      .select({
        plantId: threedHarvests.plantId,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .where(sql`${threedHarvests.plantId} IS NOT NULL`)
      .groupBy(threedHarvests.plantId)
      .orderBy(sql`totalWeight DESC`)
      .limit(5);
    
    // Fetch plant names for top plants
    const topPlantsWithNames = [];
    for (const plant of topPlants) {
      const plantInfo = await db
        .select({ commonName: threedPlants.commonName })
        .from(threedPlants)
        .where(sql`${threedPlants.id} = ${plant.plantId}`)
        .limit(1);
      
      topPlantsWithNames.push({
        name: plantInfo[0]?.commonName || 'Unknown',
        weight: Number(plant.totalWeight) || 0,
      });
    }
    
    // Calculate average yield per planting
    const activePlantings = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings)
      .where(sql`${threedPlantings.status} = 'growing' OR ${threedPlantings.status} = 'harvesting'`);
    
    const avgYieldPerPlant = activePlantings[0]?.count && harvestStats[0]?.totalWeight
      ? Number(harvestStats[0].totalWeight) / activePlantings[0].count
      : 0;
    
    // Get recent activity
    const recentHarvests = await db
      .select()
      .from(threedHarvests)
      .orderBy(desc(threedHarvests.harvestDate))
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        totalHarvests: Number(harvestStats[0]?.totalHarvests) || 0,
        totalWeight: Number(harvestStats[0]?.totalWeight) || 0,
        totalQuantity: Number(harvestStats[0]?.totalQuantity) || 0,
        avgYieldPerPlant: Number(avgYieldPerPlant),
        monthlyTrend: monthlyTrend.rows.map(row => ({
          month: row.month,
          weight: Number(row.total_weight) || 0,
          count: Number(row.harvest_count) || 0,
        })),
        topPlants: topPlantsWithNames,
        recentHarvests,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}