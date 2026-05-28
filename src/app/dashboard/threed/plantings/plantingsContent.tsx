// src/app/dashboard/threed/plantings/plantingsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Info, Sprout, Calendar, MapPin, TrendingUp, Activity, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Planting {
  planting: {
    id: number;
    plantingId: string;
    plantId: number;
    bedId: number;
    quantity: number;
    spacingInches: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    plantedDate: string;
    expectedGerminationDate: string;
    expectedHarvestDate: string;
    actualHarvestDate: string;
    status: string;
    growthStage: string;
    health: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  plant: {
    id: number;
    commonName: string;
    scientificName: string;
    type: string;
    daysToMaturity: number;
  };
  bed: {
    id: number;
    name: string;
    shape: string;
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
          ({totalRecords} total plantings)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function PlantingsContent() {
  const { showToast, ToastComponent } = useToast();
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [filteredPlantings, setFilteredPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchPlantings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/plantings?limit=500`);
      const data = await response.json();
      if (data.success) {
        setPlantings(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load plantings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPlantings(); }, [fetchPlantings]);

  useEffect(() => {
    let filtered = [...plantings];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.plant?.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bed?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.planting.status === statusFilter);
    }
    
    if (stageFilter !== 'all') {
      filtered = filtered.filter(p => p.planting.growthStage === stageFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredPlantings(filtered);
    setCurrentPage(0);
  }, [plantings, searchTerm, statusFilter, stageFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredPlantings.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planted': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400';
      case 'growing': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'harvesting': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'harvested': return 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400';
      case 'failed': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'seed': return 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400';
      case 'seedling': return 'bg-lime-100 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400';
      case 'vegetative': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'flowering': return 'bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-400';
      case 'fruiting': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'mature': return 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400';
      case 'good': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'fair': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'poor': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400';
      case 'dead': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plantings</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total plantings • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by plant or bed..."
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
            <option value="planted">Planted</option>
            <option value="growing">Growing</option>
            <option value="harvesting">Harvesting</option>
            <option value="harvested">Harvested</option>
            <option value="failed">Failed</option>
          </select>
          
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Stages</option>
            <option value="seed">Seed</option>
            <option value="seedling">Seedling</option>
            <option value="vegetative">Vegetative</option>
            <option value="flowering">Flowering</option>
            <option value="fruiting">Fruiting</option>
            <option value="mature">Mature</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Plantings</p>
                <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
              </div>
              <Sprout className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Growing</p>
                <p className="text-2xl font-bold text-green-600">{plantings.filter(p => p.planting.status === 'growing').length}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Harvested</p>
                <p className="text-2xl font-bold text-purple-600">{plantings.filter(p => p.planting.status === 'harvested').length}</p>
              </div>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Beds Used</p>
                <p className="text-2xl font-bold text-blue-600">{new Set(plantings.map(p => p.planting.bedId)).size}</p>
              </div>
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Plants in Ground</p>
                <p className="text-2xl font-bold text-amber-600">
                  {plantings.reduce((sum, p) => sum + (p.planting.quantity || 0), 0)}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-amber-600" />
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
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Growth Stage</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Health</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Planted</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.planting.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(item.planting.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{item.plant?.commonName || 'Unknown'}</span>
                      {item.plant?.scientificName && (
                        <span className="text-xs text-muted-foreground italic ml-1">
                          ({item.plant.scientificName})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.bed?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm">{item.planting.quantity || 1} plants</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.planting.status)}`}>
                        {item.planting.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStageBadge(item.planting.growthStage)}`}>
                        {item.planting.growthStage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getHealthBadge(item.planting.health)}`}>
                        {item.planting.health}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(item.planting.plantedDate)}</td>
                  </tr>
                  {expandedRows.has(item.planting.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Notes</p>
                            <p className="text-muted-foreground">{item.planting.notes || 'No notes'}</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Spacing</p>
                              <p className="text-muted-foreground">{item.planting.spacingInches || 'N/A'}"</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Expected Harvest</p>
                              <p className="text-muted-foreground">{formatDate(item.planting.expectedHarvestDate)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">3D Position</p>
                              <p className="text-muted-foreground font-mono text-xs">
                                X: {item.planting.positionX || 0}, Z: {item.planting.positionZ || 0}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Days to Maturity</p>
                              <p className="text-muted-foreground">{item.plant?.daysToMaturity || 'N/A'} days</p>
                            </div>
                          </div>
                          {item.planting.actualHarvestDate && (
                            <div>
                              <p className="font-medium text-foreground">Actual Harvest Date</p>
                              <p className="text-muted-foreground">{formatDate(item.planting.actualHarvestDate)}</p>
                            </div>
                          )}
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
            <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No plantings found</p>
            <p className="text-sm mt-1">Create your first planting to get started</p>
          </div>
        )}
      </Card>
    </div>
  );
}