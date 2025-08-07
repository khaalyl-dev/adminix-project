// project-analytics.tsx
// Enhanced analytics component with AI-powered task prediction, sprint planning, and project analysis
import { useParams } from "react-router-dom";
import AnalyticsCard from "../common/analytics-card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectAnalyticsQueryFn, createTaskMutationFn, getMembersInWorkspaceQueryFn, getCSVWorkersQueryFn } from "@/lib/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Target, 
  Calendar, 
  Users, 
  BarChart3, 
  Zap, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  PlayCircle,
  Settings,
  Plus
} from "lucide-react";
import axios from "axios";

// Type definitions for AI model responses


interface WorkerInfo {
  name: string;
  role: string;
  skill_score: number;
  workload_factor: number;
  complexity_fit: number;
  formula_y_score: number;
  assigned_time: number;
}

interface TaskAssignment {
  task_index: number;
  task_name: string;
  required_roles: string[];
  estimated_time: number;
  complexity: number;
  risk: number;
  priority: number;
  assigned_workers: WorkerInfo[];
}

interface ProjectResponse {
  project_title: string;
  project_description: string;
  total_tasks: number;
  total_estimated_time: number;
  assignments: TaskAssignment[];
  worker_utilization: Record<string, any>;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  ml_predictor_ready: boolean;
  assignment_engine_ready: boolean;
}

const ProjectAnalytics = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const workspaceId = useWorkspaceId();

  // AI Model States
  const [activeAITab, setActiveAITab] = useState('task-prediction');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  
  // AI Model Data States
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  
  // Form States
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [maxWorkersPerTask, setMaxWorkersPerTask] = useState(3);
  const [savedTasks, setSavedTasks] = useState<Set<string>>(new Set());

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: createTaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
    },
  });

  // Fetch project data from database
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["singleProject", projectId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/project/${projectId}/workspace/${workspaceId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Project fetch error:', error);
        throw error;
      }
    },
    enabled: !!workspaceId && !!projectId,
  });
  const project = projectData?.project;

  // Auto-populate project title and description from database
  useEffect(() => {
    if (project) {
      setProjectTitle(project.name || '');
      setProjectDescription(project.description || '');
    }
  }, [project]);

  // API base URL for ML service
  const ML_API_BASE_URL = 'http://localhost:3000';

  // Fetch basic project analytics
  const { data, isPending } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => getProjectAnalyticsQueryFn({ workspaceId, projectId }),
    staleTime: 0,
    enabled: !!projectId,
  });

  const analytics = data?.analytics;

  // Utility function to handle AI API calls
  const handleAiApiCall = async (
    apiCall: () => Promise<any>,
    successMessage: string,
    onSuccess?: (data: any) => void
  ) => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    
    try {
      const response = await apiCall();
      setAiSuccess(successMessage);
      if (onSuccess) onSuccess(response);
    } catch (err: any) {
      setAiError(err.message || 'An error occurred');
    } finally {
      setAiLoading(false);
    }
  };

  // AI API Functions
  const checkHealth = async () => {
    const response = await fetch(`${ML_API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  };





  const analyzeProject = async () => {
    console.log('🔍 analyzeProject function called - this should only happen on button click');
    const response = await fetch(`${ML_API_BASE_URL}/predict/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_title: projectTitle,
        project_description: projectDescription,
        max_workers_per_task: maxWorkersPerTask,
        workspace_id: workspaceId
      })
    });
    if (!response.ok) throw new Error('Project analysis failed');
    return response.json();
  };

  const getWorkers = async () => {
    const response = await fetch(`${ML_API_BASE_URL}/workers`);
    if (!response.ok) throw new Error('Failed to fetch workers');
    return response.json();
  };

  // Load initial AI data
  useEffect(() => {
    console.log('🔍 ProjectAnalytics component mounted - loading initial AI data');
    handleAiApiCall(checkHealth, 'System status loaded', setHealthStatus);
    handleAiApiCall(getWorkers, 'Workers loaded', (data) => setWorkers(data.workers || []));
  }, []);

  // UI Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      case 'high_load': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'light_load': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // UI Helper function to format numbers
  const formatNumber = (num: number, decimals: number = 2) => {
    return Number(num).toFixed(decimals);
  };

  // Function to add individual task to database
  const handleAddIndividualTask = async (assignment: TaskAssignment) => {
    if (!project || !workspaceId) return;
    
    try {
      // Calculate due date (30 days from now as default)
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Get the best assigned worker (highest formula_y_score)
      const bestWorker = assignment.assigned_workers.length > 0 
        ? assignment.assigned_workers.reduce((best, current) => 
            current.formula_y_score > best.formula_y_score ? current : best
          )
        : null;
      
      // Try to find the actual user ID for the best worker
      let assignedToUserId = null;
      if (bestWorker) {
        try {
          // Get all workspace members and find the one with matching name
          const membersData = await getMembersInWorkspaceQueryFn(workspaceId);
          console.log('Available members:', membersData.members.map(m => m.userId.name));
          console.log('Looking for worker:', bestWorker.name);
          
          // Try exact match first, then partial match
          let matchingMember = membersData.members.find(member => 
            member.userId.name.toLowerCase() === bestWorker.name.toLowerCase()
          );
          
          // If no exact match, try partial match
          if (!matchingMember) {
            matchingMember = membersData.members.find(member => 
              member.userId.name.toLowerCase().includes(bestWorker.name.toLowerCase()) ||
              bestWorker.name.toLowerCase().includes(member.userId.name.toLowerCase())
            );
          }
          
          if (matchingMember) {
            assignedToUserId = matchingMember.userId._id;
            console.log('Found matching user:', matchingMember.userId.name, 'with ID:', assignedToUserId);
          } else {
            // Try to find in CSV workers
            try {
              const csvWorkersData = await getCSVWorkersQueryFn(workspaceId);
              console.log('Available CSV workers:', csvWorkersData.csvWorkers.map(w => w.name));
              
              let matchingCSVWorker = csvWorkersData.csvWorkers.find(worker => 
                worker.name.toLowerCase() === bestWorker.name.toLowerCase()
              );
              
              if (!matchingCSVWorker) {
                matchingCSVWorker = csvWorkersData.csvWorkers.find(worker => 
                  worker.name.toLowerCase().includes(bestWorker.name.toLowerCase()) ||
                  bestWorker.name.toLowerCase().includes(worker.name.toLowerCase())
                );
              }
              
              if (matchingCSVWorker) {
                console.log('Found matching CSV worker:', matchingCSVWorker.name);
                // For CSV workers, we don't assign to a user ID since they don't have accounts
                // But we can still show them as recommended
              } else {
                console.log('No matching CSV worker found for worker:', bestWorker.name);
              }
            } catch (csvError) {
              console.log('Could not fetch CSV workers:', csvError);
            }
          }
        } catch (error) {
          console.log('Could not find user ID for worker:', bestWorker.name, 'Error:', error);
        }
      }
      
      // Create worker assignment description
      const workerAssignments = assignment.assigned_workers.map(worker => 
        `${worker.name} (${worker.role}) - Score: ${formatNumber(worker.formula_y_score)} | Time: ${formatNumber(worker.assigned_time)}h`
      ).join(', ');
      
      await createTaskMutation.mutateAsync({
        workspaceId,
        projectId: project._id,
        data: {
          title: assignment.task_name,
          description: `AI-generated task with roles: ${assignment.required_roles.join(', ')}. Duration: ${formatNumber(assignment.estimated_time)}h. AI Predictions - Complexity: ${formatNumber(assignment.complexity, 1)}, Risk: ${formatNumber(assignment.risk, 2)}, Priority: ${formatNumber(assignment.priority, 2)}. Assigned Workers: ${workerAssignments || 'None assigned'}.`,
          priority: assignment.priority > 0.7 ? 'HIGH' : assignment.priority > 0.4 ? 'MEDIUM' : 'LOW',
          status: 'TODO',
          assignedTo: assignedToUserId, // Use the found user ID or null
          dueDate: dueDate.toISOString(),
          sprint: null,
        },
      });

      // Add task to saved tasks set
      const taskKey = assignment.task_name;
      setSavedTasks(prev => new Set([...prev, taskKey]));
      
      // Show success message with assignment info
      const assignmentMessage = assignedToUserId && bestWorker
        ? `Task "${assignment.task_name}" assigned to ${bestWorker.name} and saved successfully!`
        : bestWorker 
          ? `Task "${assignment.task_name}" saved with ${bestWorker.name} as recommended worker!`
          : `Task "${assignment.task_name}" saved successfully!`;
      setAiSuccess(assignmentMessage);
      setTimeout(() => setAiSuccess(null), 3000);
    } catch (error: any) {
      // Show error message
      setAiError(error.message || 'Failed to add task');
      setTimeout(() => setAiError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Analytics Cards */}
      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard
          isLoading={isPending}
          title="Total Task"
          value={analytics?.totalTasks || 0}
        />
        <AnalyticsCard
          isLoading={isPending}
          title="Overdue Task"
          value={analytics?.overdueTasks || 0}
        />
        <AnalyticsCard
          isLoading={isPending}
          title="Completed Task"
          value={analytics?.completedTasks || 0}
        />
      </div>

      {/* AI-Powered Analytics Section */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-xl">AI-Powered Analytics</CardTitle>
            {healthStatus && (
              <Badge variant={healthStatus.ml_predictor_ready ? "default" : "destructive"}>
                {healthStatus.ml_predictor_ready ? "AI Ready" : "AI Offline"}
              </Badge>
            )}
            {projectLoading && (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading Project Data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
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

          {project && !projectLoading && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Project data loaded from database: <strong>{project.name}</strong></span>
              </div>
            </div>
          )}
          
          {!project && !projectLoading && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Project data not available. Please enter project details manually.</span>
              </div>
            </div>
          )}
          
          <Tabs value={activeAITab} onValueChange={setActiveAITab} className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="project-analysis">Project Analysis</TabsTrigger>
            </TabsList>





            {/* Project Analysis Tab */}
            <TabsContent value="project-analysis" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Workers per Task
                  </label>
                  <Input
                    type="number"
                    value={maxWorkersPerTask}
                    onChange={(e) => setMaxWorkersPerTask(Number(e.target.value))}
                  />
                </div>
                
                <Button
                  onClick={() => {
                    console.log('🔍 Analyze Project button clicked');
                    handleAiApiCall(analyzeProject, 'Project analysis completed', setProjectAnalysis);
                  }}
                  disabled={aiLoading || !project}
                  className="w-full"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze Project
                    </>
                  )}
                </Button>
              </div>

              {/* Project Analysis Results */}
              {projectAnalysis && (
                <div className="mt-6 space-y-6">
                  {/* Project Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-700 font-medium">Total Tasks</span>
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-2xl font-bold text-blue-900">{projectAnalysis.total_tasks}</div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-700 font-medium">Estimated Time</span>
                            <Clock className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-2xl font-bold text-green-900">
                            {formatNumber(projectAnalysis.total_estimated_time)}h
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-700 font-medium">Assignments</span>
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {projectAnalysis.assignments.length}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Task Assignments */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Assignments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projectAnalysis.assignments.map((assignment, index) => {
                          const isSaved = savedTasks.has(assignment.task_name);
                          
                          if (isSaved) {
                            return (
                              <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-green-900 mb-2">{assignment.task_name}</h4>
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
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">{assignment.task_name}</h4>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {assignment.required_roles.map((role, roleIndex) => (
                                      <Badge key={roleIndex} variant="outline" className="text-xs">
                                        {role}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-lg font-bold text-gray-900">{formatNumber(assignment.estimated_time)}h</div>
                                  <div className="text-xs text-gray-500 space-x-1">
                                    <span>C:{formatNumber(assignment.complexity, 1)}</span>
                                    <span>R:{formatNumber(assignment.risk, 2)}</span>
                                    <span>P:{formatNumber(assignment.priority, 2)}</span>
                                  </div>
                                </div>
                              </div>
                              
                                                            {/* Add Task Button */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddIndividualTask(assignment)}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Task to Database
                                </Button>
                              </div>
                              
                              {assignment.assigned_workers.length > 0 && (
                              <div className="border-t border-gray-100 pt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned Workers:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {assignment.assigned_workers.map((worker, workerIndex) => (
                                    <div key={workerIndex} className="bg-gray-50 rounded p-3">
                                      <div className="font-medium text-gray-900">{worker.name}</div>
                                      <div className="text-sm text-gray-600">{worker.role}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Score: {formatNumber(worker.formula_y_score)} | Time: {formatNumber(worker.assigned_time)}h
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Worker Utilization */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Worker Utilization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(projectAnalysis.worker_utilization).map(([workerName, utilization]: [string, any]) => (
                          <div key={workerName} className="border border-gray-200 rounded-lg p-4">
                            <div className="font-medium text-gray-900 mb-2">{workerName}</div>
                            <div className="text-sm text-gray-600 mb-2">{formatNumber(utilization.total_hours)}h assigned</div>
                            <Progress value={Math.min(utilization.utilization_percent, 100)} className="mb-2" />
                            <Badge variant="outline" className={`text-xs ${getStatusColor(utilization.status)}`}>
                              {utilization.utilization_percent.toFixed(0)}% ({utilization.status.replace('_', ' ')})
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectAnalytics;
