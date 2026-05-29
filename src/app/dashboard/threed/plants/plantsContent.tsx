// src/app/dashboard/threed/plants/plantsContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Info, Sprout, Flower2, Apple, Leaf } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string;
  variety: string;
  family: string;
  type: string;
  status: string;
  growthHabit: string;
  daysToMaturity: number;
  daysToGermination: number;
  spacingInches: number;
  rowSpacingInches: number;
  plantingDepthInches: number;
  sunlight: string;
  waterNeeds: string;
  description: string;
  careInstructions: string;
  harvestInstructions: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState<Partial<Plant>>({
    type: 'Vegetable',
    status: 'active',
    sunlight: 'Full Sun',
    waterNeeds: 'Medium',
  });

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

  const openEditModal = (plant: Plant) => {
    setSelectedPlant(plant);
    // Remove date fields and other metadata before editing
    const { createdAt, updatedAt, ...cleanPlant } = plant;
    setFormData(cleanPlant);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (plant: Plant) => {
    setSelectedPlant(plant);
    setIsDeleteModalOpen(true);
  };

  // CRUD Handlers
  const handleAddPlant = async () => {
    try {
      const response = await fetch('/api/threed/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Plant added successfully', 'success');
        setIsAddModalOpen(false);
        setFormData({ type: 'Vegetable', status: 'active', sunlight: 'Full Sun', waterNeeds: 'Medium' });
        fetchPlants();
      } else {
        showToast('Failed to add plant', 'error');
      }
    } catch (error) {
      showToast('Failed to add plant', 'error');
    }
  };

  const handleUpdatePlant = async () => {
    if (!selectedPlant) return;
    try {
      // Remove any date fields that might cause issues
      const { createdAt, updatedAt, ...cleanData } = formData;
      
      const response = await fetch(`/api/threed/plants?id=${selectedPlant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Plant updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedPlant(null);
        setFormData({});
        fetchPlants();
      } else {
        showToast('Failed to update plant', 'error');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update plant', 'error');
    }
  };

  const handleDeletePlant = async () => {
    if (!selectedPlant) return;
    try {
      const response = await fetch(`/api/threed/plants?id=${selectedPlant.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Plant deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedPlant(null);
        fetchPlants();
      } else {
        showToast('Failed to delete plant', 'error');
      }
    } catch (error) {
      showToast('Failed to delete plant', 'error');
    }
  };

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
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Plant
          </Button>
          
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
          
          <Button size="sm" onClick={fetchPlants}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
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
                <th className="px-4 py-3 text-left text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((plant) => (
                <React.Fragment key={plant.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(plant.id)}>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(plant.id)}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        {getTypeIcon(plant.type)}
                        <span className="font-medium">{plant.commonName}</span>
                        {plant.scientificName && (
                          <span className="text-xs text-muted-foreground italic">
                            ({plant.scientificName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(plant.id)}>
                      <Badge variant="outline">{plant.type || 'Unknown'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(plant.id)}>
                      {plant.daysToMaturity || 'N/A'} days
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(plant.id)}>
                      {plant.spacingInches || 'N/A'}"
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(plant.id)}>
                      {plant.sunlight || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(plant.id)}>
                      {plant.waterNeeds || 'N/A'}
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(plant.id)}>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(plant.status)}`}>
                        {plant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(plant)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(plant)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(plant.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="px-4 py-3">
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

      {/* Add Plant Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Plant">
        <div className="space-y-4">
          <div>
            <Label>Common Name *</Label>
            <Input
              value={formData.commonName || ''}
              onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
              placeholder="e.g., Roma Tomato"
              required
            />
          </div>
          <div>
            <Label>Scientific Name</Label>
            <Input
              value={formData.scientificName || ''}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
              placeholder="e.g., Solanum lycopersicum"
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              value={formData.type || 'Vegetable'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Herb">Herb</option>
              <option value="Flower">Flower</option>
              <option value="Tree">Tree</option>
            </select>
          </div>
          <div>
            <Label>Days to Maturity</Label>
            <Input
              type="number"
              value={formData.daysToMaturity || ''}
              onChange={(e) => setFormData({ ...formData, daysToMaturity: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Spacing (inches)</Label>
            <Input
              type="number"
              value={formData.spacingInches || ''}
              onChange={(e) => setFormData({ ...formData, spacingInches: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Sunlight</Label>
            <select
              value={formData.sunlight || 'Full Sun'}
              onChange={(e) => setFormData({ ...formData, sunlight: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Full Sun">Full Sun</option>
              <option value="Partial Sun">Partial Sun</option>
              <option value="Partial Shade">Partial Shade</option>
              <option value="Full Shade">Full Shade</option>
            </select>
          </div>
          <div>
            <Label>Water Needs</Label>
            <select
              value={formData.waterNeeds || 'Medium'}
              onChange={(e) => setFormData({ ...formData, waterNeeds: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlant}>Add Plant</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plant Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Plant">
        <div className="space-y-4">
          <div>
            <Label>Common Name *</Label>
            <Input
              value={formData.commonName || ''}
              onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Scientific Name</Label>
            <Input
              value={formData.scientificName || ''}
              onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              value={formData.type || 'Vegetable'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Vegetable">Vegetable</option>
              <option value="Fruit">Fruit</option>
              <option value="Herb">Herb</option>
              <option value="Flower">Flower</option>
            </select>
          </div>
          <div>
            <Label>Days to Maturity</Label>
            <Input
              type="number"
              value={formData.daysToMaturity || ''}
              onChange={(e) => setFormData({ ...formData, daysToMaturity: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Spacing (inches)</Label>
            <Input
              type="number"
              value={formData.spacingInches || ''}
              onChange={(e) => setFormData({ ...formData, spacingInches: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Sunlight</Label>
            <select
              value={formData.sunlight || 'Full Sun'}
              onChange={(e) => setFormData({ ...formData, sunlight: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Full Sun">Full Sun</option>
              <option value="Partial Sun">Partial Sun</option>
              <option value="Partial Shade">Partial Shade</option>
              <option value="Full Shade">Full Shade</option>
            </select>
          </div>
          <div>
            <Label>Water Needs</Label>
            <select
              value={formData.waterNeeds || 'Medium'}
              onChange={(e) => setFormData({ ...formData, waterNeeds: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedPlant(null);
                setFormData({});
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={handleUpdatePlant}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePlant}
        title="Delete Plant"
        message={`Are you sure you want to delete "${selectedPlant?.commonName}"? This action cannot be undone.`}
      />
    </div>
  );
}