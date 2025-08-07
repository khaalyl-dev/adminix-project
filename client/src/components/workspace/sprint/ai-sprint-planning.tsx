// ai-sprint-planning.tsx
// This component provides AI-powered sprint planning functionality
import React, { useState } from "react";
import { Brain, PlayCircle, Loader2, AlertTriangle, CheckCircle, Clock, Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createSprintMutationFn, createTaskMutationFn, getNextSprintNumberQueryFn } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";

interface TaskPrediction {
  complexity: number;
  risk: number;
  priority: number;
}

interface SprintTask {
  task: string;
  duration: number;
  roles: string[];
  prediction: TaskPrediction;
}

interface Sprint {
  sprint_number: number;
  total_hours: number;
  tasks: SprintTask[];
}

interface SprintPlanResponse {
  project_title: string;
  total_duration: number;
  sprints: Sprint[];
}

const MLS_API_BASE_URL = 'http://localhost:3000';

const AISprintPlanning = ({ project }: { project: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [sprintPlan, setSprintPlan] = useState<SprintPlanResponse | null>(null);
  const [sprintCapacity, setSprintCapacity] = useState(40);
  const [maxSprints, setMaxSprints] = useState(10);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savedTasks, setSavedTasks] = useState<Set<string>>(new Set());
  const toast = useToast();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleAiApiCall = async (
    apiCall: () => Promise<any>,
    successMessage: string,
    onSuccess?: (data: any) => void
  ) => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    
    try {
      const data = await apiCall();
      onSuccess?.(data);
      setAiSuccess(successMessage);
      toast.toast({ title: 'Success', description: successMessage, variant: 'success' });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during AI analysis';
      setAiError(errorMessage);
      toast.toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const generateSprintPlan = async () => {
    const response = await fetch(`${MLS_API_BASE_URL}/predict/project/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_title: project?.name || 'Project',
        project_description: project?.description || '',
        sprint_capacity: sprintCapacity,
        max_sprints: maxSprints,
        workspace_id: workspaceId
      })
    });
    if (!response.ok) throw new Error('Sprint planning failed');
    return response.json();
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return Number(num).toFixed(decimals);
  };

  // Function to add individual task to database
  const handleAddIndividualTask = async (task: SprintTask, sprintNumber: number) => {
    if (!project || !workspaceId) return;
    
    try {
      // Calculate due date (30 days from now as default)
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // For sprint planning, we don't have assigned workers, so we'll assign to null
      // In a real scenario, you might want to fetch available workers and assign based on roles
      const assignedTo = null; // Could be enhanced to find worker by role
      
      await createTaskMutation.mutateAsync({
        workspaceId,
        projectId: project._id,
        data: {
          title: task.task,
          description: `AI-generated task with roles: ${task.roles.join(', ')}. Duration: ${task.duration}h. AI Predictions - Complexity: ${formatNumber(task.prediction.complexity, 1)}, Risk: ${formatNumber(task.prediction.risk, 2)}, Priority: ${formatNumber(task.prediction.priority, 2)}.`,
          priority: task.prediction.priority > 0.7 ? 'HIGH' : task.prediction.priority > 0.4 ? 'MEDIUM' : 'LOW',
          status: 'TODO',
          assignedTo: assignedTo,
          dueDate: dueDate.toISOString(),
          sprint: null,
        },
      });

      // Add task to saved tasks set
      const taskKey = `${sprintNumber}-${task.task}`;
      setSavedTasks(prev => new Set([...prev, taskKey]));
      
      // Show success message
      setAiSuccess(`Task "${task.task}" saved successfully!`);
      setTimeout(() => setAiSuccess(null), 3000);
    } catch (error: any) {
      setAiError(error.message || 'Failed to add task');
      setTimeout(() => setAiError(null), 3000);
    }
  };

  // Mutations for saving sprint plan
  const createSprintMutation = useMutation({
    mutationFn: createSprintMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", workspaceId, project?._id] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
    },
  });

  const handleSaveSprintPlan = async () => {
    if (!sprintPlan || !project || !workspaceId) return;
    
    setSavingPlan(true);
    try {
      const createdSprints: any[] = [];
      
      // Create sprints first
      for (let i = 0; i < sprintPlan.sprints.length; i++) {
        const sprint = sprintPlan.sprints[i];
        
        // Get the next available sprint number
        const nextSprintNumber = await getNextSprintNumberQueryFn({
          workspaceId,
          projectId: project._id,
        });
        
        const sprintData = await createSprintMutation.mutateAsync({
          workspaceId,
          projectId: project._id,
          data: {
            name: `AI Sprint ${nextSprintNumber.nextSprintNumber}`,
            description: `AI-generated sprint with ${sprint.tasks.length} tasks`,
            sprintNumber: nextSprintNumber.nextSprintNumber,
            capacity: sprint.total_hours,
            startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Staggered start dates
            endDate: new Date(Date.now() + (i + 2) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks duration
          },
        });
        createdSprints.push(sprintData.sprint);
      }

      // Create tasks for each sprint
      for (let i = 0; i < sprintPlan.sprints.length; i++) {
        const sprint = sprintPlan.sprints[i];
        const createdSprint = createdSprints[i];
        
        for (const task of sprint.tasks) {
          // Calculate due date within sprint period
          const sprintStartDate = new Date(createdSprint.startDate);
          const sprintEndDate = new Date(createdSprint.endDate);
          const sprintDuration = sprintEndDate.getTime() - sprintStartDate.getTime();
          const taskDueDate = new Date(sprintStartDate.getTime() + (sprintDuration * 0.7)); // 70% into the sprint
          
          await createTaskMutation.mutateAsync({
            workspaceId,
            projectId: project._id,
            data: {
              title: task.task,
              description: `AI-generated task with roles: ${task.roles.join(', ')}. Due date set within sprint period.`,
              priority: task.prediction.priority > 0.7 ? 'HIGH' : task.prediction.priority > 0.4 ? 'MEDIUM' : 'LOW',
              status: 'TODO',
              assignedTo: null, // Will be assigned later
              dueDate: taskDueDate.toISOString(), // Due date within sprint period
              sprint: createdSprint._id,
            },
          });
        }
      }

      toast.toast({ 
        title: 'Success', 
        description: `Created ${createdSprints.length} sprints with ${sprintPlan.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0)} tasks. Please set due dates for tasks within their sprint periods.`, 
        variant: 'success' 
      });
      
      setIsOpen(false);
      setSprintPlan(null);
    } catch (error: any) {
      toast.toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save sprint plan', 
        variant: 'destructive' 
      });
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Sprint Planning
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI Sprint Planning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Messages */}
          {(aiError || aiSuccess) && (
            <div className="mb-4">
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{aiError}</span>
                  <Button variant="ghost" size="sm" onClick={() => setAiError(null)}>×</Button>
                </div>
              )}
              {aiSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{aiSuccess}</span>
                  <Button variant="ghost" size="sm" onClick={() => setAiSuccess(null)}>×</Button>
                </div>
              )}
            </div>
          )}

          {/* Project Info */}
          {project && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <CheckCircle className="w-4 h-4" />
                <span>Project: <strong>{project.name}</strong></span>
              </div>
            </div>
          )}

          {/* Sprint Planning Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Capacity (hours)
                </label>
                <Input
                  type="number"
                  value={sprintCapacity}
                  onChange={(e) => setSprintCapacity(Number(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Sprints
                </label>
                <Input
                  type="number"
                  value={maxSprints}
                  onChange={(e) => setMaxSprints(Number(e.target.value))}
                />
              </div>
            </div>
            
            <Button
              onClick={() => handleAiApiCall(generateSprintPlan, 'Sprint plan generated', setSprintPlan)}
              disabled={aiLoading || !project}
              className="w-full"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Generate Sprint Plan
                </>
              )}
            </Button>
          </div>

          {/* Sprint Plan Results */}
          {sprintPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sprint Plan: {sprintPlan.project_title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Total: {formatNumber(sprintPlan.total_duration)} hours
                  </Badge>
                  <Button
                    onClick={handleSaveSprintPlan}
                    disabled={savingPlan}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {savingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Sprint Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Summary of what will be created */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Summary</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p>This will create:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>{sprintPlan.sprints.length} sprints</strong> with staggered start dates</li>
                    <li><strong>{sprintPlan.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0)} tasks</strong> distributed across sprints</li>
                    <li>Tasks will be assigned to their respective sprints</li>
                    <li>Priority levels based on AI predictions</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                {sprintPlan.sprints.map((sprint, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Sprint {sprint.sprint_number}</CardTitle>
                        <Badge variant="secondary">
                          {formatNumber(sprint.total_hours)} hours
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {sprint.tasks.map((task, taskIndex) => {
                          const taskKey = `${sprint.sprint_number}-${task.task}`;
                          const isSaved = savedTasks.has(taskKey);
                          
                          if (isSaved) {
                            return (
                              <div key={taskIndex} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-green-900 mb-1">{task.task}</h5>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-700">Task saved successfully!</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={taskIndex} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-1">{task.task}</h5>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {task.roles.map((role, roleIndex) => (
                                      <Badge key={roleIndex} variant="outline" className="text-xs">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-sm font-medium text-gray-900">{task.duration}h</div>
                                  <div className="text-xs text-gray-500 space-x-1">
                                    <span>C:{formatNumber(task.prediction.complexity, 1)}</span>
                                    <span>R:{formatNumber(task.prediction.risk, 2)}</span>
                                    <span>P:{formatNumber(task.prediction.priority, 2)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddIndividualTask(task, sprint.sprint_number)}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Task to Database
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISprintPlanning; 