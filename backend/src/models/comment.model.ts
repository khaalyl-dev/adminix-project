// Mongoose model for comments associated with various resources in the backend application.
import mongoose, { Schema, Document } from 'mongoose';

export interface CommentDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const CommentSchema = new Schema<CommentDocument>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<CommentDocument>('Comment', CommentSchema); 