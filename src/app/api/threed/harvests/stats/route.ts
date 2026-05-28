// src/app/api/threed/harvests/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedHarvests } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedHarvests);
    
    const totalWeight = await db
      .select({ sum: sql<number>`SUM(${threedHarvests.weightLbs})` })
      .from(threedHarvests);
    
    const totalQuantity = await db
      .select({ sum: sql<number>`SUM(${threedHarvests.quantity})` })
      .from(threedHarvests);
    
    const byPlant = await db
      .select({
        plantId: threedHarvests.plantId,
        count: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .where(sql`${threedHarvests.plantId} IS NOT NULL`)
      .groupBy(threedHarvests.plantId)
      .orderBy(sql`totalWeight DESC`)
      .limit(10);
    
    const byMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${threedHarvests.harvestDate}, 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`,
        totalWeight: sql<number>`SUM(${threedHarvests.weightLbs})`,
      })
      .from(threedHarvests)
      .groupBy(sql`TO_CHAR(${threedHarvests.harvestDate}, 'YYYY-MM')`)
      .orderBy(sql`month DESC`)
      .limit(12);
    
    const recentHarvests = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedHarvests)
      .where(sql`harvest_date > NOW() - INTERVAL '30 days'`);
    
    return NextResponse.json({
      success: true,
      data: {
        totalHarvests: total[0]?.count || 0,
        totalWeightLbs: totalWeight[0]?.sum || 0,
        totalQuantity: totalQuantity[0]?.sum || 0,
        harvestsLast30Days: recentHarvests[0]?.count || 0,
        topPlants: byPlant,
        byMonth: byMonth,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Harvests Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}