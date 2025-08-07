// Mongoose model for CSV-imported workers in the backend application.
import mongoose, { Document, Schema } from "mongoose";

export interface CSVWorkerDocument extends Document {
  name: string;
  role: string;
  technologies: string[];
  experience: number[];
  workspaceId: mongoose.Types.ObjectId;
  importedAt: Date;
  source: string; // To track if it's from workers.csv or other sources
}

const csvWorkerSchema = new Schema<CSVWorkerDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    technologies: [{
      type: String,
      trim: true,
    }],
    experience: [{
      type: Number,
      min: 0,
      max: 10,
    }],
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "workers.csv",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate workers in the same workspace
csvWorkerSchema.index({ name: 1, workspaceId: 1 }, { unique: true });

const CSVWorkerModel = mongoose.model<CSVWorkerDocument>("CSVWorker", csvWorkerSchema);
export default CSVWorkerModel; 