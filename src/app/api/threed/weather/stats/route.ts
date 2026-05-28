// src/app/api/threed/weather/stats/route.ts
import { NextResponse } from 'next/server';
import { WeatherPoller } from '@/lib/services/threed/WeatherPoller';

export const dynamic = 'force-dynamic';

export async function GET() {
  const poller = new WeatherPoller();
  const stats = await poller.getStats();
  
  return NextResponse.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
}