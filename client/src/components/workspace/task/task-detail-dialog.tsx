import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { User, Calendar as CalendarIcon, Tag } from "lucide-react";

// Mock data for demonstration
const mockTask = {
  title: "Mobile App Exploration",
  assignee: {
    name: "Roxana Johnsson",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  date: "12 Sep 2022",
  tags: [
    { label: "Pending", color: "bg-yellow-200 text-yellow-800" },
    { label: "Moodboard", color: "bg-blue-100 text-blue-700" },
  ],
  comments: [
    {
      id: 1,
      user: {
        name: "Roxana Johnsson",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      time: "6m ago",
      text: "Hi Adam! Could you take quick look at these Landing Page designs?",
    },
    {
      id: 2,
      user: {
        name: "Adam Smith",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      time: "2m ago",
      text: "Thanks for sharing! Looks great!",
    },
  ],
};

const quickReplies = ["Thanks for sharing", "Perfect!"];

export default function TaskDetailDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState("comments");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(mockTask.comments);

  const handleQuickReply = (reply: string) => {
    setComment(reply);
  };

  const handlePublish = () => {
    if (comment.trim()) {
      setComments([
        ...comments,
        {
          id: Date.now(),
          user: mockTask.assignee,
          time: "now",
          text: comment,
        },
      ]);
      setComment("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">{mockTask.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm w-20">Assignee</span>
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarImage src={mockTask.assignee.avatar} alt={mockTask.assignee.name} />
                <AvatarFallback>{mockTask.assignee.name[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800">{mockTask.assignee.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm w-20">Date</span>
            <span className="flex items-center gap-1 text-gray-800 text-sm">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {mockTask.date}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm w-20">Tags</span>
            <div className="flex gap-2">
              {mockTask.tags.map((tag) => (
                <span key={tag.label} className={`px-2 py-0.5 rounded text-xs font-medium ${tag.color}`}>{tag.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-b mb-2" />
        <div>
          <div className="flex gap-6 mb-4 border-b">
            <button className={`pb-2 px-1 border-b-2 text-sm font-medium ${tab === "comments" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("comments")}>Comments</button>
            <button className={`pb-2 px-1 border-b-2 text-sm font-medium ${tab === "description" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("description")}>Description</button>
            <button className={`pb-2 px-1 border-b-2 text-sm font-medium ${tab === "settings" ? "border-black" : "border-transparent text-gray-400"}`} onClick={() => setTab("settings")}>Settings</button>
          </div>
          {tab === "comments" && (
            <div>
              <div className="mb-3">
                <div className="bg-gray-100 rounded-lg p-2 flex flex-col gap-2">
                  <Textarea
                    className="resize-none min-h-[48px]"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        className="px-2 py-0.5 bg-gray-200 rounded text-xs hover:bg-gray-300"
                        onClick={() => handleQuickReply(reply)}
                        type="button"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handlePublish} disabled={!comment.trim()}>
                      Publish
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 max-h-60 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.user.avatar} alt={c.user.name} />
                      <AvatarFallback>{c.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex gap-2 items-center">
                        <span className="font-medium text-sm text-gray-900">{c.user.name}</span>
                        <span className="text-xs text-gray-400">{c.time}</span>
                      </div>
                      <div className="text-sm text-gray-800 mt-0.5">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "description" && (
            <div className="text-gray-700 text-sm p-2">Task description goes here...</div>
          )}
          {tab === "settings" && (
            <div className="text-gray-700 text-sm p-2">Task settings go here...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 