// src/app/api/threed/beds/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedBeds } from '@/lib/auth/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/threed/beds - List beds with filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const showAll = searchParams.get('showAll') === 'true';
  
  try {
    let conditions = [];
    
    if (!showAll) {
      conditions.push(eq(threedBeds.isActive, true));
    }
    
    const whereClause = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    const beds = await db
      .select()
      .from(threedBeds)
      .where(whereClause)
      .orderBy(desc(threedBeds.createdAt))
      .limit(limit)
      .offset(offset);
    
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedBeds)
      .where(whereClause);
    
    return NextResponse.json({
      success: true,
      data: beds,
      count: beds.length,
      total: total[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/threed/beds - Create new bed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate bedId if not provided
    if (!body.bedId) {
      body.bedId = body.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Calculate square feet if dimensions provided
    if (body.widthFeet && body.lengthFeet && !body.squareFeet) {
      body.squareFeet = body.widthFeet * body.lengthFeet;
    }
    
    const newBed = await db.insert(threedBeds).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return NextResponse.json({
      success: true,
      data: newBed[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/beds/:id - Update bed
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bed ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Recalculate square feet if dimensions changed
    if (body.widthFeet && body.lengthFeet) {
      body.squareFeet = body.widthFeet * body.lengthFeet;
    }
    
    const updated = await db
      .update(threedBeds)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(threedBeds.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/beds/:id - Soft delete bed
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bed ID required' },
        { status: 400 }
      );
    }
    
    const updated = await db
      .update(threedBeds)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(threedBeds.id, parseInt(id)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updated[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Beds DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}