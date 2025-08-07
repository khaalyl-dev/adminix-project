// Service for handling business logic related to workspace or project members.
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import WorkspaceModel from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/app.error";
import UserModel from "../models/user.model";
import CSVWorkerModel from "../models/csv-worker.model";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  // If the user is SUPER_ADMIN, allow access to any workspace (view-only)
  const user = await UserModel.findById(userId);
  if (user && user.role === Roles.SUPER_ADMIN) {
    // SUPER_ADMIN can view all workspaces, even if not a member
    return { role: Roles.SUPER_ADMIN };
  }

  // Existing logic for members
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  // Find workspace by invite code
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  // Check if user is already a member
  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  if (existingMember) {
    throw new BadRequestException("You are already a member of this workspace");
  }

  const role = await RoleModel.findOne({ name: Roles.MEMBER });

  if (!role) {
    throw new NotFoundException("Role not found");
  }

  // Add user to workspace as a member
  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  return { workspaceId: workspace._id, role: role.name };
};

export const importCSVWorkersService = async (
  workspaceId: string,
  csvData: string
) => {
  try {
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['Name', 'Role', 'Technologies', 'Experience'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Missing required headers: ${missingHeaders.join(', ')}`
      );
    }

    const importedWorkers = [];
    const errors = [];

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map(v => v.trim());
        const name = values[headers.indexOf('Name')];
        const role = values[headers.indexOf('Role')];
        const technologies = values[headers.indexOf('Technologies')].split(':').map(t => t.trim());
        const experience = values[headers.indexOf('Experience')].split(':').map(e => parseInt(e.trim()));

        // Validate data
        if (!name || !role) {
          errors.push(`Line ${i + 1}: Missing name or role`);
          continue;
        }

        if (experience.some(e => isNaN(e))) {
          errors.push(`Line ${i + 1}: Invalid experience values`);
          continue;
        }

        // Check if worker already exists
        const existingWorker = await CSVWorkerModel.findOne({
          name,
          workspaceId,
        });

        if (existingWorker) {
          errors.push(`Line ${i + 1}: Worker "${name}" already exists`);
          continue;
        }

        // Create new CSV worker
        const csvWorker = new CSVWorkerModel({
          name,
          role,
          technologies,
          experience,
          workspaceId,
          source: 'workers.csv',
        });

        await csvWorker.save();
        importedWorkers.push({
          name,
          role,
          technologies: technologies.length,
          experience: experience.length,
        });

      } catch (error) {
        errors.push(`Line ${i + 1}: Invalid data format`);
      }
    }

    return {
      imported: importedWorkers,
      errors,
      totalImported: importedWorkers.length,
      totalErrors: errors.length,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new BadRequestException(`Failed to import CSV: ${errorMessage}`);
  }
};

export const getCSVWorkersService = async (workspaceId: string) => {
  const csvWorkers = await CSVWorkerModel.find({ workspaceId })
    .sort({ name: 1 })
    .lean();

  return csvWorkers;
};