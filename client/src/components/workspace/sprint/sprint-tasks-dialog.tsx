// sprint-tasks-dialog.tsx
// This file provides a dialog component to display tasks assigned to a specific sprint.
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, User, AlertCircle, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { getAllTasksQueryFn } from "@/lib/api";
import { SprintType } from "@/types/api.type";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface SprintTasksDialogProps {
  sprint: SprintType | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SprintTasksDialog = ({ sprint, projectId, isOpen, onClose }: SprintTasksDialogProps) => {
  const workspaceId = useWorkspaceId();

  // Fetch tasks for this sprint
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ["tasks", workspaceId, projectId, sprint?._id],
    queryFn: () => getAllTasksQueryFn({
      workspaceId: workspaceId!,
      projectId: projectId,
      assignedTo: undefined,
      priority: undefined,
      status: undefined,
      dueDate: undefined,
      keyword: undefined,
      pageNumber: 1,
      pageSize: 50,
    }),
    enabled: !!workspaceId && !!projectId && isOpen,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const tasks = tasksData?.tasks || [];
  const sprintTasks = tasks.filter(task => task.sprint?._id === sprint?._id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Circle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!sprint) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tasks in {sprint.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sprint Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Sprint {sprint.sprintNumber} • {sprint.status}
                  </p>
                </div>
                <Badge className={getStatusColor(sprint.status)}>
                  {sprint.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Capacity:</span>
                  <p className="font-medium">{sprint.capacity}h</p>
                </div>
                {sprint.startDate && (
                  <div>
                    <span className="text-gray-600">Start:</span>
                    <p className="font-medium">
                      {format(new Date(sprint.startDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {sprint.endDate && (
                  <div>
                    <span className="text-gray-600">End:</span>
                    <p className="font-medium">
                      {format(new Date(sprint.endDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Tasks:</span>
                  <p className="font-medium">{sprintTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Assigned Tasks</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading tasks: {error.message}</p>
              </div>
            ) : sprintTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                  <p className="text-gray-600">
                    No tasks are currently assigned to this sprint.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sprintTasks.map((task) => (
                  <Card key={task._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignedTo.name}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(task.dueDate), 'MMM dd')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(task.status)}
                              {task.status}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SprintTasksDialog; 