// src/app/dashboard/threed/plants/plantsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Info, Sprout, Flower2, Apple, Leaf } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string;
  type: string;
  status: string;
  daysToMaturity: number;
  spacingInches: number;
  sunlight: string;
  waterNeeds: string;
  description: string;
  careInstructions: string;
  imageUrl: string;
  createdAt: string;
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
          ({totalRecords} total plants)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function PlantsContent() {
  const { showToast, ToastComponent } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/plants?limit=500`);
      const data = await response.json();
      if (data.success) {
        setPlants(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load plants', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  useEffect(() => {
    let filtered = [...plants];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.scientificName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredPlants(filtered);
    setCurrentPage(0);
  }, [plants, searchTerm, typeFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredPlants.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'vegetable': return <Apple className="w-4 h-4 text-green-600" />;
      case 'herb': return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'fruit': return <Apple className="w-4 h-4 text-red-600" />;
      case 'flower': return <Flower2 className="w-4 h-4 text-pink-600" />;
      default: return <Leaf className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'inactive': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'archived': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      default: return 'bg-gray-100';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plant Database</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total plants • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Types</option>
            <option value="Vegetable">Vegetables</option>
            <option value="Herb">Herbs</option>
            <option value="Fruit">Fruits</option>
            <option value="Flower">Flowers</option>
            <option value="Tree">Trees</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Plants</p>
                <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
              </div>
              <Leaf className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Vegetables</p>
                <p className="text-2xl font-bold text-green-600">{plants.filter(p => p.type === 'Vegetable').length}</p>
              </div>
              <Apple className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Herbs</p>
                <p className="text-2xl font-bold text-emerald-600">{plants.filter(p => p.type === 'Herb').length}</p>
              </div>
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-600">{plants.filter(p => p.status === 'active').length}</p>
              </div>
              <Eye className="w-5 h-5 text-blue-600" />
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
                <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Days to Maturity</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Spacing</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Sunlight</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Water</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((plant) => (
                <React.Fragment key={plant.id}>
                  <tr className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleRowExpansion(plant.id)}>
                    <td className="px-4 py-3"><Info className="w-4 h-4 text-muted-foreground" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(plant.type)}
                        <span className="font-medium">{plant.commonName}</span>
                        {plant.scientificName && (
                          <span className="text-xs text-muted-foreground italic">
                            ({plant.scientificName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{plant.type || 'Unknown'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{plant.daysToMaturity || 'N/A'} days</td>
                    <td className="px-4 py-3 text-sm">{plant.spacingInches || 'N/A'}"</td>
                    <td className="px-4 py-3 text-sm">{plant.sunlight || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{plant.waterNeeds || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(plant.status)}`}>
                        {plant.status}
                      </span>
                    </td>
                  </tr>
                  {expandedRows.has(plant.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Description</p>
                            <p className="text-muted-foreground">{plant.description || 'No description available'}</p>
                          </div>
                          {plant.careInstructions && (
                            <div>
                              <p className="font-medium text-foreground">Care Instructions</p>
                              <p className="text-muted-foreground">{plant.careInstructions}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Row Spacing</p>
                              <p className="text-muted-foreground">{plant.rowSpacingInches || 'N/A'}"</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Planting Depth</p>
                              <p className="text-muted-foreground">{plant.plantingDepthInches || 'N/A'}"</p>
                            </div>
                          </div>
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
            <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No plants found</p>
            <p className="text-sm mt-1">Add plants to your database to get started</p>
          </div>
        )}
      </Card>
    </div>
  );
}