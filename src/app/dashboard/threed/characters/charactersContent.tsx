// src/app/dashboard/threed/characters/charactersContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Info, Move, Volume2, MessageCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ModalConfirm } from '@/components/ui/modal-confirm';

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  animations: string[];
}

interface Character {
  id: number;
  characterId: string;
  name: string;
  description: string;
  type: string;
  status: string;
  modelId: number | null;
  model?: Model;
  animations: string[];
  defaultAnimation: string;
  animationSpeed: number;
  isMovable: boolean;
  movementPattern: string;
  movementRadius: number;
  movementSpeed: number;
  interactable: boolean;
  interactionMessage: string;
  soundEffect: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  scale: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CharactersContent() {
  const { showToast, ToastComponent } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
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
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const [formData, setFormData] = useState({
    characterId: '',
    name: '',
    description: '',
    type: 'animal',
    status: 'active',
    modelId: null as number | null,
    animations: [] as string[],
    defaultAnimation: '',
    animationSpeed: 1.0,
    isMovable: false,
    movementPattern: 'wander',
    movementRadius: 5,
    movementSpeed: 0.5,
    interactable: true,
    interactionMessage: '',
    soundEffect: '',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotation: 0,
    scale: 1.0,
    isActive: true,
  });

  const fetchCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/threed/characters?limit=500&includeModel=true');
      const data = await response.json();
      if (data.success) {
        // Handle potential nested data structure
        let charactersData = data.data;
        if (charactersData.length > 0 && charactersData[0].character) {
          charactersData = charactersData.map((item: any) => item.character);
        }
        setCharacters(charactersData);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load characters', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/threed/models?limit=500');
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { 
    fetchCharacters();
    fetchModels();
  }, [fetchCharacters, fetchModels]);

  useEffect(() => {
    let filtered = [...characters];
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.characterId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredCharacters(filtered);
    setCurrentPage(0);
  }, [characters, searchTerm, typeFilter]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  
  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    return filteredCharacters.slice(start, start + pageSize);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const openEditModal = (character: Character) => {
    setSelectedCharacter(character);
    setFormData({
      characterId: character.characterId,
      name: character.name,
      description: character.description || '',
      type: character.type,
      status: character.status,
      modelId: character.modelId,
      animations: character.animations || [],
      defaultAnimation: character.defaultAnimation || '',
      animationSpeed: character.animationSpeed || 1.0,
      isMovable: character.isMovable || false,
      movementPattern: character.movementPattern || 'wander',
      movementRadius: character.movementRadius || 5,
      movementSpeed: character.movementSpeed || 0.5,
      interactable: character.interactable !== false,
      interactionMessage: character.interactionMessage || '',
      soundEffect: character.soundEffect || '',
      positionX: character.positionX || 0,
      positionY: character.positionY || 0,
      positionZ: character.positionZ || 0,
      rotation: character.rotation || 0,
      scale: character.scale || 1.0,
      isActive: character.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  const handleAddCharacter = async () => {
    try {
      const response = await fetch('/api/threed/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character added successfully', 'success');
        setIsAddModalOpen(false);
        resetForm();
        fetchCharacters();
      } else {
        showToast('Failed to add character', 'error');
      }
    } catch (error) {
      showToast('Failed to add character', 'error');
    }
  };

  const handleUpdateCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(`/api/threed/characters?id=${selectedCharacter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character updated successfully', 'success');
        setIsEditModalOpen(false);
        setSelectedCharacter(null);
        fetchCharacters();
      } else {
        showToast('Failed to update character', 'error');
      }
    } catch (error) {
      showToast('Failed to update character', 'error');
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(`/api/threed/characters?id=${selectedCharacter.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Character deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedCharacter(null);
        fetchCharacters();
      } else {
        showToast('Failed to delete character', 'error');
      }
    } catch (error) {
      showToast('Failed to delete character', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      characterId: '',
      name: '',
      description: '',
      type: 'animal',
      status: 'active',
      modelId: null,
      animations: [],
      defaultAnimation: '',
      animationSpeed: 1.0,
      isMovable: false,
      movementPattern: 'wander',
      movementRadius: 5,
      movementSpeed: 0.5,
      interactable: true,
      interactionMessage: '',
      soundEffect: '',
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      rotation: 0,
      scale: 1.0,
      isActive: true,
    });
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      animal: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700',
      bird: 'bg-sky-100 dark:bg-sky-950/50 text-sky-700',
      insect: 'bg-lime-100 dark:bg-lime-950/50 text-lime-700',
      mythical: 'bg-purple-100 dark:bg-purple-950/50 text-purple-700',
      human: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700',
      robot: 'bg-gray-100 dark:bg-gray-800 text-gray-700',
      decoration: 'bg-pink-100 dark:bg-pink-950/50 text-pink-700',
    };
    return styles[type] || 'bg-gray-100';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-950/50 text-green-700',
      idle: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700',
      sleeping: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700',
      moving: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700',
      hidden: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
    };
    return styles[status] || 'bg-gray-100';
  };

  const currentPageData = getCurrentPageData();
  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Characters</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total characters • Independent entities that can roam freely in your 3D garden
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Character
          </Button>
          
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search characters..."
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
            <option value="animal">Animals</option>
            <option value="bird">Birds</option>
            <option value="insect">Insects</option>
            <option value="mythical">Mythical</option>
            <option value="human">Humans</option>
            <option value="robot">Robots</option>
            <option value="decoration">Decorations</option>
          </select>
          
          <Button size="sm" onClick={fetchCharacters}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{totalRecords}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Movable</p>
            <p className="text-2xl font-bold text-blue-600">{characters.filter(c => c.isMovable).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Animated</p>
            <p className="text-2xl font-bold text-purple-600">{characters.filter(c => c.animations?.length > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Interactable</p>
            <p className="text-2xl font-bold text-green-600">{characters.filter(c => c.interactable).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">With 3D Models</p>
            <p className="text-2xl font-bold text-amber-600">{characters.filter(c => c.modelId).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Model</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Animation</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Movement</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Interaction</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((character) => (
                <React.Fragment key={character.id}>
                  <tr className="hover:bg-muted/50">
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <div className="font-medium cursor-pointer">{character.name}</div>
                      <div className="text-xs text-muted-foreground">{character.characterId}</div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(character.id)}>
                      <Badge className={getTypeBadge(character.type)} variant="secondary">
                        {character.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {character.model ? (
                        <Badge variant="outline">{character.model.modelName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No model</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {character.defaultAnimation ? (
                        <span className="text-xs">{character.defaultAnimation}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {character.isMovable ? (
                        <div className="flex items-center gap-1">
                          <Move className="w-3 h-3 text-blue-600" />
                          <span className="text-xs">{character.movementPattern}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Stationary</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {character.interactable ? (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs">Yes</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(character.status)}`}>
                        {character.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(character)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedCharacter(character);
                          setIsDeleteModalOpen(true);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(character.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          {character.description && (
                            <div>
                              <p className="font-medium">Description</p>
                              <p className="text-muted-foreground">{character.description}</p>
                            </div>
                          )}
                          {character.interactionMessage && (
                            <div>
                              <p className="font-medium">Interaction Message</p>
                              <p className="text-muted-foreground">💬 {character.interactionMessage}</p>
                            </div>
                          )}
                          {character.soundEffect && (
                            <div>
                              <p className="font-medium">Sound Effect</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Volume2 className="w-3 h-3" />
                                {character.soundEffect}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium">Position</p>
                              <p className="text-muted-foreground text-xs">
                                X: {character.positionX}, Y: {character.positionY}, Z: {character.positionZ}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Scale / Rotation</p>
                              <p className="text-muted-foreground text-xs">
                                Scale: {character.scale}x, Rotation: {character.rotation}°
                              </p>
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
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* Add Character Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Character">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Character ID *</Label>
              <Input
                value={formData.characterId}
                onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                placeholder="e.g., BUNNY-001"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lucky the Bunny"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="animal">Animal</option>
                <option value="bird">Bird</option>
                <option value="insect">Insect</option>
                <option value="mythical">Mythical</option>
                <option value="human">Human</option>
                <option value="robot">Robot</option>
                <option value="decoration">Decoration</option>
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="sleeping">Sleeping</option>
                <option value="moving">Moving</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          
          {/* 3D Model Selection */}
          <div>
            <Label>3D Model (Optional)</Label>
            <select
              value={formData.modelId || ''}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">None</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.modelName} ({model.modelType.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Select a 3D model for this character. Characters can roam independently in the garden.
            </p>
          </div>
          
          {/* Position (Absolute coordinates in 3D world) */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold">World Position</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Characters use absolute coordinates in the 3D world (unlike plants which are positioned relative to beds)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>X</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionX}
                  onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Y</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionY}
                  onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Z</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionZ}
                  onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold">Animation</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label>Default Animation</Label>
                <select
                  value={formData.defaultAnimation}
                  onChange={(e) => setFormData({ ...formData, defaultAnimation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="">None</option>
                  <option value="idle">Idle</option>
                  <option value="walk">Walk</option>
                  <option value="run">Run</option>
                  <option value="fly">Fly</option>
                  <option value="dance">Dance</option>
                  <option value="bounce">Bounce</option>
                </select>
              </div>
              <div>
                <Label>Animation Speed</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.animationSpeed}
                  onChange={(e) => setFormData({ ...formData, animationSpeed: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Movement</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMovable"
                  checked={formData.isMovable}
                  onChange={(e) => setFormData({ ...formData, isMovable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isMovable">Enable Movement</Label>
              </div>
            </div>
            
            {formData.isMovable && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label>Pattern</Label>
                  <select
                    value={formData.movementPattern}
                    onChange={(e) => setFormData({ ...formData, movementPattern: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="wander">Wander</option>
                    <option value="patrol">Patrol</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>
                <div>
                  <Label>Radius</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.movementRadius}
                    onChange={(e) => setFormData({ ...formData, movementRadius: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Speed</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.movementSpeed}
                    onChange={(e) => setFormData({ ...formData, movementSpeed: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Interaction</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="interactable"
                  checked={formData.interactable}
                  onChange={(e) => setFormData({ ...formData, interactable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="interactable">Allow Interaction</Label>
              </div>
            </div>
            
            {formData.interactable && (
              <>
                <div className="mt-2">
                  <Label>Interaction Message</Label>
                  <Input
                    value={formData.interactionMessage}
                    onChange={(e) => setFormData({ ...formData, interactionMessage: e.target.value })}
                    placeholder="Click to interact with this character..."
                  />
                </div>
                <div className="mt-2">
                  <Label>Sound Effect (Optional)</Label>
                  <Input
                    value={formData.soundEffect}
                    onChange={(e) => setFormData({ ...formData, soundEffect: e.target.value })}
                    placeholder="/sounds/character.mp3"
                  />
                </div>
              </>
            )}
          </div>
          
          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Character description..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCharacter}>Add Character</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Character">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Character ID</Label>
              <Input
                value={formData.characterId}
                onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="animal">Animal</option>
                <option value="bird">Bird</option>
                <option value="insect">Insect</option>
                <option value="mythical">Mythical</option>
                <option value="human">Human</option>
                <option value="robot">Robot</option>
                <option value="decoration">Decoration</option>
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="sleeping">Sleeping</option>
                <option value="moving">Moving</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          
          {/* 3D Model Selection */}
          <div>
            <Label>3D Model</Label>
            <select
              value={formData.modelId || ''}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">None</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.modelName} ({model.modelType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          
          {/* World Position */}
          <div className="border rounded-lg p-3">
            <Label className="text-base font-semibold">World Position</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <Label>X</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionX}
                  onChange={(e) => setFormData({ ...formData, positionX: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Y</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionY}
                  onChange={(e) => setFormData({ ...formData, positionY: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Z</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.positionZ}
                  onChange={(e) => setFormData({ ...formData, positionZ: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCharacter}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCharacter}
        title="Delete Character"
        message={`Are you sure you want to delete "${selectedCharacter?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}