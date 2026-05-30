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
} from 'lucide-react';

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
  isActive: boolean;
  isDefault: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
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

export default function ModelsContent() {
  const { showToast } = useToast(); // Only need showToast, not ToastComponent
  const [models, setModels] = useState<Model[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.gltf', '.glb', '.usdz', '.obj'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) {
        showToast(`Invalid file type. Allowed: ${validExtensions.join(', ')}`);
        return;
      }
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, modelName: file.name.replace(extension, '') }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.plantId) {
      showToast('Please select a file and plant');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);
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
        showToast('Model uploaded successfully!');
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
    setSelectedFile(null);
  };

  const openEditDialog = (model: Model) => {
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
            Manage GLTF/GLB models for your garden plants
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
                Upload a GLTF, GLB, USDZ, or OBJ file for your plant
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Model File *</Label>
                <Input
                  type="file"
                  accept=".gltf,.glb,.usdz,.obj"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

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

              {/* Model Name */}
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.modelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                  placeholder="Enter model name"
                />
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
              <Button onClick={handleUpload} disabled={!selectedFile || !formData.plantId || uploading}>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update model properties and transformations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
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