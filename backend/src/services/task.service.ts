// Service for handling business logic related to tasks.
import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { BadRequestException, NotFoundException } from "../utils/app.error";



export const createTaskService = async (
    workspaceId: string,
    projectId: string, 
    userId:string,
    body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
    sprint?: string | null;
    }
) => {

    const {title,
        description,
         priority,
          status,
           assignedTo,
            dueDate,
            sprint, } = body; 

    const project = await ProjectModel.findById(projectId); 
    if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }        
 if (assignedTo) {
    const isAssignedUserMember = await MemberModel.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }

  // Validate sprint date constraints if sprint is assigned
  if (sprint && dueDate) {
    const SprintModel = (await import("../models/sprint.model")).default;
    const sprintData = await SprintModel.findById(sprint);
    
    if (sprintData) {
      const taskDueDate = new Date(dueDate);
      const sprintStart = sprintData.startDate ? new Date(sprintData.startDate) : new Date();
      const sprintEnd = sprintData.endDate ? new Date(sprintData.endDate) : new Date("2100-12-31");
      
      if (taskDueDate < sprintStart || taskDueDate > sprintEnd) {
        throw new BadRequestException(
          `Task due date must be within sprint period: ${sprintStart.toDateString()} to ${sprintEnd.toDateString()}`
        );
      }
    }
  }

  const task = new TaskModel({
    title, 
    description, 
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
    sprint,
  });

  await task.save(); 

  return {task}; 

}; 

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
    sprint?: string | null;
    aiComplexity?: number;
    aiRisk?: number;
    aiPriority?: number;
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "This task does not exist or is not associated with this project"
    );
  }

  // Validate sprint date constraints if sprint is assigned
  if (body.sprint && body.dueDate) {
    const SprintModel = (await import("../models/sprint.model")).default;
    const sprintData = await SprintModel.findById(body.sprint);
    
    if (sprintData) {
      const taskDueDate = new Date(body.dueDate);
      const sprintStart = sprintData.startDate ? new Date(sprintData.startDate) : new Date();
      const sprintEnd = sprintData.endDate ? new Date(sprintData.endDate) : new Date("2100-12-31");
      
      if (taskDueDate < sprintStart || taskDueDate > sprintEnd) {
        throw new BadRequestException(
          `Task due date must be within sprint period: ${sprintStart.toDateString()} to ${sprintEnd.toDateString()}`
        );
      }
    }
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return { updatedTask };

};

export const updateTaskAIPredictionsService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  predictions: {
    aiComplexity: number;
    aiRisk: number;
    aiPriority: number;
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "This task does not exist or is not associated with this project"
    );
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      aiComplexity: predictions.aiComplexity,
      aiRisk: predictions.aiRisk,
      aiPriority: predictions.aiPriority,
      aiPredictionDate: new Date(),
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task AI predictions");
  }

  return { updatedTask };
};

export const getAllTasksService = async(
  workspaceId: string, 
  filters : {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
    sprintId?: string;
  }, 
    pagination: {
    pageSize: number;
    pageNumber: number;
  }
)=>{
const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if(filters.projectId) {
    query.project = filters.projectId; 
  }

  if(filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status }
  }

  if(filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority }
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

   if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  if (filters.sprintId) {
    query.sprint = filters.sprintId;
  }
   // pagination LOGIC  
   const {pageSize, pageNumber} = pagination
   const skip = (pageNumber -1) * pageSize;

   const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
    .skip(skip)
    .limit(pageSize)
    .sort({createdAt: -1})
    .populate("assignedTo","_id name profilePicture -password")
    .populate("project","_id emoji name")
    .populate("sprint","_id name sprintNumber status"), 
    TaskModel.countDocuments(query),
   ]); 

   const totalPages = Math.ceil(totalCount / pageSize); 

   return {
    tasks, 
    pagination: {
      pageSize, 
      pageNumber, 
      totalCount, 
      totalPages,
      skip, 
    }
   }



};

export const getTaskByIdService = async (
workspaceId: string, 
projectId: string, 
taskId: string
) => {
 const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  }).populate("assignedTo", "_id name profilePicture -password")
    .populate("sprint", "_id name sprintNumber status");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
}; 

export const deleteTaskService = async (
  workspaceId: string, 
  taskId: string, 
) =>{
  const task = await TaskModel.findByIdAndDelete({
    _id: taskId, 
    workspacd:workspaceId,
  })
  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  return;
};

export const getTasksBySprintService = async (
  workspaceId: string,
  projectId: string,
  sprintId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  // Verify sprint exists and belongs to the project
  const SprintModel = (await import("../models/sprint.model")).default;
  const sprint = await SprintModel.findOne({
    _id: sprintId,
    project: projectId,
  });

  if (!sprint) {
    throw new NotFoundException("Sprint not found or does not belong to this project");
  }

  const tasks = await TaskModel.find({
    workspace: workspaceId,
    project: projectId,
    sprint: sprintId,
  })
  .populate("assignedTo", "_id name profilePicture -password")
  .populate("project", "_id emoji name")
  .populate("sprint", "_id name sprintNumber status")
  .sort({ createdAt: -1 });

  const totalCount = await TaskModel.countDocuments({
    workspace: workspaceId,
    project: projectId,
    sprint: sprintId,
  });

  return {
    tasks,
    totalCount,
  };
}; 