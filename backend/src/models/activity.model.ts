import mongoose, { Schema, Document } from 'mongoose';

export interface ActivityDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string; // e.g., 'comment', 'file', 'event', etc.
  message: string;
  meta?: Record<string, any>;
  createdAt: Date;
  pinned: boolean;
}

const ActivitySchema = new Schema<ActivityDocument>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false },
});

export default mongoose.model<ActivityDocument>('Activity', ActivitySchema); 