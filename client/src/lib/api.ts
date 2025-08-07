import API from "./axios-client";
import {
  AllMembersInWorkspaceResponseType,
  AllProjectPayloadType,
  AllProjectResponseType,
  AllTaskPayloadType,
  AllTaskResponseType,
  AnalyticsResponseType,
  ChangeWorkspaceMemberRoleType,
  CreateProjectPayloadType,
  CreateTaskPayloadType,
  EditTaskPayloadType,
  CreateWorkspaceResponseType,
  EditProjectPayloadType,
  ProjectByIdPayloadType,
  ProjectResponseType,
} from "../types/api.type";
import {
  AllWorkspaceResponseType,
  CreateWorkspaceType,
  CurrentUserResponseType,
  LoginResponseType,
  loginType,
  registerType,
  WorkspaceByIdResponseType,
  EditWorkspaceType,
} from "@/types/api.type";

export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const registerMutationFn = async (data: registerType) =>
  await API.post("/auth/register", data);

export const logoutMutationFn = async () => await API.post("/auth/logout");

export const getCurrentUserQueryFn =
  async (): Promise<CurrentUserResponseType> => {
    const response = await API.get(`/user/current`);
    return response.data;
  };

//********* WORKSPACE ****************
//************* */

export const createWorkspaceMutationFn = async (
  data: CreateWorkspaceType
): Promise<CreateWorkspaceResponseType> => {
  const response = await API.post(`/workspace/create/new`, data);
  return response.data;
};

export const editWorkspaceMutationFn = async ({
  workspaceId,
  data,
}: EditWorkspaceType) => {
  const response = await API.put(`/workspace/update/${workspaceId}`, data);
  return response.data;
};

export const getAllWorkspacesUserIsMemberQueryFn =
  async (): Promise<AllWorkspaceResponseType> => {
    const response = await API.get(`/workspace/all`);
    return response.data;
  };

export const getWorkspaceByIdQueryFn = async (
  workspaceId: string
): Promise<WorkspaceByIdResponseType> => {
  const response = await API.get(`/workspace/${workspaceId}`);
  return response.data;
};

export const getMembersInWorkspaceQueryFn = async (
  workspaceId: string
): Promise<AllMembersInWorkspaceResponseType> => {
  const response = await API.get(`/workspace/members/${workspaceId}`);
  return response.data;
};

export const getWorkspaceAnalyticsQueryFn = async (
  workspaceId: string
): Promise<AnalyticsResponseType> => {
  const response = await API.get(`/workspace/analytics/${workspaceId}`);
  return response.data;
};

export const changeWorkspaceMemberRoleMutationFn = async ({
  workspaceId,
  data,
}: ChangeWorkspaceMemberRoleType) => {
  const response = await API.put(
    `/workspace/change/member/role/${workspaceId}`,
    data
  );
  return response.data;
};

export const deleteWorkspaceMutationFn = async (
  workspaceId: string
): Promise<{
  message: string;
  currentWorkspace: string;
}> => {
  const response = await API.delete(`/workspace/delete/${workspaceId}`);
  return response.data;
};

//*******MEMBER ****************

export const invitedUserJoinWorkspaceMutationFn = async (
  iniviteCode: string
): Promise<{
  message: string;
  workspaceId: string;
}> => {
  const response = await API.post(`/member/workspace/${iniviteCode}/join`);
  return response.data;
};

//********* */
//********* PROJECTS
export const createProjectMutationFn = async ({
  workspaceId,
  data,
}: CreateProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.post(
    `/project/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};

export const editProjectMutationFn = async ({
  projectId,
  workspaceId,
  data,
}: EditProjectPayloadType): Promise<ProjectResponseType> => {
  const response = await API.put(
    `/project/${projectId}/workspace/${workspaceId}/update`,
    data
  );
  return response.data;
};

export const getProjectsInWorkspaceQueryFn = async ({
  workspaceId,
  pageSize = 10,
  pageNumber = 1,
}: AllProjectPayloadType): Promise<AllProjectResponseType> => {
  const response = await API.get(
    `/project/workspace/${workspaceId}/all?pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
  return response.data;
};

export const getProjectByIdQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<ProjectResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}`
  );
  return response.data;
};

export const getProjectAnalyticsQueryFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<AnalyticsResponseType> => {
  const response = await API.get(
    `/project/${projectId}/workspace/${workspaceId}/analytics`
  );
  return response.data;
};

export const deleteProjectMutationFn = async ({
  workspaceId,
  projectId,
}: ProjectByIdPayloadType): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/project/${projectId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

//*******TASKS ********************************
//************************* */

export const createTaskMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: CreateTaskPayloadType) => {
  const response = await API.post(
    `/task/project/${projectId}/workspace/${workspaceId}/create`,
    data
  );
  return response.data;
};


export const editTaskMutationFn = async ({
  taskId,
  projectId,
  workspaceId,
  data,
}:EditTaskPayloadType): Promise<{message: string;}> => {
  const response = await API.put(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/update/`,
    data
  );
  return response.data;
};

export const getAllTasksQueryFn = async ({
  workspaceId,
  keyword,
  projectId,
  assignedTo,
  priority,
  status,
  dueDate,
  sprintId,
  pageNumber,
  pageSize,
}: AllTaskPayloadType): Promise<AllTaskResponseType> => {
  const baseUrl = `/task/workspace/${workspaceId}/all`;

  const queryParams = new URLSearchParams();
  if (keyword) queryParams.append("keyword", keyword);
  if (projectId) queryParams.append("projectId", projectId);
  if (assignedTo) queryParams.append("assignedTo", assignedTo);
  if (priority) queryParams.append("priority", priority);
  if (status) queryParams.append("status", status);
  if (dueDate) queryParams.append("dueDate", dueDate);
  if (sprintId) queryParams.append("sprintId", sprintId);
  if (pageNumber) queryParams.append("pageNumber", pageNumber?.toString());
  if (pageSize) queryParams.append("pageSize", pageSize?.toString());

  const url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
  const response = await API.get(url);
  return response.data;
};

export const deleteTaskMutationFn = async ({
  workspaceId,
  taskId,
}: {
  workspaceId: string;
  taskId: string;
}): Promise<{
  message: string;
}> => {
  const response = await API.delete(
    `/task/${taskId}/workspace/${workspaceId}/delete`
  );
  return response.data;
};

export const updateTaskAIPredictionsMutationFn = async ({
  workspaceId,
  projectId,
  taskId,
  predictions,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  predictions: {
    aiComplexity: number;
    aiRisk: number;
    aiPriority: number;
  };
}): Promise<{
  message: string;
  task: any;
}> => {
  const response = await API.put(
    `/task/${taskId}/project/${projectId}/workspace/${workspaceId}/ai-predictions`,
    predictions
  );
  return response.data;
};

//********* SPRINT ****************
//************* */

export const getSprintsQueryFn = async ({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}): Promise<{
  message: string;
  sprints: any[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    totalPages: number;
    skip: number;
  };
}> => {
  const response = await API.get(`/sprint/${workspaceId}/projects/${projectId}/sprints`);
  return response.data;
};

export const getNextSprintNumberQueryFn = async ({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}): Promise<{
  message: string;
  nextSprintNumber: number;
}> => {
  const response = await API.get(`/sprint/${workspaceId}/projects/${projectId}/sprints/next-number`);
  return response.data;
};

export const createSprintMutationFn = async ({
  workspaceId,
  projectId,
  data,
}: {
  workspaceId: string;
  projectId: string;
  data: {
    name: string;
    description?: string;
    sprintNumber: number;
    startDate?: string;
    endDate?: string;
    capacity?: number;
    status?: string;
  };
}): Promise<{
  message: string;
  sprint: any;
}> => {
  const response = await API.post(`/sprint/${workspaceId}/projects/${projectId}/sprints`, data);
  return response.data;
};

export const updateSprintMutationFn = async ({
  workspaceId,
  projectId,
  sprintId,
  data,
}: {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    capacity?: number;
    status?: string;
  };
}): Promise<{
  message: string;
  sprint: any;
}> => {
  const response = await API.put(`/sprint/${workspaceId}/projects/${projectId}/sprints/${sprintId}`, data);
  return response.data;
};

export const deleteSprintMutationFn = async ({
  workspaceId,
  projectId,
  sprintId,
  deleteTasks,
}: {
  workspaceId: string;
  projectId: string;
  sprintId: string;
  deleteTasks?: boolean;
}): Promise<{
  message: string;
}> => {
  const params = deleteTasks !== undefined ? `?deleteTasks=${deleteTasks}` : '';
  const response = await API.delete(`/sprint/${workspaceId}/projects/${projectId}/sprints/${sprintId}${params}`);
  return response.data;
};

export const getTasksBySprintQueryFn = async ({
  workspaceId,
  projectId,
  sprintId,
}: {
  workspaceId: string;
  projectId: string;
  sprintId: string;
}): Promise<{
  message: string;
  tasks: any[];
  totalCount: number;
}> => {
  const response = await API.get(`/task/${workspaceId}/projects/${projectId}/sprint/${sprintId}/tasks`);
  return response.data;
};

// CSV Workers API functions
export const importCSVWorkersMutationFn = async ({
  workspaceId,
  csvData,
}: {
  workspaceId: string;
  csvData: string;
}): Promise<{
  message: string;
  imported: any[];
  errors: string[];
  totalImported: number;
  totalErrors: number;
}> => {
  const response = await API.post(`/member/workspace/${workspaceId}/csv-workers/import`, { csvData });
  return response.data;
};

export const getCSVWorkersQueryFn = async (workspaceId: string): Promise<{
  message: string;
  csvWorkers: any[];
}> => {
  const response = await API.get(`/member/workspace/${workspaceId}/csv-workers`);
  return response.data;
};