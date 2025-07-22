import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import axios from 'axios';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/auth-provider';
import useWorkspaceId from '@/hooks/use-workspace-id';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent } from '@/components/ui/dialog';
import EditTaskForm from './edit-task-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function TaskViewDialog({ open, onOpenChange, task, onTaskUpdate }: { open: boolean; onOpenChange: (open: boolean) => void; task?: any; onTaskUpdate?: () => void }) {
  const { user } = useAuthContext();
  const [tab, setTab] = useState("comments");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const workspaceId = useWorkspaceId();
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];
  const [mentionDropdown, setMentionDropdown] = useState<{ open: boolean; index: number; query: string; position: { top: number; left: number } }>({ open: false, index: 0, query: '', position: { top: 0, left: 0 } });

  // Handle @ mention trigger
  const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComment(value);
    const cursorPos = e.target.selectionStart;
    const textUpToCursor = value.slice(0, cursorPos);
    const match = /@([\w]*)$/.exec(textUpToCursor);
    if (match) {
      // Find position for dropdown (simple, not pixel-perfect)
      setMentionDropdown({
        open: true,
        index: 0,
        query: match[1],
        position: { top: e.target.offsetTop + 30, left: e.target.offsetLeft + 10 },
      });
    } else {
      setMentionDropdown((d) => ({ ...d, open: false }));
    }
  };

  // Filter members for mention
  const filteredMembers = mentionDropdown.query
    ? members.filter((m: any) => m.userId.name.toLowerCase().includes(mentionDropdown.query.toLowerCase()))
    : members;

  // Insert mention at cursor
  const handleSelectMention = (member: any) => {
    const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const cursorPos = textarea.selectionStart;
    const before = comment.slice(0, cursorPos).replace(/@([\w]*)$/, `@${member.userId.name} `);
    const after = comment.slice(cursorPos);
    setComment(before + after);
    setMentionDropdown((d) => ({ ...d, open: false }));
    setTimeout(() => textarea.focus(), 0);
  };

  // Highlight mentions in comments
  const highlightMentions = (text: string) => {
    if (!members.length) return text;
    let result = text;
    members.forEach((m: any) => {
      const regex = new RegExp(`@${m.userId.name}`, 'g');
      result = result.replace(regex, `<span class='bg-purple-100 text-purple-700 rounded px-1'>@${m.userId.name}</span>`);
    });
    return result;
  };

  // Fetch comments when dialog opens or task changes
  useEffect(() => {
    if (!open || !task?._id) return;
    setLoadingComments(true);
    setError(null);
    axios.get(`/api/task/${task._id}/comments`)
      .then(res => setComments(res.data.comments))
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoadingComments(false));
  }, [open, task?._id]);

  const handleQuickReply = (reply: string) => {
    setComment(reply);
  };

  const handlePublish = async () => {
    if (!comment.trim() || !task?._id) return;
    setPosting(true);
    try {
      const res = await axios.post(`/api/task/${task._id}/comments`, { message: comment });
      setComments((prev) => [...prev, res.data.comment]);
      setComment("");
    } catch (e) {
      toast.toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleEditComment = async (commentId: string, newMessage: string) => {
    if (!task?._id) return;
    try {
      const res = await axios.patch(`/api/task/${task._id}/comments/${commentId}`, { message: newMessage });
      setComments((prev) => prev.map((c) => c._id === commentId ? res.data.comment : c));
    } catch (e) {
      toast.toast({ title: 'Error', description: 'Failed to edit comment', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task?._id) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await axios.delete(`/api/task/${task._id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (e) {
      toast.toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const editingTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingCommentId && editingTextareaRef.current) {
      editingTextareaRef.current.focus();
    }
  }, [editingCommentId]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, c: any) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editingMessage.trim()) {
      handleEditComment(c._id, editingMessage);
      setEditingCommentId(null);
    }
  };

  const openDeleteDialog = (commentId: string) => {
    setDeletingCommentId(commentId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCommentId) return;
    setDeleteLoading(true);
    await handleDeleteComment(deletingCommentId);
    setDeleteLoading(false);
    setDeleteConfirmOpen(false);
    setDeletingCommentId(null);
  };

  const [editMode, setEditMode] = useState(false);

  const handleEditSave = () => {
    setEditMode(false);
    onTaskUpdate?.();
  };
  const handleEditCancel = () => {
    setEditMode(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 bg-[#fafbfc] rounded-2xl shadow-xl">
        {editMode ? (
          <div className="p-8">
            <EditTaskForm task={task} onClose={handleEditSave} />
            <Button variant="ghost" className="mt-2" onClick={handleEditCancel}>Cancel</Button>
          </div>
        ) : (
          <>
            <div className="p-8 pb-0">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-3xl font-bold mb-4 flex items-center gap-2">{task.title}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="ml-2 p-1.5" onClick={() => setEditMode(true)} aria-label="Edit Task">
                          <Pencil className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Task</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-24">Assignee</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={task.assignedTo?.profilePicture || ""} alt={task.assignedTo?.name} />
                      <AvatarFallback>{task.assignedTo?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800">{task.assignedTo?.name || "Unassigned"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-24">Due Date</span>
                  <span className="flex items-center gap-1 text-gray-800 text-sm">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No due date"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-24">Project</span>
                  <span className="flex items-center gap-1 text-gray-800 text-sm">
                    {task.project?.emoji} {task.project?.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-24">Status</span>
                  <Badge>{task.status}</Badge>
                  <span className="text-gray-500 text-sm w-24">Priority</span>
                  <Badge>{task.priority}</Badge>
                </div>
              </div>
            </div>
            <div className="border-b" />
            <div className="px-8 pt-4 pb-8">
              <div className="flex gap-8 mb-4 border-b">
                <button className={`pb-2 px-1 border-b-2 text-base font-medium ${tab === "comments" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("comments")}>Comments <span className="ml-1 text-xs bg-gray-200 rounded px-1">{comments.length}</span></button>
                <button className={`pb-2 px-1 border-b-2 text-base font-medium ${tab === "description" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("description")}>Description</button>
              </div>
              {tab === "comments" && (
                <div>
                  <div className="mb-4">
                    <div className="bg-white rounded-lg p-3 flex flex-col gap-2 border border-gray-200">
                      <Textarea
                        id="comment-textarea"
                        className="resize-none min-h-[48px] border-none focus:ring-0"
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={handleCommentInput}
                      />
                      {mentionDropdown.open && filteredMembers.length > 0 && (
                        <div style={{ position: 'absolute', top: mentionDropdown.position.top, left: mentionDropdown.position.left, zIndex: 50 }} className="bg-white border rounded shadow-md w-48 max-h-40 overflow-y-auto">
                          {filteredMembers.map((m: any, idx: number) => (
                            <div
                              key={m.userId._id}
                              className={`px-3 py-2 cursor-pointer hover:bg-purple-100 ${mentionDropdown.index === idx ? 'bg-purple-50' : ''}`}
                              onClick={() => handleSelectMention(m)}
                            >
                              <span className="font-medium">{m.userId.name}</span>
                              <span className="ml-2 text-xs text-gray-400">@{m.userId.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button size="sm" onClick={handlePublish} disabled={!comment.trim() || posting}>
                          {posting ? 'Publishing...' : 'Publish'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {loadingComments ? (
                    <div className="text-center text-gray-400 py-4">Loading comments...</div>
                  ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-60 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center text-gray-400">No comments yet.</div>
                      ) : comments.map((c: any) => {
                        const isOwn = user && c.userId?._id === user._id;
                        return (
                          <div key={c._id} className="flex gap-3 items-start group">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={c.userId?.profilePicture} alt={c.userId?.name} />
                              <AvatarFallback>{c.userId?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex gap-2 items-center">
                                <span className="font-medium text-sm text-gray-900">{c.userId?.name}</span>
                                <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'PPP p')}</span>
                                {isOwn && (
                                  <span className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      className="text-xs text-blue-600 hover:text-blue-800 p-1"
                                      title="Edit"
                                      onClick={() => { setEditingCommentId(c._id); setEditingMessage(c.message); }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      className="text-xs text-red-600 hover:text-red-800 p-1"
                                      title="Delete"
                                      onClick={() => openDeleteDialog(c._id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </span>
                                )}
                              </div>
                              {editingCommentId === c._id ? (
                                <div className="flex gap-2 mt-1 items-center">
                                  <Textarea
                                    ref={editingTextareaRef}
                                    className="resize-none min-h-[32px] border"
                                    value={editingMessage}
                                    onChange={e => setEditingMessage(e.target.value)}
                                    onKeyDown={e => handleEditKeyDown(e, c)}
                                  />
                                  <Button size="sm" onClick={() => { handleEditComment(c._id, editingMessage); setEditingCommentId(null); }} disabled={!editingMessage.trim() || editingMessage === c.message}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>
                                    Cancel
                                  </Button>
                                  <span className="text-xs text-gray-400 ml-2">Editing…</span>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-800 mt-0.5" dangerouslySetInnerHTML={{ __html: highlightMentions(c.message) }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {tab === "description" && (
                <div className="bg-white rounded-lg border border-gray-200 p-5 mt-2">
                  <div className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <span>Description</span>
                  </div>
                  {task.description && task.description.trim() ? (
                    <div className="text-gray-800 text-base whitespace-pre-line leading-relaxed">
                      {task.description}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-8-4h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-base">No description provided for this task.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
      {/* Delete confirmation dialog */}
      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <ConfirmDialogContent className="max-w-xs text-center">
          <div className="mb-4">Are you sure you want to delete this comment?</div>
          <div className="flex justify-center gap-2">
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
          </div>
        </ConfirmDialogContent>
      </ConfirmDialog>
    </Dialog>
  );
} 