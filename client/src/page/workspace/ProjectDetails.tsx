// ProjectDetails.tsx
// This file contains the main Project Details page, including analytics, tasks, activity log, events, and sidebar for a project workspace.
// It handles fetching project data, members, files, tasks, and rendering tabs for analytics, tasks, activity log, and events.
// Each major component and function is commented inline for clarity.
import { Separator } from "@/components/ui/separator";
import ProjectAnalytics from "@/components/workspace/project/project-analytics";
import ProjectHeader from "@/components/workspace/project/project-header";
import TaskTable from "@/components/workspace/task/task-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import {Loader2, Paperclip, Link as Star, Pin, PinOff, Calendar, Trash2 } from 'lucide-react';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { getAllTasksQueryFn } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toast, ToastProvider, ToastTitle, ToastDescription, ToastViewport } from '@/components/ui/toast';
import { useRef } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import ScheduleMeeting from './ScheduleMeeting';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import SprintManagement from '@/components/workspace/sprint/sprint-management';

function getActivityClass(type: string) {
  // Return appropriate CSS class based on activity type
  if (type.includes('meeting')) return 'meeting-activity';
  if (type.includes('sprint')) return 'activity-sprint';
  if (type.includes('task')) return 'activity-task';
  if (type.includes('project')) return 'activity-project';
  if (type.includes('file')) return 'activity-file';
  if (type.includes('workspace')) return 'activity-workspace';
  if (type.includes('comment')) return 'activity-comment';
  return '';
}

function getActivityIcon(type: string) {
  // All activity icons are black dots for consistency
  return <span className="block w-3 h-3 rounded-full bg-black" title="Activity" />;
}

function groupByDay(activities: any[]) {
  const groups: Record<string, any[]> = {};
  activities.forEach((a) => {
    const day = format(new Date(a.createdAt), 'PPP');
    if (!groups[day]) groups[day] = [];
    groups[day].push(a);
  });
  return groups;
}

function ActivityLogTab({ onPinChange }: { onPinChange?: () => void }) {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mentionDropdown, setMentionDropdown] = useState<{ open: boolean; index: number; query: string; type: 'member' | 'task'; position: { top: number; left: number } }>({ open: false, index: 0, query: '', type: 'member', position: { top: 0, left: 0 } });

  // Fetch members
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];

  // Fetch tasks for the project
  const { data: taskData } = useQuery({
    queryKey: ['all-tasks', workspaceId, projectId],
    queryFn: () => getAllTasksQueryFn({ workspaceId, projectId, pageNumber: undefined, pageSize: undefined }),
    enabled: !!workspaceId && !!projectId,
  });
  const tasks = taskData?.tasks || [];

  // Handle @ and # mention trigger
  const handleCommentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setComment(value);
    const cursorPos = e.target.selectionStart;
    const textUpToCursor = value.slice(0, cursorPos ?? 0);
    const atMatch = /@([\w]*)$/.exec(textUpToCursor);
    const hashMatch = /#([\w]*)$/.exec(textUpToCursor);
    if (atMatch) {
      setMentionDropdown({
        open: true,
        index: 0,
        query: atMatch[1],
        type: 'member',
        position: { top: e.target.offsetTop + 30, left: e.target.offsetLeft + 10 },
      });
    } else if (hashMatch) {
      setMentionDropdown({
        open: true,
        index: 0,
        query: hashMatch[1],
        type: 'task',
        position: { top: e.target.offsetTop + 30, left: e.target.offsetLeft + 10 },
      });
    } else {
      setMentionDropdown((d) => ({ ...d, open: false }));
    }
  };

  // Filter for dropdown
  const filteredMembers = mentionDropdown.type === 'member' && mentionDropdown.query
    ? members.filter((m: any) => m.userId.name.toLowerCase().includes(mentionDropdown.query.toLowerCase()))
    : members;
  const filteredTasks = mentionDropdown.type === 'task' && mentionDropdown.query
    ? tasks.filter((t: any) => t.title.toLowerCase().includes(mentionDropdown.query.toLowerCase()))
    : tasks;

  // Insert mention at cursor
  const handleSelectMention = (item: any) => {
    const input = document.getElementById('activity-comment-input') as HTMLInputElement;
    if (!input) return;
    const cursorPos = input.selectionStart ?? 0;
    let before, after;
    if (mentionDropdown.type === 'member') {
      before = comment.slice(0, cursorPos).replace(/@([\w]*)$/, `@${item.userId.name} `);
    } else {
      before = comment.slice(0, cursorPos).replace(/#([\w]*)$/, `#${item.title} `);
    }
    after = comment.slice(cursorPos);
    setComment(before + after);
    setMentionDropdown((d) => ({ ...d, open: false }));
    setTimeout(() => input.focus(), 0);
  };

  // Highlight mentions in comments
  const highlightMentions = (text: string) => {
    let result = text;
    members.forEach((m: any) => {
      const regex = new RegExp(`@${m.userId.name}`, 'g');
      result = result.replace(regex, `<span class='bg-purple-100 text-purple-700 rounded px-1'>@${m.userId.name}</span>`);
    });
    tasks.forEach((t: any) => {
      const regex = new RegExp(`#${t.title}`, 'g');
      result = result.replace(regex, `<span class='bg-blue-100 text-blue-700 rounded px-1'>#${t.title}</span>`);
    });
    return result;
  };

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    axios.get(`/api/project/${projectId}/activities`)
      .then(res => {
        console.log('Activity API response:', res.data);
        setActivities(res.data.activities);
      })
      .catch(() => setError('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handlePost = async () => {
    if (!comment.trim() || !projectId) return;
    setPosting(true);
    try {
      const res = await axios.post(`/api/project/${projectId}/activities`, { type: 'comment', message: comment });
      setActivities((prev) => [res.data.activity, ...prev]);
      setComment('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  // Pin/unpin handlers
  const handlePin = async (activityId: string) => {
    await axios.patch(`/api/project/activities/${activityId}/pin`);
    setActivities((prev) => prev.map(a => a._id === activityId ? { ...a, pinned: true } : a));
    onPinChange?.();
  };
  const handleUnpin = async (activityId: string) => {
    await axios.patch(`/api/project/activities/${activityId}/unpin`);
    setActivities((prev) => prev.map(a => a._id === activityId ? { ...a, pinned: false } : a));
    onPinChange?.();
  };

  // Filtering and searching
  const filteredActivities = activities.filter((a: any) => {
    if (filter === 'comment' && !a.type.includes('comment')) return false;
    if (filter === 'file' && a.type !== 'file_upload') return false;
    if (filter !== 'all' && filter !== 'comment' && filter !== 'file' && a.type !== filter) return false;
    if (search && !a.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const grouped = groupByDay(filteredActivities);
  const days = Object.keys(grouped);

  console.log('Activities to render:', activities);

  return (
    <div className="py-4 w-full">
      {/* Search and filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Comment or type '/' for comments"
          value={comment}
          onChange={handleCommentInput}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
          className="mb-0 flex-1"
          id="activity-comment-input"
        />
        {mentionDropdown.open && (
          <div style={{ position: 'absolute', top: mentionDropdown.position.top, left: mentionDropdown.position.left, zIndex: 50 }} className="bg-white border rounded shadow-md w-56 max-h-40 overflow-y-auto">
            {mentionDropdown.type === 'member' && filteredMembers.map((m: any, idx: number) => (
              <div
                key={m.userId._id}
                className={`px-3 py-2 cursor-pointer hover:bg-purple-100 ${mentionDropdown.index === idx ? 'bg-purple-50' : ''}`}
                onClick={() => handleSelectMention(m)}
              >
                <span className="font-medium">{m.userId.name}</span>
                <span className="ml-2 text-xs text-gray-400">@{m.userId.name}</span>
              </div>
            ))}
            {mentionDropdown.type === 'task' && filteredTasks.map((t: any, idx: number) => (
              <div
                key={t._id}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${mentionDropdown.index === idx ? 'bg-blue-50' : ''}`}
                onClick={() => handleSelectMention(t)}
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-xs text-gray-400">#{t.title}</span>
              </div>
            ))}
          </div>
        )}
        <Button onClick={handlePost} disabled={!comment.trim() || posting} size="sm">
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Input
          placeholder="Search activity..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-48"
        />
        <select
          className="border rounded px-2 py-1 text-sm text-gray-700"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">Show all activity</option>
          <option value="comment">Comments</option>
          <option value="file">Files</option>
          <option value="event">Meetings</option>
          <option value="task_create">Task Created</option>
          <option value="task_update">Task Updated</option>
          <option value="task_delete">Task Deleted</option>
          <option value="project_update">Project Updated</option>
        </select>
      </div>
      <div>
        <div className="font-semibold text-lg mb-2">Activity Log</div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : days.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No activity yet.</div>
        ) : (
          <div className="relative">
            {/* Only render the vertical bar inside the activity log timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
            <div className="space-y-8 pl-10">
              {days.map(day => (
                <div key={day}>
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide pl-2">{day}</div>
                  <div className="space-y-4">
                    {grouped[day].map((a: any, idx: number) => (
                      <div key={a._id} className="relative flex gap-3 items-start bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="absolute left-[-2.1rem] top-6 z-10">
                          {getActivityIcon(a.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={a.userId?.profilePicture} alt={a.userId?.name} />
                              <AvatarFallback>{a.userId?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm text-gray-900">{a.userId?.name}</span>
                            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                            {a.pinned ? (
                              <button className="ml-2 text-yellow-500" title="Unpin" onClick={() => handleUnpin(a._id)}><PinOff className="w-4 h-4" /></button>
                            ) : (
                              <button className="ml-2 text-gray-400 hover:text-yellow-500" title="Pin" onClick={() => handlePin(a._id)}><Pin className="w-4 h-4" /></button>
                            )}
                          </div>
                          <div className={`text-gray-800 text-sm whitespace-pre-line ${getActivityClass(a.type)}`} dangerouslySetInnerHTML={{__html: highlightMentions(formatMeetingTime(a.message))}}>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function highlightMentionsWithMembers(text: string, members: any[], tasks: any[]) {
  let result = text;
  members.forEach((m: any) => {
    const regex = new RegExp(`@${m.userId.name}`, 'g');
    result = result.replace(regex, `<span class='bg-purple-100 text-purple-700 rounded px-1'>@${m.userId.name}</span>`);
  });
  tasks.forEach((t: any) => {
    const regex = new RegExp(`#${t.title}`, 'g');
    result = result.replace(regex, `<span class='bg-blue-100 text-blue-700 rounded px-1'>#${t.title}</span>`);
  });
  return result;
}

function FileUploadCard({ onUpload, uploading, progress, preview, error, success }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Upload a file</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              fileInputRef.current!.files = e.dataTransfer.files;
              onUpload(e.dataTransfer.files[0]);
            }
          }}
          onDragOver={e => e.preventDefault()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded mb-2" />
          ) : (
            <Paperclip className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <span className="text-xs text-gray-500 mb-2">Drag & drop or click to select a file</span>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) onUpload(e.target.files[0]);
            }}
          />
        </div>
        {uploading && (
          <div className="mt-2 w-full">
            <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="absolute left-0 top-0 h-2 bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">Uploading... {progress}%</span>
          </div>
        )}
        {error && (
          <Toast variant="destructive" className="mt-2">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{error}</ToastDescription>
          </Toast>
        )}
        {success && (
          <Toast variant="success" className="mt-2">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>{success}</ToastDescription>
          </Toast>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectSidebar({ project, members, files, pinned, tasks, onFileUpload }: any) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ error?: string; success?: string }>({});
  const [expanded, setExpanded] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setToast({});
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    const formData = new FormData();
    let name = file.name;
    formData.append('name', name);
    formData.append('file', file);
    try {
      await axios.post(`/api/project/${project._id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        },
      });
      setToast({ success: 'File uploaded successfully!' });
      setTimeout(() => setToast({}), 2000);
      setUploading(false);
      setProgress(0);
      setPreview(null);
      onFileUpload && onFileUpload();
    } catch (err: any) {
      setToast({ error: err?.response?.data?.message || 'Upload failed' });
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await axios.delete(`/api/project/files/${fileId}`);
      setToast({ success: 'File deleted successfully!' });
      setTimeout(() => setToast({}), 2000);
      onFileUpload && onFileUpload();
    } catch (err: any) {
      setToast({ error: err?.response?.data?.message || 'Delete failed' });
    }
  };

  return (
    <aside className="w-80 bg-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Project Overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{project?.emoji || '📊'}</span>
            <span className="font-bold text-lg">{project?.name || 'Untitled Project'}</span>
          </div>
          <div className="text-gray-500 text-sm mb-2">{project?.description || 'No description.'}</div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
            <span>Status: <span className="text-gray-700 font-medium">{project?.status || 'Active'}</span></span>
            {project?.createdAt && <span>Created: {format(new Date(project.createdAt), 'PPP')}</span>}
            {project?.updatedAt && <span>Updated: {format(new Date(project.updatedAt), 'PPP')}</span>}
            {project?.dueDate && <span>Due: {format(new Date(project.dueDate), 'PPP')}</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">Members:</span>
            {project?.owner && (
              <Avatar className="w-6 h-6">
                <AvatarImage src={project.owner.profilePicture} alt={project.owner.name} />
                <AvatarFallback>{project.owner.name?.[0]}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {members?.map((m: any) => (
              <Avatar key={m._id} className="w-6 h-6 border-2 border-white -ml-2 first:ml-0">
                <AvatarImage src={m.userId?.profilePicture} alt={m.userId?.name} />
                <AvatarFallback>{m.userId?.name?.[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
        {/* Pinned/Important Items */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 font-semibold text-sm">
            <Star className="w-4 h-4 text-yellow-400" />
            Pinned/Important
          </div>
          {pinned?.length ? (
            <ul className="space-y-2">
              {pinned.map((item: any) => (
                <li key={item._id} className="flex items-center gap-2 text-xs text-gray-700">
                  <Pin className="w-4 h-4 text-yellow-400" />
                  <span dangerouslySetInnerHTML={{__html: highlightMentionsWithMembers(formatMeetingTime(item.message), members, tasks)}}></span>
                </li>
              ))}
            </ul>
          ) : <div className="text-xs text-gray-400">No pinned items.</div>}
        </div>
        {/* File Upload UI moved here */}
        <FileUploadCard
          onUpload={handleUpload}
          uploading={uploading}
          progress={progress}
          preview={preview}
          error={toast.error}
          success={toast.success}
        />
        {/* Files & Attachments in Card with rollup/accordion */}
        <Card className="mb-4">
          <Accordion>
            <AccordionItem value="files">
              <AccordionTrigger>Files & Attachments ({files?.length || 0})</AccordionTrigger>
              <AccordionContent>
                {files?.length ? (
                  <ul className="space-y-2">
                    {files.map((file: any) => (
                      <li key={file._id} className="flex items-center gap-3 text-xs text-gray-700 border-b last:border-b-0 py-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <a
                          href={`/api/project/files/download/${encodeURIComponent(file.fileId || file.name || '')}`}
                          download={file.name || ''}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download"
                        >
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                        </a>
                        <button
                          className="text-red-500 hover:text-red-700 ml-2"
                          title="Delete"
                          onClick={() => handleDelete(file.fileId)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-400 flex flex-col items-center py-4">
                    <Paperclip className="w-8 h-8 mb-2 text-gray-200" />
                    No files uploaded yet.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </aside>
  );
}

// Utility to highlight {{name}} and format meeting times
function highlightNames(message: string) {
  return message.split(/({{.*?}})/g).map((part, i) => {
    if (part.startsWith("{{") && part.endsWith("}}")) {
      const name = part.slice(2, -2);
      return (
        <span key={i} className="bg-purple-100 text-purple-700 rounded px-1 font-semibold">{name}</span>
      );
    }
    return part;
  });
}
function formatMeetingTime(message: string) {
  // Handle the new professional meeting format
  if (message.includes('Scheduled meeting:') && message.includes('📅')) {
    return message; // Already formatted, return as is
  }
  
  // Handle the old format for backward compatibility
  return message.replace(/\(([^)]+) - ([^)]+)\)/, (match, from, to) => {
    try {
      const formattedFrom = format(new Date(from), "PPpp");
      const formattedTo = format(new Date(to), "PPpp");
      return `(${formattedFrom} - ${formattedTo})`;
    } catch {
      return match;
    }
  });
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  const [tab, setTab] = useState("analytics");
  const [pinned, setPinned] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Fetch real project data
  const { data: projectData } = useQuery({
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
    enabled: !!workspaceId && !!projectId,
  });
  const project = projectData?.project;

  // Fetch real members
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];

  // Fetch files for the project
  const { data: filesData, refetch: refetchFiles } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => axios.get(`/api/project/${projectId}/files`).then(res => res.data.files),
    enabled: !!projectId,
  });
  const files = filesData || [];

  // Fetch tasks for the project (for sidebar, etc.)
  const { data: tasksData } = useQuery({
    queryKey: ["all-tasks", workspaceId, projectId],
    queryFn: () => getAllTasksQueryFn({ workspaceId, projectId }),
    enabled: !!workspaceId && !!projectId,
  });
  const tasks = tasksData?.tasks || [];

  // File upload handler (real file upload)
  const handleFileUpload = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const form = e?.currentTarget;
    const nameInput = form?.elements.namedItem('name') as HTMLInputElement;
    const fileInput = form?.elements.namedItem('file') as HTMLInputElement;
    if (!nameInput.value || !fileInput.files || !fileInput.files[0]) return;
    let name = nameInput.value;
    const file = fileInput.files[0];
    // Ensure the name includes the extension
    if (!name.endsWith('.' + file.name.split('.').pop())) {
      name += '.' + file.name.split('.').pop();
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    await axios.post(`/api/project/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    form?.reset();
    refetchFiles();
  };

  // Compute pinned from activities
  const handlePinChange = () => {
    // Refetch or recompute pinned activities
    axios.get(`/api/project/${projectId}/activities`).then(res => {
      setPinned(res.data.activities.filter((a: any) => a.pinned));
    });
  };
  useEffect(() => {
    handlePinChange();
  }, [projectId]);

  useEffect(() => {
    if (tab === "events" && projectId) {
      setEventsLoading(true);
      axios.get(`/api/meetings/events?projectId=${projectId}`)
        .then(res => setUpcomingEvents(res.data.events || []))
        .catch(() => setUpcomingEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, [tab, projectId]);

  return (
    <ToastProvider>
      <div className="w-full flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8 py-4 md:pt-3">
        <div className="flex-1 min-w-0">
          <ProjectHeader />
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="events">Meetings</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics">
              <ProjectAnalytics />
              <Separator />
            </TabsContent>
            <TabsContent value="tasks">
              <TaskTable />
            </TabsContent>
            <TabsContent value="sprints">
              <SprintManagement project={project} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityLogTab onPinChange={handlePinChange} />
            </TabsContent>
            <TabsContent value="events">
              <div className="flex flex-col gap-6">
                {/* Upcoming Events List */}
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Upcoming Meetings</h3>
                  <ul className="space-y-3">
                    {eventsLoading ? (
                      <div>Loading events...</div>
                    ) : upcomingEvents.length === 0 ? (
                      <div className="text-gray-400 text-sm">No upcoming Meetings.</div>
                    ) : (
                      upcomingEvents.map(event => (
                        <li key={event.id} className="rounded-lg border bg-white p-4 flex items-center justify-between gap-4 shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base">{event.summary}</div>
                            <div className="text-xs text-gray-500">
                              {event.start?.dateTime?.slice(0, 16).replace('T', ' | ')} - {event.end?.dateTime?.slice(11, 16)}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Guests: {(event.attendees || []).map((a: any) => a.email).join(', ')}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 w-full max-w-xs">
                            {event.hangoutLink && (
                              <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow h-9 px-4 py-2 bg-black text-white hover:bg-zinc-800 mb-2">
                                Join
                              </a>
                            )}
                            {/* Optionally, add a Delete button here */}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <ProjectSidebar
          project={project}
          members={members}
          files={files}
          pinned={pinned}
          tasks={tasks}
          onFileUpload={refetchFiles}
        />
      </div>
      <ToastViewport />
    </ToastProvider>
  );
};

export default ProjectDetails;