// src/app/api/threed/farmbots/[id]/water/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedFarmbots } from '@/lib/auth/schema';
import { eq } from 'drizzle-orm';
import { FarmBotPoller } from '@/lib/services/threed/FarmBotPoller';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { durationMs = 60000 } = await request.json();
    
    const farmbot = await db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.id, parseInt(params.id)))
      .limit(1);
    
    if (!farmbot.length) {
      return NextResponse.json(
        { success: false, error: 'FarmBot not found' },
        { status: 404 }
      );
    }
    
    const poller = new FarmBotPoller();
    const result = await poller.sendWaterCommand(farmbot[0].deviceId, durationMs);
    
    // Log the command
    await db.insert(threedFarmbotLogs).values({
      farmbotId: farmbot[0].id,
      eventType: 'command',
      status: result ? 'success' : 'failed',
      message: `Water command sent: ${durationMs}ms`,
      sensorData: result,
      loggedAt: new Date(),
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Water command error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}