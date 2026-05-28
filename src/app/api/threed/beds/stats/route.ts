// src/app/api/threed/beds/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds);
    
    const active = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds)
      .where(sql`${threedBeds.isActive} = true`);
    
    const totalSquareFeet = await db
      .select({ sum: sql<number>`SUM(${threedBeds.squareFeet})` })
      .from(threedBeds)
      .where(sql`${threedBeds.isActive} = true`);
    
    const byShape = await db
      .select({
        shape: threedBeds.shape,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedBeds)
      .groupBy(threedBeds.shape)
      .orderBy(sql`count DESC`);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        active: active[0]?.count || 0,
        totalSquareFeet: totalSquareFeet[0]?.sum || 0,
        byShape,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}