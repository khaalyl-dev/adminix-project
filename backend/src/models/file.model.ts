// Mongoose model for files uploaded or managed by the backend application.
import mongoose, { Schema, Document } from 'mongoose';

export interface FileDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  fileId: mongoose.Types.ObjectId;
  url?: string;
  size?: number; // File size in bytes
  mimeType?: string; // MIME type of the file
  originalName?: string; // Original filename from upload
  uploadedAt: Date;
}

const FileSchema = new Schema<FileDocument>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
  url: { type: String }, // optional, for backward compatibility
  size: { type: Number }, // File size in bytes
  mimeType: { type: String }, // MIME type
  originalName: { type: String }, // Original filename
  uploadedAt: { type: Date, default: Date.now },
});

// Add indexes for better performance
FileSchema.index({ projectId: 1, uploadedAt: -1 });
FileSchema.index({ userId: 1 });
FileSchema.index({ fileId: 1 }, { unique: true });

export default mongoose.model<FileDocument>('File', FileSchema);