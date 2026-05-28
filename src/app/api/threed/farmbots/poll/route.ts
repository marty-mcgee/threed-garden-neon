// src/app/api/threed/farmbots/poll/route.ts
import { NextResponse } from 'next/server';
import { FarmBotPoller } from '@/lib/services/threed/FarmBotPoller';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log(`Starting FarmBot poll...`);
  
  const poller = new FarmBotPoller();
  const result = await poller.pollAll();
  
  return NextResponse.json({
    success: result.success,
    message: result.success ? 'FarmBot poll completed' : 'Poll failed',
    stats: result.stats,
    timestamp: new Date().toISOString()
  });
}