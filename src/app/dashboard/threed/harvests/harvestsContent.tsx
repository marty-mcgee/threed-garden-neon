// src/app/dashboard/threed/harvests/harvestsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Info, Calendar, Weight, Package, TrendingUp, TrendingDown, Apple } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Harvest {
  harvest: {
    id: number;
    harvestId: string;
    plantingId: number;
    plantId: number;
    quantity: number;
    unit: string;
    weightLbs: number;
    harvestDate: string;
    notes: string;
    imageUrl: string;
    createdAt: string;
  };
  planting: {
    id: number;
    plantingId: string;
  };
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    type: string;
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
          ({totalRecords} total harvests)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function HarvestsContent() {
  const { showToast, ToastComponent } = useToast();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [filteredHarvests, setFilteredHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantFilter, setPlantFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchHarvests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/harvests?limit=500`);
      const data = await response.json();
      if (data.success) {
        setHarvests(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load harvests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchHarvests(); }, [fetchHarvests]);

  useEffect(() => {
    let filtered = [...harvests];
    
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.plant?.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.bed?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (plantFilter !== 'all') {
      filtered = filtered.filter(h => h.plant?.type === plantFilter);
    }
    
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      switch (dateRange) {
        case '7d': cutoffDate.setDate(now.getDate() - 7); break;
        case '30d': cutoffDate.setDate(now.getDate() - 30); break;
        case '90d': cutoffDate.setDate(now.getDate() - 90); break;
        default: cutoffDate = new Date(0);
      }
      filtered = filtered.filter(h => new Date(h.harvest.harvestDate) >= cutoffDate);
    }
    
    setTotalRecords(filtered.length);
    setFilteredHarvests(filtered);
    setCurrentPage(0);
  }, [harvests, searchTerm, plantFilter, dateRange]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredHarvests.slice(start, end);
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
    return new Date(dateString).toLocaleDateString();
  };

  const getUniquePlants = () => {
    const plants = new Map();
    harvests.forEach(h => {
      if (h.plant?.type) {
        plants.set(h.plant.type, (plants.get(h.plant.type) || 0) + 1);
      }
    });
    return Array.from(plants.entries()).map(([type, count]) => ({ type, count }));
  };

  const totalWeight = harvests.reduce((sum, h) => sum + (h.harvest.weightLbs || 0), 0);
  const totalQuantity = harvests.reduce((sum, h) => sum + (h.harvest.quantity || 0), 0);

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Harvests</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total harvests • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search harvests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={plantFilter} 
            onChange={(e) => setPlantFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Plants</option>
            <option value="Vegetable">Vegetables</option>
            <option value="Fruit">Fruits</option>
            <option value="Herb">Herbs</option>
          </select>
          
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Harvests</p>
                <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
              </div>
              <Apple className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold text-green-600">{totalWeight.toFixed(1)} lbs</p>
              </div>
              <Weight className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
              </div>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Avg per Harvest</p>
                <p className="text-2xl font-bold text-purple-600">{(totalWeight / (totalRecords || 1)).toFixed(1)} lbs</p>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
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
                <th className="px-4 py-3 text-left text-xs uppercase">Plant</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Bed</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Weight</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Harvest Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.harvest.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(item.harvest.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.plant?.commonName || 'Unknown'}</span>
                        {item.plant?.type && (
                          <Badge variant="outline" className="text-xs">{item.plant.type}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.bed?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm">{item.harvest.quantity || 1} {item.harvest.unit}s</td>
                    <td className="px-4 py-3 text-sm">{item.harvest.weightLbs ? `${item.harvest.weightLbs.toFixed(1)} lbs` : '—'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(item.harvest.harvestDate)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{item.harvest.unit || 'each'}</td>
                  </tr>
                  {expandedRows.has(item.harvest.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Notes</p>
                            <p className="text-muted-foreground">{item.harvest.notes || 'No notes'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Harvest ID</p>
                              <p className="text-muted-foreground font-mono text-xs">{item.harvest.harvestId}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Recorded</p>
                              <p className="text-muted-foreground">{formatDate(item.harvest.createdAt)}</p>
                            </div>
                          </div>
                          {item.harvest.imageUrl && (
                            <div>
                              <p className="font-medium text-foreground">Image</p>
                              <img src={item.harvest.imageUrl} alt="Harvest" className="mt-1 max-w-xs rounded-lg" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
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
            <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No harvests recorded yet</p>
            <p className="text-sm mt-1">Start tracking your garden yields</p>
          </div>
        )}
      </Card>
    </div>
  );
}