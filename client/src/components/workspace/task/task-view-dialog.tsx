// task-view-dialog.tsx
// This file provides the dialog/modal component for viewing detailed information about a task, including comments, activity, and task actions.
// Each major component and function is commented inline for clarity.
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
import { Pencil, Trash2, Loader2, Brain, TrendingUp, AlertTriangle, Target, Zap, CheckCircle } from 'lucide-react';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent } from '@/components/ui/dialog';
import EditTaskForm from './edit-task-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { updateTaskAIPredictionsMutationFn } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

  // AI Prediction states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [taskPrediction, setTaskPrediction] = useState<any>(null);
  const queryClient = useQueryClient();

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

  // AI Prediction functions
  const predictTask = async () => {
    const response = await fetch('http://localhost:3000/predict/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_text: task.title + (task.description ? ' ' + task.description : '') })
    });
    if (!response.ok) throw new Error('Task prediction failed');
    return response.json();
  };

  const handleAiPrediction = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);
    
    try {
      const prediction = await predictTask();
      setTaskPrediction(prediction);
      setAiSuccess('Task prediction completed successfully');
    } catch (err: any) {
      setAiError(err.message || 'An error occurred during prediction');
    } finally {
      setAiLoading(false);
    }
  };

  const updateAIPredictionsMutation = useMutation({
    mutationFn: updateTaskAIPredictionsMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
      toast.toast({ title: 'Success', description: 'AI predictions saved to task', variant: 'success' });
      onTaskUpdate?.();
    },
    onError: (error: any) => {
      toast.toast({ title: 'Error', description: error.message || 'Failed to save AI predictions', variant: 'destructive' });
    },
  });

  const handleSaveAIPredictions = () => {
    if (!taskPrediction || !task) return;
    
    updateAIPredictionsMutation.mutate({
      workspaceId: workspaceId!,
      projectId: task.project._id,
      taskId: task._id,
      predictions: {
        aiComplexity: taskPrediction.complexity,
        aiRisk: taskPrediction.risk,
        aiPriority: taskPrediction.priority,
      },
    });
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return Number(num).toFixed(decimals);
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
                <button className={`pb-2 px-1 border-b-2 text-base font-medium ${tab === "ai-predictions" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("ai-predictions")}>AI Predictions</button>
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

              {tab === "ai-predictions" && (
                <div className="space-y-4">
                  {/* Alert Messages */}
                  {(aiError || aiSuccess) && (
                    <div className="mb-4">
                      {aiError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <span className="text-red-800">{aiError}</span>
                          <Button variant="ghost" size="sm" onClick={() => setAiError(null)}>×</Button>
                        </div>
                      )}
                      {aiSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-800">{aiSuccess}</span>
                          <Button variant="ghost" size="sm" onClick={() => setAiSuccess(null)}>×</Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Prediction Button */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">AI Task Analysis</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Get AI-powered insights for complexity, risk, and priority based on task content.
                    </p>
                    <Button
                      onClick={handleAiPrediction}
                      disabled={aiLoading}
                      className="w-full"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Analyze Task
                        </>
                      )}
                    </Button>
                  </div>

                  {/* AI Prediction Results */}
                  {taskPrediction && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-purple-700 font-medium">Complexity</span>
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="text-2xl font-bold text-purple-900">
                              {formatNumber(taskPrediction.complexity, 1)}/10
                            </div>
                            <Progress value={(taskPrediction.complexity / 10) * 100} className="mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-red-700 font-medium">Risk</span>
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="text-2xl font-bold text-red-900">
                              {formatNumber(taskPrediction.risk, 1)}/10
                            </div>
                            <Progress value={(taskPrediction.risk / 10) * 100} className="mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-700 font-medium">Priority</span>
                              <Target className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                              {formatNumber(taskPrediction.priority, 1)}/10
                            </div>
                            <Progress value={(taskPrediction.priority / 10) * 100} className="mt-2" />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Save Predictions Button */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Save AI Predictions</h4>
                            <p className="text-sm text-gray-600">Store these predictions in the task for future reference</p>
                          </div>
                          <Button
                            onClick={handleSaveAIPredictions}
                            disabled={updateAIPredictionsMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {updateAIPredictionsMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Predictions'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Existing AI Predictions */}
                  {(task.aiComplexity || task.aiRisk || task.aiPriority) && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-lg">Saved AI Predictions</h3>
                        {task.aiPredictionDate && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(task.aiPredictionDate), 'PPP')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {task.aiComplexity && (
                          <div className="bg-white rounded p-3">
                            <div className="text-sm text-gray-600">Complexity</div>
                            <div className="text-lg font-bold text-purple-900">{task.aiComplexity}/10</div>
                          </div>
                        )}
                        {task.aiRisk && (
                          <div className="bg-white rounded p-3">
                            <div className="text-sm text-gray-600">Risk</div>
                            <div className="text-lg font-bold text-red-900">{task.aiRisk}/10</div>
                          </div>
                        )}
                        {task.aiPriority && (
                          <div className="bg-white rounded p-3">
                            <div className="text-sm text-gray-600">Priority</div>
                            <div className="text-lg font-bold text-blue-900">{task.aiPriority}/10</div>
                          </div>
                        )}
                      </div>
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