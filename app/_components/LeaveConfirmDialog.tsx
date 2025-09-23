// app/_components/LeaveConfirmDialog.tsx
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type Props = {
  open: boolean;
  canSave: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveAndLeave: () => void;
};

/** data-leave-dialog で自己クリックをインターセプト対象から除外 */
export default function LeaveConfirmDialog({
  open,
  canSave,
  isSaving,
  onCancel,
  onDiscard,
  onSaveAndLeave,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      data-leave-dialog
      
    >
      <DialogTitle>編集内容が保存されていません</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">
          このページから移動すると、編集中の内容は失われる可能性があります。
          下書き保存してから移動しますか？
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>キャンセル</Button>
        <Button onClick={onDiscard} color="error">
          破棄して移動
        </Button>
        <Button
          onClick={onSaveAndLeave}
          variant="contained"
          disabled={!canSave || isSaving}
        >
          {isSaving ? "保存中..." : "下書き保存して移動"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
