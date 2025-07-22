

// ProjectSetup page guides the user through creating a workspace, project, and tasks with a multi-step form and live preview.
// NOTE: To edit an existing workspace, navigate to `/ProjectSetup/:workspaceId`. For a new workspace, use `/ProjectSetup`.
import React, { useState, useEffect } from "react";
import "./ProjectSetup.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  createWorkspaceMutationFn,
  createProjectMutationFn,
  createTaskMutationFn,
  editWorkspaceMutationFn,
} from "@/lib/api";
import useAuth from "@/hooks/api/use-auth";
import useWorkspaceId from "@/hooks/use-workspace-id";
import useGetProjectsInWorkspaceQuery from "@/hooks/api/use-get-projects";
import useGetWorkspaceQuery from "@/hooks/api/use-get-workspace";

// AnimatedLetters animates each letter of a string for a smooth text reveal effect
function AnimatedLetters({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, idx) => (
        <span
          key={idx}
          className="fade-in-letter"
          style={{ animationDelay: `${idx * 0.04}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}


const ProjectSetup: React.FC = () => {
  // State for each step of the setup process
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState(1); // Tracks which step the user is on
  const [tasks, setTasks] = useState<string[]>(["", ""]); // At least 2 tasks by default
  const [projectDescription, setProjectDescription] = useState("");

  // React Query and navigation hooks
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: authData } = useAuth();
  const workspaceId = useWorkspaceId();
  const { data: projectsData, isLoading } = useGetProjectsInWorkspaceQuery({ workspaceId });
  const hasProjects = !!(projectsData && projectsData.projects && projectsData.projects.length > 0);
  const { data: workspaceData, isLoading: workspaceLoading } = useGetWorkspaceQuery(workspaceId);
  const workspace = workspaceData?.workspace;

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name || "");
      setWorkspaceDescription(workspace.description || "");
    }
  }, [workspace]);

  // If there are already projects, redirect to dashboard
  useEffect(() => {
    if (hasProjects && workspaceId) {
      navigate(`/workspace/${workspaceId}`);
    }
  }, [hasProjects, workspaceId, navigate]);

  // Mutations for creating workspace, project, and tasks
  const { mutateAsync: createWorkspace, isPending: isCreatingWorkspace } = useMutation({
    mutationFn: createWorkspaceMutationFn,
  });
  const { mutateAsync: createProject, isPending: isCreatingProject } = useMutation({
    mutationFn: createProjectMutationFn,
  });
  const { mutateAsync: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: createTaskMutationFn,
  });

  return (
    // Main container for the project setup page
    <div className="page-container">
      <div className="setup-wrapper">
        {/* Left side: Multi-step form */}
        <div className="setup-left">
          {/* Progress bar for steps */}
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="fade-in">
            {/* Step 1: Workspace name and description */}
            {step === 1 ? (
              <>
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  Let's set up your workspace
                </h2>
                <p style={{ color: "#6b7280", marginBottom: 24 }}>
                  What would you like to call your workspace?
                </p>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="Workspace Name"
                  className="input-style"
                />
                <textarea
                  value={workspaceDescription}
                  onChange={e => setWorkspaceDescription(e.target.value)}
                  placeholder="Workspace Description"
                  className="input-style"
                />
                <button
                  className="button-primary"
                  onClick={() => setStep(step + 1)}
                  disabled={!workspaceName.trim()}
                >
                  Continue
                </button>
              </>
            ) : step === 2 ? (
              <>
                {/* Step 2: Project name */}
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
            Let's set up your first project
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
                  What's something your team is working on?
          </p>
          <input
            type="text"
                  placeholder="Enter project name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
                  className="input-style"
                />
                <button
                  className="button-primary"
                  onClick={() => setStep(step + 1)}
                  disabled={!projectName.trim()}
                >
                  Continue
                </button>
                <div style={{ marginTop: "16px" }}>
                  <button
                    className="button-secondary"
                    onClick={() => setStep(step - 1)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
                  >
                    ← Back
                  </button>
            </div>
              </>
            ) : step === 3 ? (
              <>
                {/* Step 3: Project description */}
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  Tell us more about your project
                </h2>
                <p style={{ color: "#6b7280", marginBottom: 24 }}>
                  Add a description to help your team understand the project better
                </p>
                <textarea
                  placeholder="Describe your project goals, timeline, and any important details..."
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  className="input-style"
                  style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }}
                />
                <div style={{ marginTop: "16px" }}>
          <button
                    className="button-primary"
                    onClick={() => setStep(step + 1)}
                    disabled={!projectDescription.trim()}
          >
            Continue
          </button>
        </div>
                <div style={{ marginTop: "16px" }}>
                  <button
                    className="button-secondary"
                    onClick={() => setStep(step - 1)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
                  >
                    ← Back
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 4: Add tasks and create everything */}
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  What are a few tasks that you have to do for {projectName || "project name"}?
                </h2>
                {tasks.map((task, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={idx === 0 ? "e.g. Design homepage" : "e.g. Share timeline with teammates"}
                    value={task}
                    onChange={e => {
                      const newTasks = [...tasks];
                      newTasks[idx] = e.target.value;
                      setTasks(newTasks);
                    }}
                    className="input-style"
                    style={{ marginBottom: 12 }}
                  />
                ))}
                <button
                  className="button-secondary"
                  onClick={() => {
                    if (tasks.length < 5) setTasks([...tasks, ""]);
                  }}
                  disabled={tasks.length >= 5}
                >
                  + Add another task
                </button>
                <br />
                <button
                  className="button-primary"
                  onClick={async () => {
                    try {
                      let finalWorkspaceId = workspaceId;
                      // 1. Update or Create Workspace
                      if (workspaceId) {
                        await editWorkspaceMutationFn({
                          workspaceId,
                          data: {
                            name: workspaceName,
                            description: workspaceDescription,
                          },
                        });
                      } else {
                        const workspaceRes = await createWorkspace({
                          name: workspaceName,
                          description: workspaceDescription,
                        });
                        finalWorkspaceId = workspaceRes.workspace._id;
                      }
                      // 2. Create Project
                      const projectRes = await createProject({
                        workspaceId: finalWorkspaceId,
                        data: {
                          emoji: "📁", // or let user pick later
                          name: projectName,
                          description: projectDescription,
                        },
                      });
                      const projectId = projectRes.project._id;
                      // 3. Create Tasks (only non-empty)
                      const filteredTasks = tasks.filter((task) => task.trim());
                      for (const taskTitle of filteredTasks) {
                        await createTask({
                          workspaceId: finalWorkspaceId,
                          projectId,
                          data: {
                            title: taskTitle,
                            description: "", // or add a description input per task if needed
                            status: "TODO",
                            priority: "MEDIUM",
                            assignedTo: authData?.user?._id || "", // fallback to empty string if not loaded
                            dueDate: new Date().toISOString(), // or let user pick
                          },
                        });
                      }
                      // Invalidate queries to refresh data
                      queryClient.invalidateQueries();
                      toast({
                        title: "Success",
                        description: "Workspace, project, and tasks created!",
                        variant: "success",
                      });
                      // Navigate to the new project page
                      navigate(`/workspace/${finalWorkspaceId}/project/${projectId}`);
                    } catch (error: any) {
                      // Show error toast on failure
                      toast({
                        title: "Error",
                        description: error?.message || "Something went wrong",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={tasks.every((task) => !task.trim()) || isCreatingWorkspace || isCreatingProject || isCreatingTask}
                >
                  {isCreatingWorkspace || isCreatingProject || isCreatingTask ? "Creating..." : "Create Project"}
                </button>
                <div style={{ marginTop: "16px" }}>
                  <button
                    className="button-secondary"
                    onClick={() => setStep(step - 1)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Right Side: Live project preview */}
        <div className="project-preview-outer">
          <div className="browser-preview">
            {/* Browser-like header with colored buttons */}
            <div className="browser-preview-header">
              <div className="browser-preview-header-button1"></div>
              <div className="browser-preview-header-button2"></div>
              <div className="browser-preview-header-button3"></div>
            </div>
            {/* Project preview header with workspace and user info */}
            <div className="project-preview-header">
              <div className="project-preview-chip">
                <svg className="project-preview-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 5C5 6.3805 3.8805 7.5 2.5 7.5C1.1195 7.5 0 6.3805 0 5C0 3.6195 1.1195 2.5 2.5 2.5C3.8805 2.5 5 3.6195 5 5ZM2.5 9.5C1.1195 9.5 0 10.6195 0 12C0 13.3805 1.1195 14.5 2.5 14.5C3.8805 14.5 5 13.3805 5 12C5 10.6195 3.8805 9.5 2.5 9.5ZM2.5 16.5C1.1195 16.5 0 17.6195 0 19C0 20.3805 1.1195 21.5 2.5 21.5C3.8805 21.5 5 20.3805 5 19C5 17.6195 3.8805 16.5 2.5 16.5ZM9 3V7H24V3H9ZM9 14H24V10H9V14ZM9 21H24V17H9V21Z"></path>
                </svg>
              </div>
              <div className="project-preview-title-nav">
                <div className="project-preview-title">
                  {workspaceName ? (
                    <span className="project-preview-pill">
                      <AnimatedLetters text={workspaceName} />
                    </span>
                  ) : (
                    <div className="project-preview-pill-placeholder"></div>
                  )}
                </div>
                <div className="project-preview-nav-empty"></div>
              </div>
              <div className="project-preview-right-children">
                <div>
                  <img
                    className="project-preview-avatar"
                    alt=""
                    src="https://d3ki9tyy5l5ruj.cloudfront.net/obj/fa519ac9192b359a39a682eedc6a05fc0a9c7695/Blue hair woman avatar.svg"
                  />
                </div>
                <div className="project-preview-separator"></div>
                <div className="project-preview-search-bar">
                  <svg className="project-preview-search-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M13.999 28c3.5 0 6.697-1.3 9.154-3.432l6.139 6.139a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414l-6.139-6.139A13.93 13.93 0 0 0 27.999 14c0-7.72-6.28-14-14-14s-14 6.28-14 14 6.28 14 14 14Zm0-26c6.617 0 12 5.383 12 12s-5.383 12-12 12-12-5.383-12-12 5.383-12 12-12Z"></path>
                  </svg>
                </div>
                <div className="project-preview-omnibutton">
                  <svg className="project-preview-plus-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M26,14h-8V6c0-1.1-0.9-2-2-2l0,0c-1.1,0-2,0.9-2,2v8H6c-1.1,0-2,0.9-2,2l0,0c0,1.1,0.9,2,2,2h8v8c0,1.1,0.9,2,2,2l0,0c1.1,0,2-0.9,2-2v-8h8c1.1,0,2-0.9,2-2l0,0C28,14.9,27.1,14,26,14z"></path>
                  </svg>
                </div>
              </div>
            </div>
            {/* Project preview content: workspace/project descriptions and tasks */}
            <div style={{ padding: "32px 24px", maxHeight: "600px", overflowY: "auto" }}>
              {/* Workspace Description Section */}
              {workspaceDescription && (
                <div style={{
                  marginBottom: "16px",
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <h3 style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#495057"
                  }}>
                    Workspace Description
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "#6c757d",
                    margin: 0,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap"
                  }}>
                    {workspaceDescription}
                  </p>
                </div>
              )}
              {/* Project Name Section */}
              {projectName && (
        <div style={{
                  marginBottom: "12px",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "#222"
        }}>
                  <AnimatedLetters text={projectName} />
                </div>
              )}
              {/* Project Description Section */}
              {projectDescription && (
            <div style={{
                  marginBottom: "16px",
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <h3 style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#495057"
                  }}>
                    Project Description
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    lineHeight: "1.5",
                    color: "#6c757d",
                    margin: 0,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap"
                  }}>
                    {projectDescription}
                  </p>
                </div>
              )}
              {/* Placeholder if neither description is set */}
              {!workspaceDescription && !projectDescription && (
              <div style={{
                  marginBottom: "16px",
                  padding: "16px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                  color: "#bbb",
                  textAlign: "center"
              }}>
                  No description provided
              </div>
              )}
              {/* Task list preview */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tasks.map((task, idx) =>
                  task ? (
                    <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                      <svg width="20" height="20" fill="#bbb" style={{ marginRight: 12 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#bbb" strokeWidth="2" fill="none"/><path d="M8 12l2 2 4-4" stroke="#bbb" strokeWidth="2" fill="none"/></svg>
                      <span style={{ fontSize: 18 }}>
                        <AnimatedLetters text={task} />
              </span>
                    </li>
                  ) : (
                    <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 12, opacity: 0.3 }}>
                      <svg width="20" height="20" fill="#eee" style={{ marginRight: 12 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#eee" strokeWidth="2" fill="none"/></svg>
                      <span style={{ fontSize: 18 }} key={task + idx}> </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;