// src/app/api/threed/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { threedModels, threedPlants } from '@/lib/auth/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { put, del } from '@vercel/blob';

// GET /api/threed/models - Fetch models with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId');
    const modelType = searchParams.get('modelType');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select({
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
      }
    })
    .from(threedModels)
    .leftJoin(threedPlants, eq(threedModels.plantId, threedPlants.id));

    // Apply filters
    if (plantId) {
      query = query.where(eq(threedModels.plantId, parseInt(plantId)));
    }
    if (modelType) {
      query = query.where(eq(threedModels.modelType, modelType));
    }
    if (isActive !== null) {
      query = query.where(eq(threedModels.isActive, isActive === 'true'));
    }

    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(threedModels);
    
    const [total] = await countQuery;
    
    // Apply pagination and ordering
    const models = await query
      .orderBy(desc(threedModels.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: models,
      pagination: {
        limit,
        offset,
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// POST /api/threed/models - Upload a new GLTF model
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const modelFile = formData.get('file') as File;
    const plantId = formData.get('plantId') as string;
    const modelName = formData.get('modelName') as string;
    const modelType = formData.get('modelType') as string;
    const isDefault = formData.get('isDefault') === 'true';
    
    // Validation
    if (!modelFile) {
      return NextResponse.json(
        { success: false, error: 'No model file provided' },
        { status: 400 }
      );
    }

    if (!plantId || !modelName) {
      return NextResponse.json(
        { success: false, error: 'plantId and modelName are required' },
        { status: 400 }
      );
    }

    // Check if plant exists
    const plant = await db.select()
      .from(threedPlants)
      .where(eq(threedPlants.id, parseInt(plantId)))
      .limit(1);

    if (plant.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plant not found' },
        { status: 404 }
      );
    }

    // Validate file type
    const validExtensions = ['.gltf', '.glb', '.usdz', '.obj'];
    const fileExtension = modelFile.name.substring(modelFile.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: ${validExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob (or your storage solution)
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${modelFile.name}`;
    const blob = await put(`models/${uniqueFileName}`, modelFile, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Parse additional metadata
    const scale = parseFloat(formData.get('scale') as string) || 1.0;
    const rotationY = parseFloat(formData.get('rotationY') as string) || 0.0;
    const offsetX = parseFloat(formData.get('offsetX') as string) || 0.0;
    const offsetY = parseFloat(formData.get('offsetY') as string) || 0.0;
    const offsetZ = parseFloat(formData.get('offsetZ') as string) || 0.0;
    
    const hasLOD = formData.get('hasLOD') === 'true';
    let lodLevels = {};
    if (hasLOD) {
      try {
        lodLevels = JSON.parse(formData.get('lodLevels') as string || '{}');
      } catch (e) {
        console.warn('Invalid LOD levels JSON');
      }
    }

    let animations = [];
    try {
      animations = JSON.parse(formData.get('animations') as string || '[]');
    } catch (e) {
      console.warn('Invalid animations JSON');
    }

    const defaultAnimation = formData.get('defaultAnimation') as string || null;
    
    let metadata = {};
    try {
      metadata = JSON.parse(formData.get('metadata') as string || '{}');
    } catch (e) {
      console.warn('Invalid metadata JSON');
    }

    // If this model is set as default, unset any existing default for this plant
    if (isDefault) {
      await db.update(threedModels)
        .set({ isDefault: false })
        .where(eq(threedModels.plantId, parseInt(plantId)));
    }

    // Insert model record
    const [newModel] = await db.insert(threedModels).values({
      plantId: parseInt(plantId),
      modelName,
      modelType: modelType || fileExtension.substring(1), // Remove dot from extension
      filePath: blob.url,
      fileSize: modelFile.size,
      scale: scale.toString(),
      rotationY: rotationY.toString(),
      offsetX: offsetX.toString(),
      offsetY: offsetY.toString(),
      offsetZ: offsetZ.toString(),
      hasLOD,
      lodLevels,
      animations,
      defaultAnimation,
      isActive: true,
      isDefault,
      uploadedBy: 'system', // TODO: Get from session
      metadata,
      uploadedAt: new Date(),
    }).returning();

    // Update the plant's modelType and modelPath if this is the default model
    if (isDefault) {
      await db.update(threedPlants)
        .set({
          modelType: newModel.modelType as any,
          modelPath: newModel.filePath,
          isCustomModel: true,
          modelMetadata: {
            scale: newModel.scale,
            rotationY: newModel.rotationY,
            offsets: {
              x: newModel.offsetX,
              y: newModel.offsetY,
              z: newModel.offsetZ,
            },
            animations: newModel.animations,
            defaultAnimation: newModel.defaultAnimation,
          },
          updatedAt: new Date(),
        })
        .where(eq(threedPlants.id, parseInt(plantId)));
    }

    return NextResponse.json({
      success: true,
      data: newModel,
      message: 'Model uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload model' },
      { status: 500 }
    );
  }
}

// DELETE /api/threed/models - Bulk delete models
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids')?.split(',') || [];
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No model IDs provided' },
        { status: 400 }
      );
    }

    const deletedModels = [];
    const errors = [];

    for (const id of ids) {
      try {
        // Get model info first to delete file from storage
        const [model] = await db.select()
          .from(threedModels)
          .where(eq(threedModels.id, parseInt(id)))
          .limit(1);

        if (model) {
          // Delete file from Vercel Blob
          try {
            await del(model.filePath);
          } catch (blobError) {
            console.warn(`Failed to delete blob for model ${id}:`, blobError);
          }

          // Delete from database
          await db.delete(threedModels)
            .where(eq(threedModels.id, parseInt(id)));
          
          deletedModels.push(id);
        }
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedModels,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${deletedModels.length} models`,
    });
  } catch (error) {
    console.error('Error deleting models:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete models' },
      { status: 500 }
    );
  }
}