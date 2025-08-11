// Mongoose model for tracking user or system activities in the backend application.
import mongoose, { Schema, Document } from 'mongoose';

export interface ActivityDocument extends Document {
  projectId?: mongoose.Types.ObjectId; // Optional for workspace-level activities
  workspaceId?: mongoose.Types.ObjectId; // For workspace-level activities
  userId: mongoose.Types.ObjectId;
  type: string; // e.g., 'comment', 'file', 'event', 'workspace_create', etc.
  message: string;
  meta?: Record<string, any>;
  createdAt: Date;
  pinned: boolean;
}

const ActivitySchema = new Schema<ActivityDocument>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false },
});

export default mongoose.model<ActivityDocument>('Activity', ActivitySchema); 