// src/app/api/threed/plants/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { plants } from '@/lib/auth/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  
  try {
    let query = db.select().from(plants);
    
    if (type && type !== 'all') {
      query = query.where(eq(plants.type, type));
    }
    
    if (search) {
      query = query.where(sql`${plants.commonName} ILIKE ${`%${search}%`}`);
    }
    
    const results = await query
      .orderBy(desc(plants.createdAt))
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}