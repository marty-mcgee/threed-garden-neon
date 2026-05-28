// src/lib/services/threed/FarmBotPoller.ts
import { db } from '@/lib/db/client';
import { threedFarmbots, threedFarmbotLogs } from '@/lib/auth/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class FarmBotPoller {
  private pollingActive = false;
  private lastPollTime: Date | null = null;
  private lastPollStats: any = null;
  
  // Update farmbot status based on last seen time
  async updateStatus(farmbotId: number): Promise<void> {
    const farmbot = await db
      .select()
      .from(threedFarmbots)
      .where(eq(threedFarmbots.id, farmbotId))
      .limit(1);
    
    if (!farmbot.length) return;
    
    const lastSeen = farmbot[0].lastSeen;
    const now = new Date();
    const minutesSinceLastSeen = lastSeen ? (now.getTime() - new Date(lastSeen).getTime()) / (1000 * 60) : 999;
    
    let newStatus = farmbot[0].status;
    
    if (minutesSinceLastSeen > 30) {
      newStatus = 'offline';
    } else if (minutesSinceLastSeen > 10) {
      newStatus = 'maintenance';
    } else {
      newStatus = 'online';
    }
    
    if (newStatus !== farmbot[0].status) {
      await db
        .update(threedFarmbots)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(threedFarmbots.id, farmbotId));
      
      console.log(`  FarmBot ${farmbot[0].name} status updated: ${farmbot[0].status} → ${newStatus}`);
    }
  }
  
  // Record a log entry for a farmbot
  async addLog(farmbotId: number, eventType: string, status: string, message: string, sensorData?: any): Promise<void> {
    await db.insert(threedFarmbotLogs).values({
      farmbotId,
      eventType,
      status,
      message,
      sensorData: sensorData || null,
      loggedAt: new Date(),
      createdAt: new Date(),
    });
  }
  
  // Get farmbot statistics
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
  
  async pollAll(): Promise<{ success: boolean; stats?: any; error?: string }> {
    if (this.pollingActive) {
      return { success: false, error: 'Polling already in progress' };
    }
    
    this.pollingActive = true;
    const startTime = Date.now();
    
    try {
      console.log(`\n🤖 Starting FarmBot poll at ${new Date().toISOString()}`);
      
      const farmbots = await db
        .select()
        .from(threedFarmbots)
        .where(sql`${threedFarmbots.isActive} = true`);
      
      console.log(`  Checking ${farmbots.length} active farmbots...`);
      
      for (const farmbot of farmbots) {
        await this.updateStatus(farmbot.id);
        
        // Simulate sensor data (in production, this would call the actual FarmBot API)
        const mockSensorData = {
          temperature: 72 + Math.random() * 10,
          moisture: 40 + Math.random() * 40,
          battery: 85 + Math.random() * 15,
        };
        
        await this.addLog(
          farmbot.id,
          'sensor',
          'success',
          `Sensor reading: ${mockSensorData.temperature.toFixed(1)}°F, ${mockSensorData.moisture.toFixed(0)}% moisture`,
          mockSensorData
        );
      }
      
      const duration = Date.now() - startTime;
      this.lastPollTime = new Date();
      this.lastPollStats = { 
        farmbotsChecked: farmbots.length,
        duration,
      };
      
      console.log(`✅ FarmBot poll complete: ${farmbots.length} farmbots updated`);
      
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
  
  isPollingActive(): boolean {
    return this.pollingActive;
  }
}