// use-create-project-dialog.tsx
// This file provides a custom React hook for managing the state of the create project dialog/modal.
import { parseAsBoolean, useQueryState } from "nuqs";

const useCreateProjectDialog = () => {
  const [open, setOpen] = useQueryState(
    "new-project",
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

export default useCreateProjectDialog;
