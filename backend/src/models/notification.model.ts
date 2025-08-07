// Mongoose model for notifications sent to users in the backend application.
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | string;
  workspaceId: mongoose.Types.ObjectId | string;
  type: 'workspace' | 'project' | 'task' | 'sprint';
  message: string;
  createdAt: Date;
  read: boolean;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  type: { type: String, enum: ['workspace', 'project', 'task', 'sprint'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export default mongoose.model<INotification>('Notification', NotificationSchema); 