// Mongoose model for sprints, including their properties and relationships, in the backend application.
import mongoose, { Document, Schema } from "mongoose";

export interface SprintDocument extends Document {
    name: string;
    description: string | null;
    project: mongoose.Types.ObjectId;
    workspace: mongoose.Types.ObjectId;
    sprintNumber: number;
    startDate: Date | null;
    endDate: Date | null;
    capacity: number; // hours per sprint
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const sprintSchema = new Schema<SprintDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
    },
    sprintNumber: {
        type: Number,
        required: true,
        min: 1,
    },
    startDate: {
        type: Date,
        default: null,
    },
    endDate: {
        type: Date,
        default: null,
    },
    capacity: {
        type: Number,
        default: 40, // Default 40 hours per sprint
        min: 1,
    },
    status: {
        type: String,
        enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'PLANNED',
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

// Compound index to ensure unique sprint numbers per project
sprintSchema.index({ project: 1, sprintNumber: 1 }, { unique: true });

const SprintModel = mongoose.model<SprintDocument>("Sprint", sprintSchema);

export default SprintModel; 