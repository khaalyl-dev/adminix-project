// sprint-management.tsx
// This file provides the sprint management component for projects, including sprint listing, creation, and management.
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Clock, Users, Edit, Trash2, Play, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetSprintsQuery from "@/hooks/api/use-get-sprints";
import CreateSprintForm from "./create-sprint-form";
import EditSprintForm from "./edit-sprint-form";
import SprintTasksDialog from "./sprint-tasks-dialog";
import DeleteSprintDialog from "./delete-sprint-dialog";
import AISprintPlanning from "./ai-sprint-planning";
import { format } from "date-fns";
import { deleteSprintMutationFn } from "@/lib/api";
import { SprintType } from "@/types/api.type";
import { useGetTasksBySprintQuery } from "@/hooks/api/use-get-tasks-by-sprint";

const SprintManagement = ({ project }: { project?: any }) => {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<SprintType | null>(null);
  const [viewingSprintTasks, setViewingSprintTasks] = useState<SprintType | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<SprintType | null>(null);
  const [checkingSprint, setCheckingSprint] = useState<SprintType | null>(null);
  const queryClient = useQueryClient();

  // Delete sprint mutation
  const { mutate: deleteSprint, isPending: isDeleting } = useMutation({
    mutationFn: deleteSprintMutationFn,
  });

  // Fetch sprints for the project
  const { data: sprintData, isLoading, error } = useGetSprintsQuery({
    workspaceId: workspaceId!,
    projectId: projectId!,
    skip: !workspaceId || !projectId,
  });

  // Check tasks for sprint being deleted
  const { data: tasksData } = useGetTasksBySprintQuery({
    workspaceId: workspaceId!,
    projectId: projectId!,
    sprintId: checkingSprint?._id || "",
    enabled: !!checkingSprint,
  });

  // Get tasks for the sprint being deleted (for dialog display)
  const { data: deleteDialogTasksData } = useGetTasksBySprintQuery({
    workspaceId: workspaceId!,
    projectId: projectId!,
    sprintId: deletingSprint?._id || "",
    enabled: !!deletingSprint,
  });

  const sprints = sprintData?.sprints || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Calendar className="w-4 h-4" />;
      case 'ACTIVE':
        return <Play className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const handleSprintCreated = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
    toast({
      title: "Success",
      description: "Sprint created successfully",
      variant: "success",
    });
  };

  const handleSprintUpdated = () => {
    setEditingSprint(null);
    queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
    toast({
      title: "Success",
      description: "Sprint updated successfully",
      variant: "success",
    });
  };

  const handleDeleteSprint = (sprint: SprintType) => {
    setCheckingSprint(sprint);
  };

  // Handle the result of task checking
  React.useEffect(() => {
    if (checkingSprint && tasksData !== undefined) {
      const hasTasks = tasksData?.totalCount && tasksData.totalCount > 0;
      
      if (hasTasks) {
        // Has tasks, show the dialog with task options
        setDeletingSprint(checkingSprint);
      } else {
        // No tasks, show simple confirmation
        if (confirm(`Are you sure you want to delete sprint "${checkingSprint.name}"? This action cannot be undone.`)) {
          deleteSprint(
            {
              workspaceId: workspaceId!,
              projectId: projectId!,
              sprintId: checkingSprint._id,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
                toast({
                  title: "Success",
                  description: "Sprint deleted successfully",
                  variant: "success",
                });
              },
              onError: (error: any) => {
                toast({
                  title: "Error",
                  description: error.response?.data?.message || "Failed to delete sprint",
                  variant: "destructive",
                });
              },
            }
          );
        }
      }
      
      // Reset checking state
      setCheckingSprint(null);
    }
  }, [checkingSprint, tasksData]);

  const handleConfirmDeleteSprint = (deleteTasks: boolean) => {
    if (!deletingSprint) return;
    
    deleteSprint(
      {
        workspaceId: workspaceId!,
        projectId: projectId!,
        sprintId: deletingSprint._id,
        deleteTasks,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, projectId] });
          queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
          setDeletingSprint(null);
          toast({
            title: "Success",
            description: "Sprint deleted successfully",
            variant: "success",
          });
        },
        onError: (error: any) => {
          setDeletingSprint(null);
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to delete sprint",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading sprints: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
              <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sprint Management</h2>
            <p className="text-gray-600 mt-1">Manage sprints for this project</p>
          </div>
          <div className="flex items-center gap-2">
            <AISprintPlanning project={project} />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  Create Sprint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <CreateSprintForm 
                  projectId={projectId!} 
                  onClose={handleSprintCreated} 
                />
              </DialogContent>
            </Dialog>
          </div>

        {/* Edit Sprint Dialog */}
        <Dialog open={!!editingSprint} onOpenChange={(open) => !open && setEditingSprint(null)}>
          <DialogContent className="sm:max-w-lg">
            {editingSprint && (
              <EditSprintForm 
                sprint={editingSprint} 
                projectId={projectId!}
                onClose={handleSprintUpdated} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Sprint Tasks Dialog */}
        <SprintTasksDialog
          sprint={viewingSprintTasks}
          projectId={projectId!}
          isOpen={!!viewingSprintTasks}
          onClose={() => setViewingSprintTasks(null)}
        />
      </div>

      {/* Sprint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sprints</p>
                <p className="text-2xl font-bold text-gray-900">{sprints.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sprints</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sprints.filter(s => s.status === 'ACTIVE').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sprints.filter(s => s.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sprints.filter(s => s.status === 'PLANNED').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Sprints</h3>
        
        {sprints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sprints yet</h3>
              <p className="text-gray-600 mb-4">Create your first sprint to start organizing your project tasks.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create First Sprint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <Card key={sprint._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{sprint.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Sprint {sprint.sprintNumber}
                      </p>
                    </div>
                    <Badge className={getStatusColor(sprint.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(sprint.status)}
                        {sprint.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {sprint.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {sprint.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{sprint.capacity}h</span>
                    </div>
                    
                    {sprint.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">
                          {format(new Date(sprint.startDate), 'MMM dd')}
                        </span>
                      </div>
                    )}
                    
                    {sprint.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="font-medium">
                          {format(new Date(sprint.endDate), 'MMM dd')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created by:</span>
                      <span className="font-medium">{sprint.createdBy?.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingSprint(sprint)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setViewingSprintTasks(sprint)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Tasks
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteSprint(sprint)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Sprint Dialog */}
        <Dialog open={!!editingSprint} onOpenChange={(open) => !open && setEditingSprint(null)}>
          <DialogContent className="sm:max-w-lg">
            {editingSprint && (
              <EditSprintForm 
                sprint={editingSprint} 
                projectId={projectId!}
                onClose={handleSprintUpdated} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Sprint Tasks Dialog */}
        <SprintTasksDialog
          sprint={viewingSprintTasks}
          projectId={projectId!}
          isOpen={!!viewingSprintTasks}
          onClose={() => setViewingSprintTasks(null)}
        />

        {/* Delete Sprint Dialog */}
        <DeleteSprintDialog
          sprint={deletingSprint}
          isOpen={!!deletingSprint}
          onClose={() => setDeletingSprint(null)}
          onConfirm={handleConfirmDeleteSprint}
          isLoading={isDeleting}
          taskCount={deleteDialogTasksData?.totalCount || 0}
        />
      </div>
    </div>
  );
};

export default SprintManagement; 