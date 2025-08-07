// delete-sprint-dialog.tsx
// This file provides a dialog component for confirming sprint deletion with options to handle related tasks.
import React, { useState } from "react";
import { AlertTriangle, Trash2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SprintType } from "@/types/api.type";

interface DeleteSprintDialogProps {
  sprint: SprintType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteTasks: boolean) => void;
  isLoading?: boolean;
  taskCount?: number;
}

const DeleteSprintDialog = ({ sprint, isOpen, onClose, onConfirm, isLoading = false, taskCount = 0 }: DeleteSprintDialogProps) => {
  const [deleteTasks, setDeleteTasks] = useState<boolean>(false);

  if (!sprint) return null;

  const handleConfirm = () => {
    onConfirm(deleteTasks);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Sprint
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{sprint.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Related Tasks</h4>
            <p className="text-sm text-yellow-700">
              This sprint has <strong>{taskCount} task{taskCount !== 1 ? 's' : ''}</strong> assigned to it. Choose how you want to handle these tasks:
            </p>
          </div>

          <RadioGroup value={deleteTasks ? "delete" : "unassign"} onValueChange={(value) => setDeleteTasks(value === "delete")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unassign" id="unassign" />
              <Label htmlFor="unassign" className="flex items-center gap-2 cursor-pointer">
                <Unlink className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium">Unassign tasks from sprint</div>
                  <div className="text-sm text-gray-500">
                    Keep all tasks but remove them from this sprint
                  </div>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delete" id="delete" />
              <Label htmlFor="delete" className="flex items-center gap-2 cursor-pointer">
                <Trash2 className="w-4 h-4 text-red-600" />
                <div>
                  <div className="font-medium">Delete all related tasks</div>
                  <div className="text-sm text-gray-500">
                    Permanently delete all tasks assigned to this sprint
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Sprint
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSprintDialog; 