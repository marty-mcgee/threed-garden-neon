// src/lib/scripts/cleanup-legacy-columns.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

async function cleanupLegacyColumns() {
  console.log('🧹 Cleaning up legacy columns...');
  
  const legacyColumns = [
    'custom_model_url',
    'model_scale', 
    'foliage_color',
    'fruit_color',
    'model_type',
    'model_path',
    'model_metadata',
    'is_custom_model',
    'model_version'
  ];
  
  for (const column of legacyColumns) {
    try {
      await db.execute(sql`
        ALTER TABLE threed_plants 
        DROP COLUMN IF EXISTS ${sql.raw(column)} CASCADE;
      `);
      console.log(`✓ Dropped column: ${column}`);
    } catch (error) {
      console.log(`⚠️ Could not drop ${column}:`, error.message);
    }
  }
  
  // Also clean up threed_models if needed
  try {
    await db.execute(sql`
      ALTER TABLE threed_models 
      DROP COLUMN IF EXISTS plant_id CASCADE,
      DROP COLUMN IF EXISTS character_id CASCADE;
    `);
    console.log('✓ Cleaned up threed_models columns');
  } catch (error) {
    console.log('⚠️ Could not clean threed_models:', error.message);
  }
  
  console.log('✅ Cleanup complete!');
}

cleanupLegacyColumns()
  .then(() => process.exit(0))
  .catch(console.error);