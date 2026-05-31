// src/app/api/threed/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedCharacters, threedModels, threedBeds } from '@/lib/auth/schema';
import { eq, desc, sql } from 'drizzle-orm';

// GET /api/threed/characters - Fetch characters with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const bedId = searchParams.get('bedId');
    const includeModel = searchParams.get('includeModel') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: any;

    if (includeModel) {
      // Join with models to get full model data
      query = db.select({
        character: {
          id: threedCharacters.id,
          characterId: threedCharacters.characterId,
          name: threedCharacters.name,
          description: threedCharacters.description,
          type: threedCharacters.type,
          status: threedCharacters.status,
          modelId: threedCharacters.modelId,
          animations: threedCharacters.animations,
          defaultAnimation: threedCharacters.defaultAnimation,
          animationSpeed: threedCharacters.animationSpeed,
          isMovable: threedCharacters.isMovable,
          movementPattern: threedCharacters.movementPattern,
          movementRadius: threedCharacters.movementRadius,
          movementSpeed: threedCharacters.movementSpeed,
          interactable: threedCharacters.interactable,
          interactionMessage: threedCharacters.interactionMessage,
          soundEffect: threedCharacters.soundEffect,
          bedId: threedCharacters.bedId,
          positionX: threedCharacters.positionX,
          positionY: threedCharacters.positionY,
          positionZ: threedCharacters.positionZ,
          rotation: threedCharacters.rotation,
          scale: threedCharacters.scale,
          scaleMultiplier: threedCharacters.scaleMultiplier,
          colorTint: threedCharacters.colorTint,
          isActive: threedCharacters.isActive,
          metadata: threedCharacters.metadata,
          createdAt: threedCharacters.createdAt,
          updatedAt: threedCharacters.updatedAt,
        },
        model: {
          id: threedModels.id,
          modelName: threedModels.modelName,
          modelType: threedModels.modelType,
          filePath: threedModels.filePath,
          scale: threedModels.scale,
          rotationY: threedModels.rotationY,
          animations: threedModels.animations,
          defaultAnimation: threedModels.defaultAnimation,
        },
        bed: {
          id: threedBeds.id,
          name: threedBeds.name,
          positionX: threedBeds.positionX,
          positionY: threedBeds.positionY,
          positionZ: threedBeds.positionZ,
        }
      })
      .from(threedCharacters)
      .leftJoin(threedModels, eq(threedCharacters.modelId, threedModels.id))
      .leftJoin(threedBeds, eq(threedCharacters.bedId, threedBeds.id));
    } else {
      query = db.select().from(threedCharacters);
    }

    // Apply filters
    if (type) {
      query = query.where(eq(threedCharacters.type, type as any));
    }
    if (status) {
      query = query.where(eq(threedCharacters.status, status as any));
    }
    if (bedId) {
      query = query.where(eq(threedCharacters.bedId, parseInt(bedId)));
    }

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(threedCharacters);
    const total = countResult[0];

    // Apply pagination and ordering
    const characters = await query
      .orderBy(desc(threedCharacters.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: includeModel ? characters : characters,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/threed/characters - Create a new character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.characterId || !body.name) {
      return NextResponse.json(
        { success: false, error: 'characterId and name are required' },
        { status: 400 }
      );
    }
    
    // Create character
    const [newCharacter] = await db.insert(threedCharacters).values({
      characterId: body.characterId,
      name: body.name,
      description: body.description,
      type: body.type || 'animal',
      status: body.status || 'active',
      
      // Foreign key to model
      modelId: body.modelId || null,
      
      // Character-specific fields
      animations: body.animations || [],
      defaultAnimation: body.defaultAnimation,
      animationSpeed: body.animationSpeed || 1.0,
      
      // Movement/Behavior
      isMovable: body.isMovable || false,
      movementPattern: body.movementPattern,
      movementRadius: body.movementRadius,
      movementSpeed: body.movementSpeed || 0.5,
      
      // Interaction
      interactable: body.interactable !== false,
      interactionMessage: body.interactionMessage,
      soundEffect: body.soundEffect,
      
      // Position in garden
      bedId: body.bedId || null,
      positionX: body.positionX || 0,
      positionY: body.positionY || 0,
      positionZ: body.positionZ || 0,
      rotation: body.rotation || 0,
      scale: body.scale || 1,
      scaleMultiplier: body.scaleMultiplier || 1,
      colorTint: body.colorTint,
      
      // Metadata
      isActive: body.isActive !== false,
      metadata: body.metadata || {},
    }).returning();
    
    // Update model usage tracking if a model was assigned
    if (body.modelId) {
      await db.update(threedModels)
        .set({ usedByCharacters: true })
        .where(eq(threedModels.id, body.modelId));
    }
    
    return NextResponse.json({ success: true, data: newCharacter });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/characters - Update a character
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Get old model ID to update usage tracking
    const [oldCharacter] = await db.select({ modelId: threedCharacters.modelId })
      .from(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    const [updated] = await db.update(threedCharacters)
      .set({
        name: body.name,
        description: body.description,
        type: body.type,
        status: body.status,
        modelId: body.modelId || null,
        animations: body.animations,
        defaultAnimation: body.defaultAnimation,
        animationSpeed: body.animationSpeed,
        isMovable: body.isMovable,
        movementPattern: body.movementPattern,
        movementRadius: body.movementRadius,
        movementSpeed: body.movementSpeed,
        interactable: body.interactable,
        interactionMessage: body.interactionMessage,
        soundEffect: body.soundEffect,
        bedId: body.bedId,
        positionX: body.positionX,
        positionY: body.positionY,
        positionZ: body.positionZ,
        rotation: body.rotation,
        scale: body.scale,
        scaleMultiplier: body.scaleMultiplier,
        colorTint: body.colorTint,
        isActive: body.isActive,
        metadata: body.metadata,
        updatedAt: new Date(),
      })
      .where(eq(threedCharacters.id, parseInt(id)))
      .returning();
    
    // Update model usage tracking
    if (oldCharacter?.modelId !== body.modelId) {
      // Check if old model is still used by any characters
      if (oldCharacter?.modelId) {
        const otherCharacters = await db.select({ count: sql<number>`count(*)` })
          .from(threedCharacters)
          .where(eq(threedCharacters.modelId, oldCharacter.modelId));
        
        if (otherCharacters[0]?.count === 0) {
          await db.update(threedModels)
            .set({ usedByCharacters: false })
            .where(eq(threedModels.id, oldCharacter.modelId));
        }
      }
      
      // Mark new model as used
      if (body.modelId) {
        await db.update(threedModels)
          .set({ usedByCharacters: true })
          .where(eq(threedModels.id, body.modelId));
      }
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/characters - Delete a character
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }
    
    // Get model ID before deleting
    const [character] = await db.select({ modelId: threedCharacters.modelId })
      .from(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    await db.delete(threedCharacters)
      .where(eq(threedCharacters.id, parseInt(id)));
    
    // Update model usage if this was the last character using it
    if (character?.modelId) {
      const otherCharacters = await db.select({ count: sql<number>`count(*)` })
        .from(threedCharacters)
        .where(eq(threedCharacters.modelId, character.modelId));
      
      if (otherCharacters[0]?.count === 0) {
        await db.update(threedModels)
          .set({ usedByCharacters: false })
          .where(eq(threedModels.id, character.modelId));
      }
    }
    
    return NextResponse.json({ success: true, message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}