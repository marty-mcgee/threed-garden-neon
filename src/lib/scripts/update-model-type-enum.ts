// scripts/update-model-type-enum.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

async function updateModelTypeEnum() {
  console.log('Updating threed_model_type enum...');
  
  try {
    // First, check what values already exist
    const existingValues = await db.execute(sql`
      SELECT unnest(enum_range(NULL::threed_model_type)) as enum_value;
    `);
    
    console.log('Existing enum values:', existingValues);
    
    // Add new values one by one (PostgreSQL requires this approach)
    const newValues = [
      'herb-generic',
      'vegetable-generic', 
      'flower-generic',
      'fruit-generic',
      'tree-generic',
      'custom'
    ];
    
    for (const value of newValues) {
      try {
        await db.execute(sql`
          ALTER TYPE threed_model_type ADD VALUE IF NOT EXISTS ${sql.raw(value)};
        `);
        console.log(`Added value: ${value}`);
      } catch (error) {
        console.log(`Value ${value} might already exist:`, error.message);
      }
    }
    
    console.log('✅ Enum updated successfully!');
  } catch (error) {
    console.error('Error updating enum:', error);
    throw error;
  }
}

updateModelTypeEnum()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });