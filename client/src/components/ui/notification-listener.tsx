import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";

let socket: Socket | null = null;

const NotificationListener = () => {
  const { toast } = useToast();
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    if (!workspaceId) return;
    if (!socket) {
      socket = io(import.meta.env.VITE_BACKEND_URL, {
        withCredentials: true,
      });
    }
    // Join the workspace room
    socket.emit("join", { workspaceId });

    // Listen for notifications
    socket.on("notification", (notification) => {
      toast({
        title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1) + " Notification",
        description: notification.message,
      });
    });

    return () => {
      if (socket) {
        socket.off("notification");
        socket.emit("leave", { workspaceId });
      }
    };
  }, [workspaceId, toast]);

  return null;
};

export default NotificationListener; 