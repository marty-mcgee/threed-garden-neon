// src/app/api/threed/plantings/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedPlantings, threedPlants, threedBeds } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/plantings - List plantings with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const bedId = searchParams.get('bedId');
  const plantId = searchParams.get('plantId');
  const status = searchParams.get('status');
  
  try {
    let conditions = [];
    
    if (bedId) {
      conditions.push(eq(threedPlantings.bedId, parseInt(bedId)));
    }
    
    if (plantId) {
      conditions.push(eq(threedPlantings.plantId, parseInt(plantId)));
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(threedPlantings.status, status as any));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const plantings = await db
      .select({
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedPlantings)
      .leftJoin(threedPlants, eq(threedPlantings.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id))
      .where(whereClause)
      .orderBy(desc(threedPlantings.plantedDate))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedPlantings)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: plantings,
      count: plantings.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/plantings - Create new planting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate plantingId if not provided
    if (!body.plantingId) {
      const plant = await db
        .select({ plantId: threedPlants.plantId })
        .from(threedPlants)
        .where(eq(threedPlants.id, body.plantId))
        .limit(1);
      
      const date = new Date().toISOString().split('T')[0];
      body.plantingId = `${plant[0]?.plantId || 'plant'}-${date}-${Date.now()}`;
    }
    
    const newPlanting = await db.insert(threedPlantings).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Fetch the complete planting with plant and bed info
    const completePlanting = await db
      .select({
        planting: threedPlantings,
        plant: threedPlants,
        bed: threedBeds,
      })
      .from(threedPlantings)
      .leftJoin(threedPlants, eq(threedPlantings.plantId, threedPlants.id))
      .leftJoin(threedBeds, eq(threedPlantings.bedId, threedBeds.id))
      .where(eq(threedPlantings.id, newPlanting[0].id))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      data: completePlanting[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/plantings/:id - Update planting
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Planting ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const updated = await db
      .update(threedPlantings)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedPlantings.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/plantings/:id - Delete planting
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Planting ID required' },
        { status: 400 }
      );
    }
    
    const deleted = await db
      .delete(threedPlantings)
      .where(eq(threedPlantings.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: deleted[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Plantings DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}