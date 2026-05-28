// src/app/api/threed/tasks/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedTasks } from '@/lib/auth/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks);
    
    const pending = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'pending'`);
    
    const inProgress = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'in_progress'`);
    
    const completed = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.status} = 'completed'`);
    
    const overdue = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedTasks)
      .where(sql`${threedTasks.dueDate} < NOW() AND ${threedTasks.status} NOT IN ('completed', 'cancelled')`);
    
    const byPriority = await db
      .select({
        priority: threedTasks.priority,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedTasks)
      .where(sql`${threedTasks.status} != 'completed'`)
      .groupBy(threedTasks.priority)
      .orderBy(sql`count DESC`);
    
    const byType = await db
      .select({
        type: threedTasks.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(threedTasks)
      .where(sql`${threedTasks.status} != 'completed'`)
      .groupBy(threedTasks.type)
      .orderBy(sql`count DESC`)
      .limit(5);
    
    return NextResponse.json({
      success: true,
      data: {
        total: total[0]?.count || 0,
        pending: pending[0]?.count || 0,
        inProgress: inProgress[0]?.count || 0,
        completed: completed[0]?.count || 0,
        overdue: overdue[0]?.count || 0,
        byPriority,
        byType,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Tasks Stats Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}