import mongoose, { Schema, Document } from 'mongoose';

export interface FileDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  uploadedAt: Date;
}

const FileSchema = new Schema<FileDocument>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model<FileDocument>('File', FileSchema); 