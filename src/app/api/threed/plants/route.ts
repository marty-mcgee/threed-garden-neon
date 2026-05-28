// src/app/api/threed/plants/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlants } from '@/lib/auth/schema';
import { desc, eq, ilike, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/plants - List plants with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const status = searchParams.get('status') || 'active';
  
  try {
    let conditions = [];
    
    if (type && type !== 'all') {
      conditions.push(eq(threedPlants.type, type as any));
    }
    
    if (search) {
      conditions.push(
        sql`${threedPlants.commonName} ILIKE ${`%${search}%`}`
      );
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(threedPlants.status, status as any));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const plants = await db
      .select()
      .from(threedPlants)
      .where(whereClause)
      .orderBy(desc(threedPlants.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlants)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: plants,
      count: plants.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/plants - Create new plant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate plantId if not provided
    if (!body.plantId) {
      body.plantId = body.commonName.toLowerCase().replace(/\s+/g, '-');
    }
    
    const newPlant = await db.insert(threedPlants).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newPlant[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/plants/:id - Update plant
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plant ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedPlants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedPlants.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/plants/:id - Soft delete plant
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plant ID required' },
        { status: 400 }
      );
    }
    
    const updated = await db
      .update(threedPlants)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(threedPlants.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plants DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}