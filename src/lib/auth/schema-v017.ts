// @/lib/auth/schema
import { 
  pgTable, 
  text, 
  timestamp, 
  boolean,
  index,
  serial, 
  varchar, 
  integer, 
  decimal, 
  numeric,
  jsonb,
  uniqueIndex,
  foreignKey,
  pgSchema,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ## Better Auth: User Session + Account
// ============================================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================
// ## Caltrans Districts Table
// ============================================
export const caltransDistricts = pgTable('caltrans_districts', {
  districtId: integer('district_id').primaryKey(),
  districtName: varchar('district_name', { length: 100 }),
  region: varchar('region', { length: 50 }),
  counties: text('counties').array(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  regionIdx: index('idx_districts_region').on(table.region),
}));

// ============================================
// ## Caltrans Lane Closures Table
// ============================================
export const laneClosures = pgTable('lane_closures', {
  closureId: serial('closure_id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  district: integer('district'),
  route: varchar('route', { length: 20 }),
  direction: varchar('direction', { length: 10 }),
  closureType: varchar('closure_type', { length: 50 }),
  closureSubtype: varchar('closure_subtype', { length: 50 }),
  lanesAffected: text('lanes_affected'),
  lanesClosed: text('lanes_closed'),
  laneConfiguration: text('lane_configuration'),
  startDate: timestamp('start_date', { mode: 'string' }),
  endDate: timestamp('end_date', { mode: 'string' }),
  startTime: varchar('start_time', { length: 8 }),
  endTime: varchar('end_time', { length: 8 }),
  startTimestamp: timestamp('start_timestamp', { mode: 'date' }),
  endTimestamp: timestamp('end_timestamp', { mode: 'date' }),
  description: text('description'),
  locationDescription: text('location_description'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  county: varchar('county', { length: 100 }),
  city: varchar('city', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active'),
  firstSeen: timestamp('first_seen').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  lastModified: timestamp('last_modified').defaultNow(),
  timesSeen: integer('times_seen').default(1),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_closures_source_id').on(table.sourceId),
  districtIdx: index('idx_closures_district').on(table.district),
  routeIdx: index('idx_closures_route').on(table.route),
  statusIdx: index('idx_closures_status').on(table.status),
  lastSeenIdx: index('idx_closures_last_seen').on(table.lastSeen),
  datesIdx: index('idx_closures_dates').on(table.startDate, table.endDate),
}));

// ============================================
// ## CHP Collisions Table (Historical)
// ============================================
export const chpCollisions = pgTable('chp_collisions', {
  id: serial('id').primaryKey(),
  caseId: varchar('case_id', { length: 50 }).unique(),
  collisionDate: timestamp('collision_date', { mode: 'date' }),
  collisionYear: integer('collision_year'),
  severity: varchar('severity', { length: 50 }),
  county: varchar('county', { length: 100 }),
  city: varchar('city', { length: 100 }),
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  primaryFactor: text('primary_factor'),
  weather: varchar('weather', { length: 50 }),
  lighting: varchar('lighting', { length: 50 }),
  injuries: integer('injuries').default(0),
  fatalities: integer('fatalities').default(0),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  lastSeen: timestamp('last_seen').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  caseIdIdx: uniqueIndex('idx_chp_case_id').on(table.caseId),
  countyIdx: index('idx_chp_county').on(table.county),
  severityIdx: index('idx_chp_severity').on(table.severity),
  yearIdx: index('idx_chp_year').on(table.collisionYear),
  dateIdx: index('idx_chp_date').on(table.collisionDate),
}));

// ============================================
// ## Bay Area 511 Traffic Events Table
// ============================================
export const bayAreaTrafficEvents = pgTable('bay_area_traffic_events', {
  id: serial('id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  eventType: varchar('event_type', { length: 100 }),
  eventSubType: varchar('event_sub_type', { length: 100 }),
  severity: varchar('severity', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
  title: text('title'),
  description: text('description'),
  roadwayName: varchar('roadway_name', { length: 100 }),
  directionOfTravel: varchar('direction_of_travel', { length: 50 }),
  lanesAffected: text('lanes_affected'),
  isFullClosure: boolean('is_full_closure').default(false),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  lastUpdated: timestamp('last_updated'),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_bay_area_source_id').on(table.sourceId),
  typeIdx: index('idx_bay_area_type').on(table.eventType),
  roadwayIdx: index('idx_bay_area_roadway').on(table.roadwayName),
  statusIdx: index('idx_bay_area_status').on(table.status),
}));

// ============================================
// ## API Request Logs Table (for monitoring)
// ============================================
export const apiRequestLogs = pgTable('api_request_logs', {
  logId: serial('log_id').primaryKey(),
  endpoint: text('endpoint'),
  district: integer('district'),
  responseTimeMs: integer('response_time_ms'),
  statusCode: integer('status_code'),
  success: boolean('success'),
  recordsFetched: integer('records_fetched').default(0),
  errorMessage: text('error_message'),
  responseSizeBytes: integer('response_size_bytes'),
  requestTimestamp: timestamp('request_timestamp').defaultNow(),
}, (table) => ({
  timestampIdx: index('idx_api_logs_timestamp').on(table.requestTimestamp),
  successIdx: index('idx_api_logs_success').on(table.success),
}));

// ============================================
// ## CHP CAD Incidents Tables
// ============================================

// CHP CAD Communications Centers table
export const chpCadCenters = pgTable('chp_cad_centers', {
  id: serial('id').primaryKey(),
  centerCode: varchar('center_code', { length: 10 }).unique().notNull(),
  centerName: varchar('center_name', { length: 100 }).notNull(),
  county: varchar('county', { length: 100 }),
  region: varchar('region', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  centerCodeIdx: uniqueIndex('idx_chp_cad_centers_code').on(table.centerCode),
  countyIdx: index('idx_chp_cad_centers_county').on(table.county),
}));

// CHP CAD Incidents table with foreign key to centers
export const chpCadIncidents = pgTable('chp_cad_incidents', {
  id: serial('id').primaryKey(),
  sourceId: varchar('source_id', { length: 100 }).unique(),
  centerId: integer('center_id').references(() => chpCadCenters.id, { onDelete: 'set null' }),
  incidentType: varchar('incident_type', { length: 100 }),
  location: text('location'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  logTime: timestamp('log_time'),
  details: text('details'),
  status: varchar('status', { length: 20 }).default('active'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  sourceIdIdx: uniqueIndex('idx_chp_cad_source_id').on(table.sourceId),
  centerIdIdx: index('idx_chp_cad_center_id').on(table.centerId),
  countyIdx: index('idx_chp_cad_county').on(table.county),
  logTimeIdx: index('idx_chp_cad_log_time').on(table.logTime),
}));

// Define relationships
export const chpCadCentersRelations = relations(chpCadCenters, ({ many }) => ({
  incidents: many(chpCadIncidents),
}));

export const chpCadIncidentsRelations = relations(chpCadIncidents, ({ one }) => ({
  center: one(chpCadCenters, {
    fields: [chpCadIncidents.centerId],
    references: [chpCadCenters.id],
  }),
}));


// ============================================
// ## CCTV Cameras Table (Future)
// ============================================
export const cctvCameras = pgTable('cctv_cameras', {
  cameraId: serial('camera_id').primaryKey(),
  index: varchar('index', { length: 10 }),
  district: integer('district'),
  locationName: varchar('location_name', { length: 100 }),
  nearbyPlace: varchar('nearby_place', { length: 100 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).$type<number>(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).$type<number>(),
  direction: varchar('direction', { length: 10 }),
  county: varchar('county', { length: 50 }),
  route: varchar('route', { length: 20 }),
  inService: boolean('in_service'),
  currentImageUrl: text('current_image_url'),
  lastUpdated: timestamp('last_updated'),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
});


// ============================================
// ## CalTrans
// ============================================

// Snapshots table for analytics
export const laneClosuresSnapshots = pgTable('lane_closures_snapshots', {
  snapshotId: serial('snapshot_id').primaryKey(),
  snapshotTimestamp: timestamp('snapshot_timestamp').defaultNow(),
  district: integer('district'),
  totalClosures: integer('total_closures'),
  closuresByType: jsonb('closures_by_type'),
  closuresByRoute: jsonb('closures_by_route'),
  rawSummary: jsonb('raw_summary'),
}, (table) => ({
  timestampIdx: index('idx_snapshots_timestamp').on(table.snapshotTimestamp),
  districtIdx: index('idx_snapshots_district').on(table.district),
}));

// Define relationships
export const laneClosuresRelations = relations(laneClosures, ({ one }) => ({
  district: one(caltransDistricts, {
    fields: [laneClosures.district],
    references: [caltransDistricts.districtId],
  }),
}));

export const caltransDistrictsRelations = relations(caltransDistricts, ({ many }) => ({
  closures: many(laneClosures),
}));

// Types for use in the application
export type LaneClosure = typeof laneClosures.$inferSelect;
export type NewLaneClosure = typeof laneClosures.$inferInsert;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type NewApiRequestLog = typeof apiRequestLogs.$inferInsert;
export type CaltransDistrict = typeof caltransDistricts.$inferSelect;

// ============================================
// ## CalFire Incidents
// ============================================
export const calfireIncidents = pgTable('calfire_incidents', {
  id: serial('id').primaryKey(),
  uniqueId: varchar('unique_id', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 50 }).default('Wildfire'),
  status: varchar('status', { length: 20 }).default('active'),
  county: varchar('county', { length: 100 }),
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  acresBurned: decimal('acres_burned', { precision: 12, scale: 1 }),
  percentContained: decimal('percent_contained', { precision: 5, scale: 1 }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  extinguishedAt: timestamp('extinguished_at', { withTimezone: true }),
  adminUnit: varchar('admin_unit', { length: 200 }),
  url: text('url'),
  isActive: boolean('is_active').default(true),
  isCalFireIncident: boolean('is_calfire_incident').default(false),
  rawData: jsonb('raw_data'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueIdIdx: uniqueIndex('idx_calfire_unique_id').on(table.uniqueId),
  countyIdx: index('idx_calfire_county').on(table.county),
  statusIdx: index('idx_calfire_status').on(table.status),
  activeIdx: index('idx_calfire_active').on(table.isActive),
}));

// ============================================
// ## [MM] Schema Updated 2026-05-27 07:12am
// ============================================

// ============================================
// ## [MM] Schema Updated 2026-05-28 09:31am
// ============================================


// ============================================
// ENUMS for type safety
// ============================================
export const plantTypeEnum = pgEnum('threed_plant_type', ['Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Shrub', 'CoverCrop']);
export const plantStatusEnum = pgEnum('threed_plant_status', ['active', 'inactive', 'archived']);
export const plantingStatusEnum = pgEnum('threed_planting_status', ['planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed']);
export const growthStageEnum = pgEnum('threed_growth_stage', ['seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'dormant']);
export const taskPriorityEnum = pgEnum('threed_task_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('threed_task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const bedShapeEnum = pgEnum('threed_bed_shape', ['rectangle', 'square', 'circle', 'raised', 'container', 'custom']);
export const farmbotStatusEnum = pgEnum('threed_farmbot_status', ['online', 'offline', 'maintenance', 'error']);

// ============================================
// 1. threed_plants - Master plant database
// ============================================
export const threedPlants = pgTable('threed_plants', {
  id: serial('id').primaryKey(),
  plantId: varchar('plant_id', { length: 50 }).unique().notNull(),
  commonName: varchar('common_name', { length: 255 }).notNull(),
  scientificName: varchar('scientific_name', { length: 255 }),
  variety: varchar('variety', { length: 100 }),
  family: varchar('family', { length: 100 }),
  type: plantTypeEnum('type').default('Vegetable'),
  status: plantStatusEnum('status').default('active'),
  
  // NEW: 3D Model fields
  modelType: varchar('model_type', { length: 50 }), // tomato, basil, pepper, etc.
  customModelUrl: text('custom_model_url'), // For custom GLTF/GLB models
  modelScale: decimal('model_scale', { precision: 5, scale: 2 }).default('1'),
  foliageColor: varchar('foliage_color', { length: 20 }).default('#32CD32'),
  fruitColor: varchar('fruit_color', { length: 20 }).default('#FF6347'),
  
  // Growth parameters
  growthHabit: varchar('growth_habit', { length: 50 }),
  daysToMaturity: integer('days_to_maturity'),
  daysToGermination: integer('days_to_germination'),
  daysToHarvest: integer('days_to_harvest'),
  
  // Spacing requirements (inches)
  spacingInches: integer('spacing_inches'),
  rowSpacingInches: integer('row_spacing_inches'),
  plantingDepthInches: decimal('planting_depth_inches', { precision: 3, scale: 1 }),
  
  // Environmental needs
  sunlight: varchar('sunlight', { length: 50 }).default('Full Sun'),
  waterNeeds: varchar('water_needs', { length: 20 }).default('Medium'),
  soilType: text('soil_type'),
  soilPH: decimal('soil_ph', { precision: 3, scale: 1 }),
  hardinessZone: varchar('hardiness_zone', { length: 10 }),
  frostTolerant: boolean('frost_tolerant').default(false),
  perennial: boolean('perennial').default(false),
  
  // Media and descriptions
  imageUrl: text('image_url'),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  careInstructions: text('care_instructions'),
  harvestInstructions: text('harvest_instructions'),
  
  // Companion planting
  companionPlants: text('companion_plants'),
  avoidPlants: text('avoid_plants'),
  
  // Metadata
  source: varchar('source', { length: 100 }),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantIdIdx: uniqueIndex('idx_threed_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_threed_plants_common_name').on(table.commonName),
  typeIdx: index('idx_threed_plants_type').on(table.type),
  statusIdx: index('idx_threed_plants_status').on(table.status),
}));

// ============================================
// 2. threed_beds - Garden layout
// ============================================
export const threedBeds = pgTable('threed_beds', {
  id: serial('id').primaryKey(),
  bedId: varchar('bed_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  shape: bedShapeEnum('shape').default('rectangle'),
  
  // Dimensions (feet)
  widthFeet: decimal('width_feet', { precision: 5, scale: 2 }),
  lengthFeet: decimal('length_feet', { precision: 5, scale: 2 }),
  squareFeet: decimal('square_feet', { precision: 8, scale: 2 }),
  heightFeet: decimal('height_feet', { precision: 5, scale: 2 }).default('1'),
  
  // Soil and environment
  soilType: varchar('soil_type', { length: 50 }),
  sunExposure: varchar('sun_exposure', { length: 50 }),
  
  // 3D positioning (for Three.js)
  positionX: decimal('position_x', { precision: 8, scale: 2 }).default('0'),
  positionY: decimal('position_y', { precision: 8, scale: 2 }).default('0'),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }).default('0'),
  rotation: decimal('rotation', { precision: 8, scale: 2 }).default('0'),
  scale: decimal('scale', { precision: 5, scale: 2 }).default('1'),
  
  // Status
  isActive: boolean('is_active').default(true),
  color: varchar('color', { length: 20 }).default('#8B5E3C'),
  
  // Metadata
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  bedIdIdx: uniqueIndex('idx_threed_beds_bed_id').on(table.bedId),
  activeIdx: index('idx_threed_beds_active').on(table.isActive),
  nameIdx: index('idx_threed_beds_name').on(table.name),
}));

// ============================================
// 3. threed_plantings - Plants in beds
// ============================================
export const threedPlantings = pgTable('threed_plantings', {
  id: serial('id').primaryKey(),
  plantingId: varchar('planting_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  
  // Planting details
  quantity: integer('quantity').default(1),
  spacingInches: integer('spacing_inches'),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  
  // Dates
  plantedDate: timestamp('planted_date'),
  expectedGerminationDate: timestamp('expected_germination_date'),
  expectedHarvestDate: timestamp('expected_harvest_date'),
  actualHarvestDate: timestamp('actual_harvest_date'),
  
  // Status tracking
  status: plantingStatusEnum('status').default('planted'),
  growthStage: growthStageEnum('growth_stage').default('seed'),
  health: varchar('health', { length: 20 }).default('good'),
  notes: text('notes'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantingIdIdx: uniqueIndex('idx_threed_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_threed_plantings_plant').on(table.plantId),
  bedIdx: index('idx_threed_plantings_bed').on(table.bedId),
  statusIdx: index('idx_threed_plantings_status').on(table.status),
}));

// ============================================
// 4. threed_harvests - Harvest logging
// ============================================
export const threedHarvests = pgTable('threed_harvests', {
  id: serial('id').primaryKey(),
  harvestId: varchar('harvest_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  
  // Harvest details
  quantity: decimal('quantity', { precision: 8, scale: 2 }),
  unit: varchar('unit', { length: 20 }).default('lbs'),
  weightLbs: decimal('weight_lbs', { precision: 8, scale: 2 }),
  
  // Date and notes
  harvestDate: timestamp('harvest_date').defaultNow(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  harvestIdIdx: uniqueIndex('idx_threed_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_threed_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_threed_harvests_date').on(table.harvestDate),
}));

// ============================================
// 5. threed_tasks - Garden tasks/to-do
// ============================================
export const threedTasks = pgTable('threed_tasks', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => threedPlantings.id, { onDelete: 'set null' }),
  plantId: integer('plant_id').references(() => threedPlants.id, { onDelete: 'set null' }),
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  
  // Task details
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // water, fertilize, prune, harvest, weed, pest_control, plant
  
  // Status and priority
  priority: taskPriorityEnum('priority').default('medium'),
  status: taskStatusEnum('status').default('pending'),
  
  // Scheduling
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Metadata
  assignedTo: varchar('assigned_to', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  taskIdIdx: uniqueIndex('idx_threed_tasks_task_id').on(table.taskId),
  plantingIdx: index('idx_threed_tasks_planting').on(table.plantingId),
  dueDateIdx: index('idx_threed_tasks_due_date').on(table.dueDate),
  statusIdx: index('idx_threed_tasks_status').on(table.status),
}));

// ============================================
// 6. threed_weather_logs - Environmental data
// ============================================
export const threedWeatherLogs = pgTable('threed_weather_logs', {
  id: serial('id').primaryKey(),
  recordedAt: timestamp('recorded_at').defaultNow(),
  
  // Weather data
  temperature: decimal('temperature', { precision: 5, scale: 1 }),
  humidity: decimal('humidity', { precision: 5, scale: 1 }),
  rainfallInches: decimal('rainfall_inches', { precision: 5, scale: 2 }),
  soilMoisture: decimal('soil_moisture', { precision: 5, scale: 1 }),
  sunlightHours: decimal('sunlight_hours', { precision: 4, scale: 1 }),
  windSpeed: decimal('wind_speed', { precision: 5, scale: 1 }),
  
  // Alerts
  frostWarning: boolean('frost_warning').default(false),
  heatWarning: boolean('heat_warning').default(false),
  droughtWarning: boolean('drought_warning').default(false),
  
  // Source and metadata
  source: varchar('source', { length: 50 }).default('api'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  recordedAtIdx: index('idx_threed_weather_recorded_at').on(table.recordedAt),
}));

// ============================================
// 7. threed_farmbots - FarmBot devices
// ============================================
export const threedFarmbots = pgTable('threed_farmbots', {
  id: serial('id').primaryKey(),
  deviceId: varchar('device_id', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  status: farmbotStatusEnum('status').default('offline'),
  
  // Location in garden
  bedId: integer('bed_id').references(() => threedBeds.id, { onDelete: 'set null' }),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  
  // Configuration
  apiToken: varchar('api_token', { length: 255 }),
  apiUrl: varchar('api_url', { length: 255 }),
  
  // Last known data
  lastSeen: timestamp('last_seen'),
  batteryLevel: integer('battery_level'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  deviceIdIdx: uniqueIndex('idx_threed_farmbots_device_id').on(table.deviceId),
  statusIdx: index('idx_threed_farmbots_status').on(table.status),
}));

// ============================================
// 8. threed_farmbot_logs - FarmBot activity log
// ============================================
export const threedFarmbotLogs = pgTable('threed_farmbot_logs', {
  id: serial('id').primaryKey(),
  farmbotId: integer('farmbot_id').references(() => threedFarmbots.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }), // watering, planting, sensor, error, maintenance
  status: varchar('status', { length: 20 }), // success, failed, pending, in_progress
  message: text('message'),
  sensorData: jsonb('sensor_data'),
  rawData: jsonb('raw_data'),
  loggedAt: timestamp('logged_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  farmbotIdx: index('idx_threed_farmbot_logs_farmbot').on(table.farmbotId),
  eventTypeIdx: index('idx_threed_farmbot_logs_event_type').on(table.eventType),
  loggedAtIdx: index('idx_threed_farmbot_logs_logged_at').on(table.loggedAt),
}));

// ============================================
// 9. threed_system_logs - Application logging
// ============================================
export const threedSystemLogs = pgTable('threed_system_logs', {
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 20 }), // info, warning, error, debug
  source: varchar('source', { length: 100 }),
  message: text('message'),
  details: jsonb('details'),
  loggedAt: timestamp('logged_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  levelIdx: index('idx_threed_system_logs_level').on(table.level),
  loggedAtIdx: index('idx_threed_system_logs_logged_at').on(table.loggedAt),
}));

// ============================================
// RELATIONSHIPS
// ============================================
export const threedPlantsRelations = relations(threedPlants, ({ many }) => ({
  plantings: many(threedPlantings),
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
}));

export const threedBedsRelations = relations(threedBeds, ({ many }) => ({
  plantings: many(threedPlantings),
  farmbots: many(threedFarmbots),
  tasks: many(threedTasks),
}));

export const threedPlantingsRelations = relations(threedPlantings, ({ one, many }) => ({
  plant: one(threedPlants, {
    fields: [threedPlantings.plantId],
    references: [threedPlants.id],
  }),
  bed: one(threedBeds, {
    fields: [threedPlantings.bedId],
    references: [threedBeds.id],
  }),
  harvests: many(threedHarvests),
  tasks: many(threedTasks),
}));

export const threedFarmbotsRelations = relations(threedFarmbots, ({ one, many }) => ({
  bed: one(threedBeds, {
    fields: [threedFarmbots.bedId],
    references: [threedBeds.id],
  }),
  logs: many(threedFarmbotLogs),
}));

// Export types for use in the application
export type ThreedPlant = typeof threedPlants.$inferSelect;
export type NewThreedPlant = typeof threedPlants.$inferInsert;
export type ThreedBed = typeof threedBeds.$inferSelect;
export type NewThreedBed = typeof threedBeds.$inferInsert;
export type ThreedPlanting = typeof threedPlantings.$inferSelect;
export type NewThreedPlanting = typeof threedPlantings.$inferInsert;
export type ThreedHarvest = typeof threedHarvests.$inferSelect;
export type NewThreedHarvest = typeof threedHarvests.$inferInsert;
export type ThreedTask = typeof threedTasks.$inferSelect;
export type NewThreedTask = typeof threedTasks.$inferInsert;
export type ThreedWeatherLog = typeof threedWeatherLogs.$inferSelect;
export type ThreedFarmbot = typeof threedFarmbots.$inferSelect;
export type ThreedFarmbotLog = typeof threedFarmbotLogs.$inferSelect;


// ============================================
// ## [MM] Schema Updated 2026-05-28 10:00am
// ============================================
