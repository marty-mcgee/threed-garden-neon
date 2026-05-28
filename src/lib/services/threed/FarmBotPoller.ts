// src/lib/services/threed/FarmBotPoller.ts
import { db } from '@/lib/db/client';
import { threedFarmbots, threedFarmbotLogs } from '@/lib/auth/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class FarmBotPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;
  private apiToken: string;
  private apiUrl: string;
  
  constructor() {
    this.apiToken = process.env.FARMBOT_API_TOKEN || '';
    this.apiUrl = process.env.FARMBOT_API_URL || 'https://my.farmbot.io/api';
    if (!this.apiToken) {
      console.warn('FARMBOT_API_TOKEN not set in environment variables');
    }
  }
  
  // Fetch device info from FarmBot API
  private async fetchDeviceInfo(deviceId: string): Promise<any> {
    if (!this.apiToken) return null;
    
    try {
      const response = await fetch(`${this.apiUrl}/devices/${deviceId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching device ${deviceId}:`, error);
      return null;
    }
  }
  
  // Fetch sensor data from FarmBot API
  private async fetchSensorData(deviceId: string): Promise<any> {
    if (!this.apiToken) return null;
    
    try {
      const response = await fetch(`${this.apiUrl}/devices/${deviceId}/sensors`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching sensor data for ${deviceId}:`, error);
      return null;
    }
  }
  
  // Fetch recent logs from FarmBot API
  private async fetchDeviceLogs(deviceId: string, limit: number = 50): Promise<any[]> {
    if (!this.apiToken) return [];
    
    try {
      const response = await fetch(`${this.apiUrl}/devices/${deviceId}/logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.logs || [];
    } catch (error) {
      console.error(`Error fetching logs for ${deviceId}:`, error);
      return [];
    }
  }
  
  // Update farmbot status based on API response
  async updateFarmbotStatus(farmbotId: number, deviceId: string): Promise<void> {
    const deviceInfo = await this.fetchDeviceInfo(deviceId);
    if (!deviceInfo) return;
    
    const sensorData = await this.fetchSensorData(deviceId);
    const recentLogs = await this.fetchDeviceLogs(deviceId, 10);
    
    // Determine status based on last_seen
    const lastSeen = deviceInfo.last_seen ? new Date(deviceInfo.last_seen) : new Date();
    const now = new Date();
    const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    let status = 'offline';
    if (minutesSinceLastSeen < 5) {
      status = 'online';
    } else if (minutesSinceLastSeen < 15) {
      status = 'maintenance';
    }
    
    // Update farmbot record
    await db
      .update(threedFarmbots)
      .set({
        status,
        lastSeen: lastSeen,
        batteryLevel: deviceInfo.battery_level || null,
        firmwareVersion: deviceInfo.firmware_version || null,
        updatedAt: new Date(),
      })
      .where(eq(threedFarmbots.id, farmbotId));
    
    // Save sensor data as logs
    if (sensorData && sensorData.length > 0) {
      for (const sensor of sensorData) {
        await db.insert(threedFarmbotLogs).values({
          farmbotId,
          eventType: 'sensor',
          status: 'success',
          message: `${sensor.label || 'Sensor'}: ${sensor.value} ${sensor.unit || ''}`,
          sensorData: sensor,
          loggedAt: new Date(sensor.created_at || Date.now()),
          createdAt: new Date(),
        });
      }
    }
    
    // Save recent logs
    for (const log of recentLogs) {
      const existing = await db
        .select()
        .from(threedFarmbotLogs)
        .where(sql`${threedFarmbotLogs.message} = ${log.message} AND ${threedFarmbotLogs.loggedAt} > NOW() - INTERVAL '1 hour'`)
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(threedFarmbotLogs).values({
          farmbotId,
          eventType: log.type || 'info',
          status: log.meta?.type || 'info',
          message: log.message,
          sensorData: log,
          loggedAt: new Date(log.created_at),
          createdAt: new Date(),
        });
      }
    }
    
    console.log(`  ✅ Updated FarmBot ${deviceId}: status=${status}, battery=${deviceInfo.battery_level}%`);
  }
  
  // Send command to FarmBot (e.g., water, move, plant)
  async sendCommand(deviceId: string, command: string, args: any = {}): Promise<any> {
    if (!this.apiToken) {
      console.error('No API token configured');
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, args }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error sending command to ${deviceId}:`, error);
      return null;
    }
  }
  
  // Poll all active farmbots
  async pollAll(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🤖 Starting FarmBot API poll at ${new Date().toISOString()}`);
      
      const farmbots = await db
        .select()
        .from(threedFarmbots)
        .where(sql`${threedFarmbots.isActive} = true`);
      
      console.log(`  Syncing ${farmbots.length} active farmbots...`);
      
      for (const farmbot of farmbots) {
        await this.updateFarmbotStatus(farmbot.id, farmbot.deviceId);
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        farmbotsSynced: farmbots.length,
        duration,
      };
      
      console.log(`✅ FarmBot API poll complete: ${farmbots.length} devices synced in ${duration}ms`);
      
      return {
        success: true,
        stats: this.lastPollStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('FarmBot polling error:', error);
      return { success: false, error: String(error) };
    } finally {
      this.pollingActive = false;
    }
  }
  
  // Send a watering command to a specific farmbot
  async sendWaterCommand(deviceId: string, durationMs: number = 60000): Promise<any> {
    console.log(`💧 Sending water command to ${deviceId} for ${durationMs}ms...`);
    return this.sendCommand(deviceId, 'water', { duration_ms: durationMs });
  }
  
  // Send a move command
  async sendMoveCommand(deviceId: string, x: number, y: number, z: number): Promise<any> {
    console.log(`📍 Sending move command to ${deviceId}: (${x}, ${y}, ${z})`);
    return this.sendCommand(deviceId, 'move_absolute', { location: { x, y, z } });
  }
  
  async getStats() {
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots);
    
    const online = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbots)
      .where(sql`${threedFarmbots.status} = 'online'`);
    
    const activeLogsToday = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(threedFarmbotLogs)
      .where(sql`${threedFarmbotLogs.loggedAt} > NOW() - INTERVAL '24 hours'`);
    
    const recentLogs = await db
      .select()
      .from(threedFarmbotLogs)
      .orderBy(desc(threedFarmbotLogs.loggedAt))
      .limit(10);
    
    return {
      total: total[0]?.count || 0,
      online: online[0]?.count || 0,
      activeLogsLast24h: activeLogsToday[0]?.count || 0,
      recentLogs,
      lastPoll: this.lastPollTime,
      lastPollStats: this.lastPollStats
    };
  }
  
  isPollingActive(): boolean {
    return this.pollingActive;
  }
}