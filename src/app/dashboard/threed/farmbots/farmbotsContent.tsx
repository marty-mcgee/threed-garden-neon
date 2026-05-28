// src/app/dashboard/threed/farmbots/farmbotsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Info, Wifi, WifiOff, Battery, Thermometer, Droplets, Activity, Cpu, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FarmBot {
  farmbot: {
    id: number;
    deviceId: string;
    name: string;
    status: string;
    bedId: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    lastSeen: string;
    batteryLevel: number;
    firmwareVersion: string;
    isActive: boolean;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  bed: {
    id: number;
    name: string;
  };
}

function PaginationControls({ currentPage, totalPages, totalRecords, pageSize, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  totalRecords: number; 
  pageSize: number; 
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/30">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage + 1} of {totalPages}
        <span className="hidden sm:inline ml-2">
          ({totalRecords} total farmbots)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function FarmBotsContent() {
  const { showToast, ToastComponent } = useToast();
  const [farmbots, setFarmbots] = useState<FarmBot[]>([]);
  const [filteredFarmbots, setFilteredFarmbots] = useState<FarmBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchFarmbots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/farmbots?limit=500`);
      const data = await response.json();
      if (data.success) {
        setFarmbots(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load farmbots', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/threed/farmbots/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const pollFarmbots = async () => {
    setIsPolling(true);
    try {
      const response = await fetch('/api/threed/farmbots/poll');
      const data = await response.json();
      if (data.success) {
        await fetchFarmbots();
        await fetchStats();
        showToast(`FarmBot sync complete! ${data.stats?.farmbotsChecked || 0} devices updated`, 'success');
      } else {
        showToast('FarmBot poll failed', 'error');
      }
    } catch (err) {
      showToast('FarmBot poll failed', 'error');
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => { 
    fetchFarmbots(); 
    fetchStats();
  }, [fetchFarmbots, fetchStats]);

  useEffect(() => {
    let filtered = [...farmbots];
    
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.farmbot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmbot.deviceId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.farmbot.status === statusFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredFarmbots(filtered);
    setCurrentPage(0);
  }, [farmbots, searchTerm, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredFarmbots.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'offline': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'error': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FarmBots</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total farmbots • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search farmbots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          <Button size="sm" onClick={pollFarmbots} disabled={isPolling}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />
            {isPolling ? 'Syncing...' : 'Sync FarmBots'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
              </div>
              <Cpu className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats?.online || 0}</p>
              </div>
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-gray-500">{stats?.offline || 0}</p>
              </div>
              <WifiOff className="w-5 h-5 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Active Logs (24h)</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.activeLogsLast24h || 0}</p>
              </div>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Device ID</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Bed</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Last Seen</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.farmbot.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(item.farmbot.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.farmbot.status)}
                        <span className="font-medium">{item.farmbot.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{item.farmbot.deviceId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.farmbot.status)}`}>
                        {item.farmbot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.bed?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.farmbot.lastSeen ? formatDate(item.farmbot.lastSeen) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Battery className="w-4 h-4" />
                        <span className="text-sm">{item.farmbot.batteryLevel || '—'}%</span>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(item.farmbot.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium text-foreground">Firmware Version</p>
                              <p className="text-muted-foreground">{item.farmbot.firmwareVersion || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">3D Position</p>
                              <p className="text-muted-foreground font-mono text-xs">
                                X: {item.farmbot.positionX || 0}, Y: {item.farmbot.positionY || 0}, Z: {item.farmbot.positionZ || 0}
                              </p>
                            </div>
                          </div>
                          {item.farmbot.notes && (
                            <div>
                              <p className="font-medium text-foreground">Notes</p>
                              <p className="text-muted-foreground">{item.farmbot.notes}</p>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">Created</p>
                            <p className="text-muted-foreground">{formatDate(item.farmbot.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                    </table>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        )}
        
        {totalRecords === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No farmbots configured</p>
            <p className="text-sm mt-1">Add a FarmBot device to get started</p>
          </div>
        )}
      </Card>

      {/* Recent Activity Logs */}
      {stats?.recentLogs?.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {stats.recentLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{new Date(log.loggedAt).toLocaleString()}</span>
                  <span className="font-medium">{log.eventType}</span>
                  <span className="text-muted-foreground">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}