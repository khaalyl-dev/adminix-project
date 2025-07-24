// use-create-workspace-dialog.tsx
// This file provides a custom React hook for managing the state of the create workspace dialog/modal.
import { parseAsBoolean, useQueryState } from "nuqs";

const useCreateWorkspaceDialog = () => {
  const [open, setOpen] = useQueryState(
    "new-workspace",
    parseAsBoolean.withDefault(false)
  );

  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);
  return {
    open,
    onOpen,
    onClose,
  };
};

export default useCreateWorkspaceDialog;
