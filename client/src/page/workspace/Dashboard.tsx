import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import RecentMembers from "@/components/workspace/member/recent-members";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useWorkspaceId from "@/hooks/use-workspace-id";
const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const { data: projectsData, isLoading } = useGetProjectsInWorkspaceQuery({ workspaceId });
  const hasProjects = !!(projectsData && projectsData.projects && projectsData.projects.length > 0);
  return (
    <main className="flex flex-1 flex-col py-4 md:pt-3">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Workspace Overview
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview for this workspace!
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpen}>
            <Plus color="white" />
            New Project
          </Button>
          {!hasProjects && (
            <Button onClick={() => navigate(`/ProjectSetup/${workspaceId}`)}>
              <Plus color="white" />
              Launch Setup Wizard
            </Button>
          )}
        </div>
      </div>
      <WorkspaceAnalytics />
      <div className="mt-4">
        <Tabs defaultValue="projects" className="w-full border rounded-lg p-2">
          <TabsList className="w-full justify-start border-0 bg-gray-50 px-1 h-12">
            <TabsTrigger className="py-2" value="projects">
              Recent Projects
            </TabsTrigger>
            <TabsTrigger className="py-2" value="tasks">
              Recent Tasks
            </TabsTrigger>
            <TabsTrigger className="py-2" value="members">
              Recent Members
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects">
            <RecentProjects />
          </TabsContent>
          <TabsContent value="tasks">
            <RecentTasks />
          </TabsContent>
          <TabsContent value="members">
            <RecentMembers />
          </TabsContent>
        </Tabs>
      </div>
      
    </main>
  );
};

export default WorkspaceDashboard;
