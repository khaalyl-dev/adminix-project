// project-header.tsx
// This file provides the header component for project pages, displaying the project name, emoji, and optional actions or navigation.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from "react-router-dom";
import CreateTaskDialog from "../task/create-task-dialog";
import EditProjectDialog from "./edit-project-dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ScheduleMeeting from '@/page/workspace/ScheduleMeeting';
import { Calendar } from 'lucide-react';

const ProjectHeader = () => {
  const param = useParams();
  const projectId = param.projectId as string;

  const workspaceId = useWorkspaceId();

  // Validate required parameters
  if (!projectId) {
    return (
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-3 text-xl font-medium truncate tracking-tight text-red-600">
            Error: Project ID is missing
          </h2>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-3 text-xl font-medium truncate tracking-tight text-red-600">
            Error: Workspace ID is missing
          </h2>
        </div>
      </div>
    );
  }

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["singleProject", projectId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/project/${projectId}/workspace/${workspaceId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Project fetch error:', error);
        throw error;
      }
    },
    staleTime: Infinity,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });



  const project = data?.project;

  // Fallback if no project data is found
  const projectEmoji = project?.emoji || "📊";
  const projectName = project?.name || "Untitled project";

  const renderContent = () => {
    if (isPending) return <span>Loading...</span>;
    if (isError) {
      console.error('Project query error:', error);
      return (
        <span className="text-red-600">
          Error occurred: {error?.message || 'Unknown error'}
        </span>
      );
    }
    return (
      <>
        <span>{projectEmoji}</span>
        {projectName}
      </>
    );
  };
  return (
    <div className="flex items-center justify-between space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-3 text-xl font-medium truncate tracking-tight">
          {renderContent()}
        </h2>
        <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
          <EditProjectDialog project={project} />
        </PermissionsGuard>
      </div>
      <div className="flex gap-2">
        <CreateTaskDialog projectId={projectId} />
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 px-4 py-2 bg-white text-black hover:bg-gray-100"
            >
              <Calendar className="w-4 h-4" />
              Schedule Meeting
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xl w-full">
            <DialogTitle>Schedule a meeting</DialogTitle>
            <ScheduleMeeting />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProjectHeader;
