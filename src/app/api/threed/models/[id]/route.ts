// src/app/api/threed/models/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedPlants } from '@/lib/auth/schema';
import { eq, and } from 'drizzle-orm';
import { del } from '@vercel/blob';

// GET /api/threed/models/[id] - Get a specific model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const [model] = await db.select({
      id: threedModels.id,
      plantId: threedModels.plantId,
      modelName: threedModels.modelName,
      modelType: threedModels.modelType,
      filePath: threedModels.filePath,
      fileSize: threedModels.fileSize,
      scale: threedModels.scale,
      rotationY: threedModels.rotationY,
      offsetX: threedModels.offsetX,
      offsetY: threedModels.offsetY,
      offsetZ: threedModels.offsetZ,
      hasLOD: threedModels.hasLOD,
      lodLevels: threedModels.lodLevels,
      animations: threedModels.animations,
      defaultAnimation: threedModels.defaultAnimation,
      isActive: threedModels.isActive,
      isDefault: threedModels.isDefault,
      metadata: threedModels.metadata,
      createdAt: threedModels.createdAt,
      updatedAt: threedModels.updatedAt,
      plant: {
        id: threedPlants.id,
        commonName: threedPlants.commonName,
        scientificName: threedPlants.scientificName,
        plantId: threedPlants.plantId,
        modelType: threedPlants.modelType,
      }
    })
    .from(threedModels)
    .leftJoin(threedPlants, eq(threedModels.plantId, threedPlants.id))
    .where(eq(threedModels.id, id))
    .limit(1);

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: model,
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch model' },
      { status: 500 }
    );
  }
}

// PUT /api/threed/models/[id] - Update a model
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      modelName,
      scale,
      rotationY,
      offsetX,
      offsetY,
      offsetZ,
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      isActive,
      isDefault,
      metadata,
    } = body;

    // Check if model exists
    const [existingModel] = await db.select()
      .from(threedModels)
      .where(eq(threedModels.id, id))
      .limit(1);

    if (!existingModel) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset any existing default for this plant
    if (isDefault && !existingModel.isDefault) {
      await db.update(threedModels)
        .set({ isDefault: false })
        .where(eq(threedModels.plantId, existingModel.plantId));
    }

    // Update model
    const [updatedModel] = await db.update(threedModels)
      .set({
        modelName: modelName || existingModel.modelName,
        scale: scale !== undefined ? scale.toString() : existingModel.scale,
        rotationY: rotationY !== undefined ? rotationY.toString() : existingModel.rotationY,
        offsetX: offsetX !== undefined ? offsetX.toString() : existingModel.offsetX,
        offsetY: offsetY !== undefined ? offsetY.toString() : existingModel.offsetY,
        offsetZ: offsetZ !== undefined ? offsetZ.toString() : existingModel.offsetZ,
        hasLOD: hasLOD !== undefined ? hasLOD : existingModel.hasLOD,
        lodLevels: lodLevels || existingModel.lodLevels,
        animations: animations || existingModel.animations,
        defaultAnimation: defaultAnimation || existingModel.defaultAnimation,
        isActive: isActive !== undefined ? isActive : existingModel.isActive,
        isDefault: isDefault !== undefined ? isDefault : existingModel.isDefault,
        metadata: metadata || existingModel.metadata,
        updatedAt: new Date(),
      })
      .where(eq(threedModels.id, id))
      .returning();

    // Update plant reference if this is the default model
    if (updatedModel.isDefault) {
      await db.update(threedPlants)
        .set({
          modelType: updatedModel.modelType as any,
          modelPath: updatedModel.filePath,
          isCustomModel: true,
          modelMetadata: {
            scale: updatedModel.scale,
            rotationY: updatedModel.rotationY,
            offsets: {
              x: updatedModel.offsetX,
              y: updatedModel.offsetY,
              z: updatedModel.offsetZ,
            },
            animations: updatedModel.animations,
            defaultAnimation: updatedModel.defaultAnimation,
          },
          updatedAt: new Date(),
        })
        .where(eq(threedPlants.id, updatedModel.plantId));
    }

    return NextResponse.json({
      success: true,
      data: updatedModel,
      message: 'Model updated successfully',
    });
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/models/[id] - Delete a specific model
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model ID' },
        { status: 400 }
      );
    }

    // Get model info first
    const [model] = await db.select()
      .from(threedModels)
      .where(eq(threedModels.id, id))
      .limit(1);

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    // Check if this is the default model for its plant
    if (model.isDefault) {
      // Reset the plant's model to procedural
      await db.update(threedPlants)
        .set({
          modelType: 'procedural',
          modelPath: null,
          isCustomModel: false,
          modelMetadata: {},
          updatedAt: new Date(),
        })
        .where(eq(threedPlants.id, model.plantId));
    }

    // Delete file from storage
    try {
      await del(model.filePath);
    } catch (blobError) {
      console.warn(`Failed to delete blob for model ${id}:`, blobError);
    }

    // Delete from database
    await db.delete(threedModels)
      .where(eq(threedModels.id, id));

    return NextResponse.json({
      success: true,
      message: 'Model deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}