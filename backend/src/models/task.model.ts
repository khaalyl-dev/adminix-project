// Mongoose model for tasks, including their properties and relationships, in the backend application.
import mongoose, {Document, Schema} from "mongoose"; 
import { TaskPriorityEnum, TaskPriorityEnumType, TaskStatusEnum, TaskStatusEnumType } from "../enums/task.enum";
import { generateInviteCode, generateTaskCode } from "../utils/uuid";

export interface TaskDocument extends Document {
    taskCode: string; 
    title: string ; 
    description: string | null ;
    project: mongoose.Types.ObjectId; 
    workspace: mongoose.Types.ObjectId; 
    status:TaskStatusEnumType,
    priority:TaskPriorityEnumType,
    assignedTo: mongoose.Types.ObjectId | null; 
    createdBy: mongoose.Types.ObjectId; 
    dueDate: Date | null; 
    sprint: mongoose.Types.ObjectId | null; // Optional sprint association
    // AI Prediction fields
    aiComplexity?: number;
    aiRisk?: number;
    aiPriority?: number;
    aiPredictionDate?: Date;
    createdAt: Date; 
    updatedAt: Date; 
}

const taskSchema = new Schema<TaskDocument>({
    taskCode: {
        type: String,
        unique: true, 
        default: generateTaskCode, 
    }, 
    title: {
        type:String, 
        required: true, 
        trim: true, 
    }, 
    description: {
        type: String, 
        default: null, 
        trim: true,
    },
    project: {
        type:Schema.Types.ObjectId, 
        ref:"Project", 
        required: true, 
    }, 
    workspace : {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    }, 
    status: {
        type:String,
        enum:Object.values(TaskStatusEnum), 
        default: TaskStatusEnum.TODO,
    }, 
    priority: {
        type:String, 
        enum:Object.values(TaskPriorityEnum), 
        default: TaskPriorityEnum.MEDIUM,
    }, 
    assignedTo: {
        type:Schema.Types.ObjectId, 
        ref:"User", 
        default: null, 
    }, 
    createdBy: {
        type:Schema.Types.ObjectId, 
        ref:"User", 
        required: true, 
    }, 
    dueDate : {
      type: Date, 
      default: null, 
    },
    sprint: {
      type: Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
    },
    // AI Prediction fields
    aiComplexity: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    aiRisk: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    aiPriority: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    aiPredictionDate: {
      type: Date,
      default: null,
    },
  },
 {
    timestamps: true, 
 }
); 
 
const TaskModel = mongoose
    .model<TaskDocument>("Task", taskSchema); 
export default TaskModel;