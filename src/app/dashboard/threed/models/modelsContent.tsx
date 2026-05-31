// src/app/dashboard/threed/models/modelsContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ModelPreview } from '@/components/threed/ModelPreview';
import {
  Upload,
  Trash2,
  Edit,
  Eye,
  Star,
  FolderOpen,
  FileImage,
  File,
  X,
  Plus,
  Archive,
  Download,
  Refresh,
  Sparkles,
  Users,
  Flower2,
  Bug,
} from 'lucide-react';

interface ModelFile {
  id: number;
  modelId: number;
  fileName: string;
  fileType: string;
  textureType?: string;
  filePath: string;
  fileSize: number;
  isBinaryBuffer: boolean;
  loadOrder: number;
  createdAt: string;
}

interface Model {
  id: number;
  plantId: number;
  modelName: string;
  modelType: string;
  filePath: string;
  fileSize: number;
  scale: string;
  rotationY: string;
  offsetX: string;
  offsetY: string;
  offsetZ: string;
  hasLOD: boolean;
  lodLevels: any;
  animations: string[];
  defaultAnimation: string | null;
  hasExternalFiles: boolean;
  textureCount: number;
  isActive: boolean;
  isDefault: boolean;
  usedByPlants: boolean;
  usedByCharacters: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  files?: ModelFile[];
  mainModelFile?: ModelFile;
  textures?: ModelFile[];
  binaries?: ModelFile[];
  plant?: {
    id: number;
    commonName: string;
    scientificName: string;
    plantId: string;
  };
}

interface Plant {
  id: number;
  plantId: string;
  commonName: string;
  scientificName: string;
  type: string;
}

interface Character {
  id: number;
  characterId: string;
  name: string;
  description: string;
  type: string;
}

interface UploadFileSet {
  mainModel: File | null;
  textures: File[];
  binaries: File[];
}

export default function ModelsContent() {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  
  // Association type: 'plant', 'character', or 'none'
  const [associationType, setAssociationType] = useState<'plant' | 'character' | 'none'>('plant');
  
  // Form state
  const [formData, setFormData] = useState({
    plantId: '',
    characterId: '',
    modelName: '',
    modelType: 'glb',
    scale: '1.0',
    rotationY: '0',
    offsetX: '0',
    offsetY: '0',
    offsetZ: '0',
    isDefault: false,
    hasLOD: false,
    animations: '[]',
    defaultAnimation: '',
    metadata: '{}',
  });
  
  const [uploadFiles, setUploadFiles] = useState<UploadFileSet>({
    mainModel: null,
    textures: [],
    binaries: [],
  });

  // Fetch models, plants, and characters on load
  useEffect(() => {
    fetchModels();
    fetchPlants();
    fetchCharacters();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/threed/models?limit=100');
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      } else {
        showToast('Failed to load models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      showToast('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await fetch('/api/threed/plants?limit=1000&includeModel=false');
      const data = await response.json();
      if (data.success) {
        // Handle nested data structure if needed
        let plantsData = data.data;
        if (plantsData.length > 0 && plantsData[0].plant) {
          plantsData = plantsData.map((item: any) => item.plant);
        }
        setPlants(plantsData);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/threed/characters?limit=1000');
      const data = await response.json();
      if (data.success) {
        let charactersData = data.data;
        if (charactersData.length > 0 && charactersData[0].character) {
          charactersData = charactersData.map((item: any) => item.character);
        }
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const handleMainModelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.gltf', '.glb', '.fbx', '.obj'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) {
        showToast(`Main model must be GLTF, GLB, FBX, or OBJ format`);
        return;
      }
      setUploadFiles(prev => ({ ...prev, mainModel: file }));
      setFormData(prev => ({ ...prev, modelName: file.name.replace(extension, '') }));
    }
  };

  const handleTextureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const validFiles = files.filter(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(extension);
    });
    
    if (validFiles.length !== files.length) {
      showToast('Some files were skipped. Textures must be JPG, PNG, or WEBP format.');
    }
    
    setUploadFiles(prev => ({ 
      ...prev, 
      textures: [...prev.textures, ...validFiles] 
    }));
  };

  const handleBinarySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validExtensions = ['.bin'];
    const validFiles = files.filter(file => {
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(extension);
    });
    
    setUploadFiles(prev => ({ 
      ...prev, 
      binaries: [...prev.binaries, ...validFiles] 
    }));
  };

  const removeTexture = (index: number) => {
    setUploadFiles(prev => ({
      ...prev,
      textures: prev.textures.filter((_, i) => i !== index)
    }));
  };

  const removeBinary = (index: number) => {
    setUploadFiles(prev => ({
      ...prev,
      binaries: prev.binaries.filter((_, i) => i !== index)
    }));
  };

  const handleUpload = async () => {
    if (!uploadFiles.mainModel) {
      showToast('Please select a main model file');
      return;
    }

    if (associationType === 'plant' && !formData.plantId) {
      showToast('Please select a plant for this model');
      return;
    }

    if (associationType === 'character' && !formData.characterId) {
      showToast('Please select a character for this model');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    
    // Add all files
    uploadFormData.append('files', uploadFiles.mainModel);
    uploadFiles.textures.forEach(file => {
      uploadFormData.append('files', file);
    });
    uploadFiles.binaries.forEach(file => {
      uploadFormData.append('files', file);
    });
    
    // Add metadata based on association type
    if (associationType === 'plant') {
      uploadFormData.append('plantId', formData.plantId);
      uploadFormData.append('isDefault', formData.isDefault.toString());
    } else if (associationType === 'character') {
      uploadFormData.append('characterId', formData.characterId);
    }
    
    uploadFormData.append('modelName', formData.modelName);
    uploadFormData.append('modelType', formData.modelType);
    uploadFormData.append('associationType', associationType);
    uploadFormData.append('scale', formData.scale);
    uploadFormData.append('rotationY', formData.rotationY);
    uploadFormData.append('offsetX', formData.offsetX);
    uploadFormData.append('offsetY', formData.offsetY);
    uploadFormData.append('offsetZ', formData.offsetZ);
    uploadFormData.append('hasLOD', formData.hasLOD.toString());
    uploadFormData.append('animations', formData.animations);
    uploadFormData.append('defaultAnimation', formData.defaultAnimation);
    uploadFormData.append('metadata', formData.metadata);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/threed/models', {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      if (data.success) {
        const associationText = associationType === 'plant' ? 'plant' : associationType === 'character' ? 'character' : 'no entity';
        showToast(`Model uploaded successfully and associated with ${associationText}!`);
        setIsUploadDialogOpen(false);
        resetForm();
        fetchModels();
      } else {
        showToast(data.error || 'Failed to upload model');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload model');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          scale: formData.scale,
          rotationY: formData.rotationY,
          offsetX: formData.offsetX,
          offsetY: formData.offsetY,
          offsetZ: formData.offsetZ,
          isDefault: formData.isDefault,
          hasLOD: formData.hasLOD,
          animations: JSON.parse(formData.animations),
          defaultAnimation: formData.defaultAnimation || null,
          isActive: true,
          metadata: JSON.parse(formData.metadata),
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model updated successfully');
        setIsEditDialogOpen(false);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to update model');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update model');
    }
  };

  const handleDelete = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Model deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to delete model');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete model');
    }
  };

  const handleSetDefault = async (model: Model) => {
    try {
      const response = await fetch(`/api/threed/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(`${model.modelName} is now the default model`);
        fetchModels();
      } else {
        showToast(data.error || 'Failed to set default model');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      showToast('Failed to set default model');
    }
  };

  const resetForm = () => {
    setFormData({
      plantId: '',
      characterId: '',
      modelName: '',
      modelType: 'glb',
      scale: '1.0',
      rotationY: '0',
      offsetX: '0',
      offsetY: '0',
      offsetZ: '0',
      isDefault: false,
      hasLOD: false,
      animations: '[]',
      defaultAnimation: '',
      metadata: '{}',
    });
    setUploadFiles({
      mainModel: null,
      textures: [],
      binaries: [],
    });
    setAssociationType('plant');
  };

  const openEditDialog = (model: Model) => {
    setSelectedModel(model);
    setFormData({
      plantId: model.plantId?.toString() || '',
      characterId: '',
      modelName: model.modelName,
      modelType: model.modelType,
      scale: model.scale,
      rotationY: model.rotationY,
      offsetX: model.offsetX,
      offsetY: model.offsetY,
      offsetZ: model.offsetZ,
      isDefault: model.isDefault,
      hasLOD: model.hasLOD,
      animations: JSON.stringify(model.animations),
      defaultAnimation: model.defaultAnimation || '',
      metadata: JSON.stringify(model.metadata, null, 2),
    });
    setIsEditDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlantName = (plantId?: number) => {
    if (!plantId) return 'None';
    const plant = plants.find(p => p.id === plantId);
    return plant ? `${plant.commonName}` : `Plant ID: ${plantId}`;
  };

  const getTextureTypeIcon = (textureType?: string) => {
    switch(textureType) {
      case 'normalMap': return '🔵';
      case 'roughness': return '⚫';
      case 'metallic': return '⚪';
      case 'emissive': return '💡';
      case 'occlusion': return '🌑';
      default: return '🎨';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">3D Models Library</h2>
          <p className="text-muted-foreground mt-1">
            Manage GLTF/GLB/FBX models for your garden plants and characters
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload 3D Model</DialogTitle>
              <DialogDescription>
                Upload your main GLTF/GLB/FBX model along with any texture and binary files
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Association Type Selection */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Associate With</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssociationType('plant')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'plant' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Flower2 className="w-4 h-4" />
                    <span className="text-sm">Plant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociationType('character')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'character' 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Character</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssociationType('none')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      associationType === 'none' 
                        ? 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">None</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {associationType === 'plant' && 'Associate this model with a plant. It can be used as the plant\'s 3D representation.'}
                  {associationType === 'character' && 'Associate this model with a character. Characters can have animations and movement.'}
                  {associationType === 'none' && 'Store this model without associating it to any plant or character yet.'}
                </p>
              </div>

              {/* Plant Selection (if association type is plant) */}
              {associationType === 'plant' && (
                <div className="space-y-2 border rounded-lg p-4">
                  <Label className="text-base font-semibold">Select Plant *</Label>
                  <Select
                    value={formData.plantId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plantId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id.toString()}>
                          {plant.commonName} - {plant.scientificName || 'No scientific name'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault">Set as default model for this plant</Label>
                  </div>
                </div>
              )}

              {/* Character Selection (if association type is character) */}
              {associationType === 'character' && (
                <div className="space-y-2 border rounded-lg p-4">
                  <Label className="text-base font-semibold">Select Character *</Label>
                  <Select
                    value={formData.characterId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, characterId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={character.id.toString()}>
                          {character.name} ({character.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Characters can have animations, movement patterns, and interactions.
                  </p>
                </div>
              )}

              {/* Main Model File */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Main Model File *</Label>
                <Input
                  type="file"
                  accept=".gltf,.glb,.fbx,.obj"
                  onChange={handleMainModelSelect}
                  className="cursor-pointer"
                />
                {uploadFiles.mainModel && (
                  <p className="text-sm text-green-600">
                    ✓ {uploadFiles.mainModel.name} ({formatFileSize(uploadFiles.mainModel.size)})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload your main model file (GLTF, GLB, FBX, or OBJ format)
                </p>
              </div>

              {/* Model Name */}
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                  placeholder="Enter model name"
                />
              </div>

              {/* Texture Files */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Texture Files (Optional)</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleTextureSelect}
                  className="cursor-pointer"
                />
                {uploadFiles.textures.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-medium">Selected textures:</p>
                    {uploadFiles.textures.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>📷 {file.name} ({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTexture(idx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload texture files (base color, normal maps, roughness, metallic, emissive, occlusion)
                </p>
              </div>

              {/* Binary Files */}
              <div className="space-y-2 border rounded-lg p-4">
                <Label className="text-base font-semibold">Binary Files (Optional)</Label>
                <Input
                  type="file"
                  accept=".bin"
                  multiple
                  onChange={handleBinarySelect}
                  className="cursor-pointer"
                />
                {uploadFiles.binaries.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="text-sm font-medium">Selected binary files:</p>
                    {uploadFiles.binaries.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>🔧 {file.name} ({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBinary(idx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload binary buffer files (.bin) if your model uses external buffers
                </p>
              </div>

              <Tabs defaultValue="transform" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transform">Transform</TabsTrigger>
                  <TabsTrigger value="animation">Animation</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transform" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scale</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.scale}
                        onChange={(e) => setFormData(prev => ({ ...prev, scale: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation Y (degrees)</Label>
                      <Input
                        type="number"
                        step="15"
                        value={formData.rotationY}
                        onChange={(e) => setFormData(prev => ({ ...prev, rotationY: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset X</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetX}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetX: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset Y</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetY}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetY: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset Z</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.offsetZ}
                        onChange={(e) => setFormData(prev => ({ ...prev, offsetZ: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="animation" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Animations (JSON array)</Label>
                    <Textarea
                      value={formData.animations}
                      onChange={(e) => setFormData(prev => ({ ...prev, animations: e.target.value }))}
                      placeholder='["idle", "walk", "run"]'
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Animation</Label>
                    <Input
                      value={formData.defaultAnimation}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultAnimation: e.target.value }))}
                      placeholder="idle"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasLOD"
                      checked={formData.hasLOD}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasLOD: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="hasLOD">Has Level of Detail (LOD)</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Metadata (JSON)</Label>
                    <Textarea
                      value={formData.metadata}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                      placeholder='{"author": "Name", "license": "CC-BY"}'
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFiles.mainModel || uploading}>
                {uploading ? 'Uploading...' : 'Upload Model'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Models Table (rest of your table remains the same) */}
      {/* ... rest of the component ... */}
    </div>
  );
}