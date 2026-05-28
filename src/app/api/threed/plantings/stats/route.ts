// src/app/api/threed/plantings/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlantings } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings);
    
    const byStatus = await db
      .select({
        status: threedPlantings.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlantings)
      .groupBy(threedPlantings.status)
      .orderBy(sql`count DESC`);
    
    const byGrowthStage = await db
      .select({
        growthStage: threedPlantings.growthStage,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedPlantings)
      .groupBy(threedPlantings.growthStage)
      .orderBy(sql`count DESC`);
    
    const recentPlantings = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings)
      .where(sql`planted_date > NOW() - INTERVAL '30 days'`);
    
    const totalPlantsPlanted = await db
      .select({ sum: sql<number>`SUM(${threedPlantings.quantity})` })
      .from(threedPlantings);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        byStatus,
        byGrowthStage,
        plantedLast30Days: recentPlantings[0]?.count || 0,
        totalPlantsPlanted: totalPlantsPlanted[0]?.sum || 0,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}