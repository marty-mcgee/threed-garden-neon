// src/app/dashboard/threed/tasks/tasksContent.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Plus, Edit2, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, Info, Calendar, Clock, Flag, AlertCircle, CheckSquare } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Task {
  task: {
    id: number;
    taskId: string;
    plantingId: number;
    plantId: number;
    bedId: number;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    dueDate: string;
    completedAt: string;
    assignedTo: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
  };
  planting: {
    id: number;
    plantingId: string;
  };
  plant: {
    id: number;
    commonName: string;
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
          ({totalRecords} total tasks)
        </span>
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={(currentPage + 1) * pageSize >= totalRecords}>
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function TasksContent() {
  const { showToast, ToastComponent } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/threed/tasks?limit=500&status=${statusFilter}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    let filtered = [...tasks];
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plant?.commonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.bed?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.task.priority === priorityFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.task.type === typeFilter);
    }
    
    setTotalRecords(filtered.length);
    setFilteredTasks(filtered);
    setCurrentPage(0);
  }, [tasks, searchTerm, priorityFilter, typeFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getCurrentPageData = () => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredTasks.slice(start, end);
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const completeTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/threed/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (data.success) {
        showToast('Task marked as completed!', 'success');
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to complete task', 'error');
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const currentPageData = getCurrentPageData();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'high': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'low': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400';
      case 'completed': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return <Flag className="w-3 h-3 text-blue-600" />;
      case 'fertilize': return <Flag className="w-3 h-3 text-green-600" />;
      case 'prune': return <Flag className="w-3 h-3 text-purple-600" />;
      case 'harvest': return <Flag className="w-3 h-3 text-amber-600" />;
      case 'weed': return <Flag className="w-3 h-3 text-brown-600" />;
      default: return <Flag className="w-3 h-3 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      {ToastComponent}
      
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Garden Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords} total tasks • {currentPageData.length} on this page
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
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
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="all">All Status</option>
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg bg-background"
          >
            <option value="all">All Types</option>
            <option value="water">Water</option>
            <option value="fertilize">Fertilize</option>
            <option value="prune">Prune</option>
            <option value="harvest">Harvest</option>
            <option value="weed">Weed</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{tasks.filter(t => t.task.status === 'pending').length}</p>
              </div>
              <Circle className="w-5 h-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.task.status === 'in_progress').length}</p>
              </div>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.task.status === 'completed').length}</p>
              </div>
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{tasks.filter(t => isOverdue(t.task.dueDate) && t.task.status !== 'completed').length}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.task.priority === 'urgent' && t.task.status !== 'completed').length}</p>
              </div>
              <Flag className="w-5 h-5 text-red-600" />
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
                <th className="px-4 py-3 text-left text-xs uppercase">Task</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Plant / Bed</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentPageData.map((item) => (
                <React.Fragment key={item.task.id}>
                  <tr className={`hover:bg-muted/50 cursor-pointer ${isOverdue(item.task.dueDate) && item.task.status !== 'completed' ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.task.id)}>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.task.id)}>
                      <span className="font-medium">{item.task.title}</span>
                     </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.task.id)}>
                      {item.plant?.commonName || item.bed?.name || 'General'}
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.task.id)}>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(item.task.priority)}`}>
                        {item.task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.task.id)}>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(item.task.status)}`}>
                        {item.task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={() => toggleRowExpansion(item.task.id)}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className={isOverdue(item.task.dueDate) && item.task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(item.task.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={() => toggleRowExpansion(item.task.id)}>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(item.task.type)}
                        <span className="text-sm capitalize">{item.task.type || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.task.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            completeTask(item.task.id);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </td>
                  </tr>
                  {expandedRows.has(item.task.id) && (
                    <tr className="bg-muted/30">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="text-sm space-y-2">
                          <div>
                            <p className="font-medium text-foreground">Description</p>
                            <p className="text-muted-foreground">{item.task.description || 'No description'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <p className="font-medium text-foreground">Assigned To</p>
                              <p className="text-muted-foreground">{item.task.assignedTo || 'Unassigned'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Created</p>
                              <p className="text-muted-foreground">{formatDate(item.task.createdAt)}</p>
                            </div>
                          </div>
                          {item.task.notes && (
                            <div>
                              <p className="font-medium text-foreground">Notes</p>
                              <p className="text-muted-foreground">{item.task.notes}</p>
                            </div>
                          )}
                          {item.task.completedAt && (
                            <div>
                              <p className="font-medium text-foreground">Completed</p>
                              <p className="text-muted-foreground">{formatDate(item.task.completedAt)}</p>
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
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks found</p>
            <p className="text-sm mt-1">Create garden tasks to stay organized</p>
          </div>
        )}
      </Card>
    </div>
  );
}