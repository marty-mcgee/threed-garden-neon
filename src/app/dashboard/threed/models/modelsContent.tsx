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
  RefreshCw,
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

interface UploadFileSet {
  mainModel: File | null;
  textures: File[];
  binaries: File[];
}

export default function ModelsContent() {
  const { showToast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
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
  
  // Form state
  const [formData, setFormData] = useState({
    plantId: '',
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

  // Fetch models and plants on load
  useEffect(() => {
    fetchModels();
    fetchPlants();
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
      const response = await fetch('/api/threed/plants?limit=1000');
      const data = await response.json();
      if (data.success) {
        setPlants(data.data);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const handleMainModelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.gltf', '.glb', '.fbx', '.obj'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) {
        showToast(`Main model must be GLTF or GLB format`);
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
    if (!uploadFiles.mainModel || !formData.plantId) {
      showToast('Please select a main model file and plant');
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
    
    // Add metadata
    uploadFormData.append('plantId', formData.plantId);
    uploadFormData.append('modelName', formData.modelName);
    uploadFormData.append('modelType', formData.modelType);
    uploadFormData.append('scale', formData.scale);
    uploadFormData.append('rotationY', formData.rotationY);
    uploadFormData.append('offsetX', formData.offsetX);
    uploadFormData.append('offsetY', formData.offsetY);
    uploadFormData.append('offsetZ', formData.offsetZ);
    uploadFormData.append('isDefault', formData.isDefault.toString());
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
        showToast(`Model uploaded successfully with ${data.data.fileCount} files!`);
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

  const handleAddFilesToModel = async () => {
    if (!selectedModel) return;
    
    const hasFilesToAdd = uploadFiles.textures.length > 0 || uploadFiles.binaries.length > 0;
    if (!hasFilesToAdd) {
      showToast('Please select at least one texture or binary file to add');
      return;
    }

    setAddingFiles(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    
    // Add only textures and binaries (not main model)
    uploadFiles.textures.forEach(file => {
      uploadFormData.append('files', file);
    });
    uploadFiles.binaries.forEach(file => {
      uploadFormData.append('files', file);
    });
    
    uploadFormData.append('modelId', selectedModel.id.toString());

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/threed/models/${selectedModel.id}/files`, {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        showToast(`Upload failed: ${response.status} ${response.statusText}`);
        setAddingFiles(false);
        return;
      }

      const data = await response.json();
      setUploadProgress(100);

      if (data.success) {
        showToast(`Added ${uploadFiles.textures.length + uploadFiles.binaries.length} files to model!`);
        
        // Reset file selection
        setUploadFiles(prev => ({
          ...prev,
          textures: [],
          binaries: [],
        }));
        
        // IMPORTANT: Refresh the specific model data to get updated files
        await refreshModelData(selectedModel.id);
        
        // Also refresh the main models list
        await fetchModels();
        
      } else {
        showToast(data.error || 'Failed to add files');
      }
    } catch (error) {
      console.error('Add files error:', error);
      showToast('Failed to add files: ' + error.message);
    } finally {
      setAddingFiles(false);
      setUploadProgress(0);
    }
  };

  // Add this new function to refresh a single model's data
  const refreshModelData = async (modelId: number) => {
    try {
      const response = await fetch(`/api/threed/models/${modelId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedModel(data.data);
      }
    } catch (error) {
      console.error('Error refreshing model data:', error);
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!selectedModel) return;
    
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const response = await fetch(`/api/threed/models/${selectedModel.id}/files/${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Deleted ${fileName}`);
        fetchModels();
        // Refresh selected model data
        const updatedModel = models.find(m => m.id === selectedModel.id);
        if (updatedModel) {
          setSelectedModel(updatedModel);
        }
      } else {
        showToast(data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      showToast('Failed to delete file');
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
  };

  const openEditDialog = async (model: Model) => {
    // Fetch fresh model data including all files
    try {
      const response = await fetch(`/api/threed/models/${model.id}`);
      const data = await response.json();
      if (data.success) {
        const freshModel = data.data;
        setSelectedModel(freshModel);
        setFormData({
          plantId: freshModel.plantId.toString(),
          modelName: freshModel.modelName,
          modelType: freshModel.modelType,
          scale: freshModel.scale,
          rotationY: freshModel.rotationY,
          offsetX: freshModel.offsetX,
          offsetY: freshModel.offsetY,
          offsetZ: freshModel.offsetZ,
          isDefault: freshModel.isDefault,
          hasLOD: freshModel.hasLOD,
          animations: JSON.stringify(freshModel.animations),
          defaultAnimation: freshModel.defaultAnimation || '',
          metadata: JSON.stringify(freshModel.metadata, null, 2),
        });
      }
    } catch (error) {
      console.error('Error fetching model details:', error);
      // Fallback to passed model data
      setSelectedModel(model);
      setFormData({
        plantId: model.plantId.toString(),
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
    }
    
    // Reset file uploads when opening edit dialog
    setUploadFiles({
      mainModel: null,
      textures: [],
      binaries: [],
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

  const getPlantName = (plantId: number) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? `${plant.commonName} (${plant.scientificName})` : `Plant ID: ${plantId}`;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">3D Models Library</h2>
          <p className="text-muted-foreground mt-1">
            Manage GLTF/GLB models and their associated textures for your garden plants
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
                Upload your main GLTF/GLB model along with any texture and binary files
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Plant Selection */}
              <div className="space-y-2">
                <Label>Plant *</Label>
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
                        {plant.commonName} - {plant.scientificName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  Upload your main GLTF or GLB model file
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
                  Upload binary buffer files (.bin) if your GLTF model uses external buffers
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
                      placeholder='["idle", "sway", "grow"]'
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
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault">Set as default model for this plant</Label>
                  </div>
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
              <Button onClick={handleUpload} disabled={!uploadFiles.mainModel || !formData.plantId || uploading}>
                {uploading ? 'Uploading...' : 'Upload Model'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your 3D Models</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No models uploaded</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by uploading your first 3D model
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Model
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Name</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Scale</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.modelName}</TableCell>
                      <TableCell>{getPlantName(model.plantId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.modelType.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>📦 1</span>
                          {model.textureCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileImage className="h-3 w-3" />
                              {model.textureCount}
                            </span>
                          )}
                          {model.binaries && model.binaries.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Archive className="h-3 w-3" />
                              {model.binaries.length}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1"
                            onClick={() => {
                              setSelectedModel(model);
                              setIsFilesDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(model.fileSize)}</TableCell>
                      <TableCell>{model.scale}x</TableCell>
                      <TableCell>
                        <Badge variant={model.isActive ? "default" : "secondary"}>
                          {model.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {model.isDefault ? (
                          <Badge className="bg-yellow-500">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(model)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedModel(model);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(model)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedModel(model);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog with File Management */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Model: {selectedModel?.modelName}</DialogTitle>
            <DialogDescription>
              Update model properties and manage associated files
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="files">Files ({selectedModel?.files?.length || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="properties" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                />
              </div>

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
                  <Label>Rotation Y</Label>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editIsDefault">Set as default model for this plant</Label>
              </div>

              <div className="space-y-2">
                <Label>Animations (JSON array)</Label>
                <Textarea
                  value={formData.animations}
                  onChange={(e) => setFormData(prev => ({ ...prev, animations: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Animation</Label>
                <Input
                  value={formData.defaultAnimation}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultAnimation: e.target.value }))}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="space-y-4 py-4">

              {/* Add this button next to the "Existing Files" label */}
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">Existing Files</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedModel && refreshModelData(selectedModel.id)}
                  disabled={!selectedModel}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>


              {/* Existing Files */}
              {selectedModel?.files && selectedModel.files.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Existing Files</Label>
                  {selectedModel.files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {file.fileType === 'model' && <span>🎯</span>}
                          {file.fileType === 'texture' && <span>{getTextureTypeIcon(file.textureType)}</span>}
                          {file.fileType === 'binary' && <span>🔧</span>}
                          <div>
                            <p className="text-sm font-medium">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileType} • {formatFileSize(file.fileSize)} • 
                              {file.fileType === 'texture' && ` ${file.textureType || 'baseColor'}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.filePath, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          {file.fileType !== 'model' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id, file.fileName)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No files associated with this model</p>
              )}

              {/* Add New Files Section */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-base font-semibold mb-2 block">Add New Files</Label>
                
                {/* Add Textures */}
                <div className="space-y-2 border rounded-lg p-4 mb-3">
                  <Label>Add Texture Files</Label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleTextureSelect}
                    className="cursor-pointer"
                  />
                  {uploadFiles.textures.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium">Textures to add:</p>
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
                </div>

                {/* Add Binary Files */}
                <div className="space-y-2 border rounded-lg p-4">
                  <Label>Add Binary Files</Label>
                  <Input
                    type="file"
                    accept=".bin"
                    multiple
                    onChange={handleBinarySelect}
                    className="cursor-pointer"
                  />
                  {uploadFiles.binaries.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-sm font-medium">Binary files to add:</p>
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
                </div>

                {/* Add Files Button */}
                {(uploadFiles.textures.length > 0 || uploadFiles.binaries.length > 0) && (
                  <div className="mt-4">
                    <Button 
                      onClick={handleAddFilesToModel} 
                      disabled={addingFiles}
                      className="w-full"
                    >
                      {addingFiles ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Adding Files... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add {uploadFiles.textures.length + uploadFiles.binaries.length} File(s) to Model
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={isFilesDialogOpen} onOpenChange={setIsFilesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Model Files: {selectedModel?.modelName}</DialogTitle>
            <DialogDescription>
              All files associated with this 3D model
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Main Model File */}
            {selectedModel?.mainModelFile && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Main Model File</Label>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <span className="text-sm">{selectedModel.mainModelFile.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedModel.mainModelFile.fileSize)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedModel.mainModelFile?.filePath, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Texture Files */}
            {selectedModel?.textures && selectedModel.textures.length > 0 && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Texture Files</Label>
                <div className="space-y-2 mt-2">
                  {selectedModel.textures.map((texture, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{getTextureTypeIcon(texture.textureType)}</span>
                        <span className="text-sm">{texture.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {texture.textureType || 'baseColor'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(texture.fileSize)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(texture.filePath, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Binary Files */}
            {selectedModel?.binaries && selectedModel.binaries.length > 0 && (
              <div className="border rounded-lg p-3">
                <Label className="font-semibold">Binary Buffer Files</Label>
                <div className="space-y-2 mt-2">
                  {selectedModel.binaries.map((binary, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>🔧</span>
                        <span className="text-sm">{binary.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(binary.fileSize)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(binary.filePath, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Model Preview: {selectedModel?.modelName}</DialogTitle>
            <DialogDescription>
              Drag to rotate, scroll to zoom
            </DialogDescription>
          </DialogHeader>
          {selectedModel && (
            <ModelPreview 
              modelUrl={selectedModel.filePath} 
              scale={parseFloat(selectedModel.scale)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedModel?.modelName}"? This action cannot be undone.
              {selectedModel?.isDefault && (
                <p className="mt-2 text-red-500 font-semibold">
                  Warning: This is the default model for its plant. Deleting it will reset the plant to use procedural rendering.
                </p>
              )}
              {selectedModel?.hasExternalFiles && (
                <p className="mt-2 text-orange-500">
                  This model has {selectedModel.textureCount || 0} texture file(s) and {selectedModel.binaries?.length || 0} binary file(s) that will also be deleted.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}