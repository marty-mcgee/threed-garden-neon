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
  // foreignKey,
  // pgSchema,
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
// 1. Plants Master Table
// ============================================
export const plants = pgTable('plants', {
  id: serial('id').primaryKey(),
  plantId: varchar('plant_id', { length: 50 }).unique().notNull(),
  commonName: varchar('common_name', { length: 200 }).notNull(),
  scientificName: varchar('scientific_name', { length: 200 }),
  variety: varchar('variety', { length: 100 }),
  family: varchar('family', { length: 100 }),
  type: varchar('type', { length: 50 }), // Vegetable, Fruit, Herb, Flower, Tree
  growthHabit: varchar('growth_habit', { length: 50 }), // Bush, Vine, Tree, Ground Cover
  sunlight: varchar('sunlight', { length: 50 }), // Full Sun, Partial Shade, Full Shade
  waterNeeds: varchar('water_needs', { length: 50 }), // Low, Medium, High
  soilType: text('soil_type'),
  soilPH: decimal('soil_ph', { precision: 3, scale: 1 }),
  daysToMaturity: integer('days_to_maturity'),
  daysToGermination: integer('days_to_germination'),
  spacingInches: integer('spacing_inches'),
  rowSpacingInches: integer('row_spacing_inches'),
  plantingDepthInches: decimal('planting_depth_inches', { precision: 3, scale: 1 }),
  frostTolerant: boolean('frost_tolerant').default(false),
  perennial: boolean('perennial').default(false),
  hardinessZone: varchar('hardiness_zone', { length: 10 }),
  imageUrl: text('image_url'),
  description: text('description'),
  careInstructions: text('care_instructions'),
  harvestInstructions: text('harvest_instructions'),
  companionPlants: text('companion_plants'), // Comma-separated list or JSON
  avoidPlants: text('avoid_plants'), // Comma-separated list or JSON
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantIdIdx: uniqueIndex('idx_plants_plant_id').on(table.plantId),
  commonNameIdx: index('idx_plants_common_name').on(table.commonName),
  typeIdx: index('idx_plants_type').on(table.type),
}));

// ============================================
// 2. Beds Table (Garden Layout)
// ============================================
export const beds = pgTable('beds', {
  id: serial('id').primaryKey(),
  bedId: varchar('bed_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  widthFeet: decimal('width_feet', { precision: 5, scale: 2 }),
  lengthFeet: decimal('length_feet', { precision: 5, scale: 2 }),
  squareFeet: decimal('square_feet', { precision: 8, scale: 2 }),
  shape: varchar('shape', { length: 50 }).default('rectangle'), // rectangle, square, circle, custom
  soilType: varchar('soil_type', { length: 50 }),
  sunExposure: varchar('sun_exposure', { length: 50 }),
  coordinates: jsonb('coordinates'), // GeoJSON or custom format for 3D positioning
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  rotation: decimal('rotation', { precision: 8, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  bedIdIdx: uniqueIndex('idx_beds_bed_id').on(table.bedId),
  activeIdx: index('idx_beds_active').on(table.isActive),
}));

// ============================================
// 3. Plantings (Plants in specific beds)
// ============================================
export const plantings = pgTable('plantings', {
  id: serial('id').primaryKey(),
  plantingId: varchar('planting_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => plants.id),
  bedId: integer('bed_id').references(() => beds.id),
  quantity: integer('quantity').default(1),
  spacingInches: integer('spacing_inches'),
  positionX: decimal('position_x', { precision: 8, scale: 2 }),
  positionY: decimal('position_y', { precision: 8, scale: 2 }),
  positionZ: decimal('position_z', { precision: 8, scale: 2 }),
  plantedDate: timestamp('planted_date'),
  expectedHarvestDate: timestamp('expected_harvest_date'),
  actualHarvestDate: timestamp('actual_harvest_date'),
  status: varchar('status', { length: 20 }).default('planting'), // planting, growing, harvesting, harvested, failed
  growthStage: varchar('growth_stage', { length: 50 }), // seed, seedling, vegetative, flowering, fruiting, mature
  health: varchar('health', { length: 20 }).default('good'), // excellent, good, fair, poor, dead
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  plantingIdIdx: uniqueIndex('idx_plantings_planting_id').on(table.plantingId),
  plantIdx: index('idx_plantings_plant').on(table.plantId),
  bedIdx: index('idx_plantings_bed').on(table.bedId),
  statusIdx: index('idx_plantings_status').on(table.status),
}));

// ============================================
// 4. Harvests Log
// ============================================
export const harvests = pgTable('harvests', {
  id: serial('id').primaryKey(),
  harvestId: varchar('harvest_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => plantings.id),
  plantId: integer('plant_id').references(() => plants.id),
  quantity: decimal('quantity', { precision: 8, scale: 2 }),
  unit: varchar('unit', { length: 20 }).default('lbs'), // lbs, oz, each, bunch, etc.
  weightLbs: decimal('weight_lbs', { precision: 8, scale: 2 }),
  harvestDate: timestamp('harvest_date').defaultNow(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  harvestIdIdx: uniqueIndex('idx_harvests_harvest_id').on(table.harvestId),
  plantingIdx: index('idx_harvests_planting').on(table.plantingId),
  harvestDateIdx: index('idx_harvests_date').on(table.harvestDate),
}));

// ============================================
// 5. Garden Tasks / To-Do List
// ============================================
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  taskId: varchar('task_id', { length: 50 }).unique().notNull(),
  plantingId: integer('planting_id').references(() => plantings.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }), // water, fertilize, prune, harvest, weed, pest_control
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, urgent
  status: varchar('status', { length: 20 }).default('pending'), // pending, in_progress, completed, cancelled
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  taskIdIdx: uniqueIndex('idx_tasks_task_id').on(table.taskId),
  plantingIdx: index('idx_tasks_planting').on(table.plantingId),
  dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  statusIdx: index('idx_tasks_status').on(table.status),
}));

// ============================================
// 6. Weather / Environmental Data
// ============================================
export const weatherLogs = pgTable('weather_logs', {
  id: serial('id').primaryKey(),
  recordedAt: timestamp('recorded_at').defaultNow(),
  temperature: decimal('temperature', { precision: 5, scale: 1 }),
  humidity: decimal('humidity', { precision: 5, scale: 1 }),
  rainfallInches: decimal('rainfall_inches', { precision: 5, scale: 2 }),
  soilMoisture: decimal('soil_moisture', { precision: 5, scale: 1 }),
  sunlightHours: decimal('sunlight_hours', { precision: 4, scale: 1 }),
  frostWarning: boolean('frost_warning').default(false),
  heatWarning: boolean('heat_warning').default(false),
  rawData: jsonb('raw_data'),
}, (table) => ({
  recordedAtIdx: index('idx_weather_recorded_at').on(table.recordedAt),
}));

// ============================================
// 7. FarmBot Data (if applicable)
// ============================================
export const farmbotLogs = pgTable('farmbot_logs', {
  id: serial('id').primaryKey(),
  loggedAt: timestamp('logged_at').defaultNow(),
  deviceId: varchar('device_id', { length: 100 }),
  eventType: varchar('event_type', { length: 50 }), // watering, planting, sensor, error
  sensorData: jsonb('sensor_data'),
  status: varchar('status', { length: 20 }),
  message: text('message'),
  rawData: jsonb('raw_data'),
}, (table) => ({
  loggedAtIdx: index('idx_farmbot_logged_at').on(table.loggedAt),
  eventTypeIdx: index('idx_farmbot_event_type').on(table.eventType),
}));

// ============================================
// 8. AI Planting Recommendations
// ============================================
export const aiRecommendations = pgTable('ai_recommendations', {
  id: serial('id').primaryKey(),
  recommendationId: varchar('recommendation_id', { length: 50 }).unique().notNull(),
  plantId: integer('plant_id').references(() => plants.id),
  bedId: integer('bed_id').references(() => beds.id),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  reasoning: text('reasoning'),
  suggestedPlantingDate: timestamp('suggested_planting_date'),
  companionSuggestions: text('companion_suggestions'),
  createdAt: timestamp('created_at').defaultNow(),
  applied: boolean('applied').default(false),
  rawData: jsonb('raw_data'),
}, (table) => ({
  recommendationIdIdx: uniqueIndex('idx_ai_recommendation_id').on(table.recommendationId),
}));

// ============================================
// ## [MM] Schema Updated 2026-05-28 08:50am
// ============================================