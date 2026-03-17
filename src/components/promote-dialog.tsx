"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  promotePost,
  promoteThread,
  promoteMultiple,
} from "@/app/actions/stocks";

interface PromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "single" | "thread" | "multiple";
  postIds: string[];
  defaultTitle: string;
  onComplete: () => void;
}

export function PromoteDialog({
  open,
  onOpenChange,
  type,
  postIds,
  defaultTitle,
  onComplete,
}: PromoteDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      if (type === "single") {
        await promotePost(postIds[0], title);
      } else if (type === "thread") {
        await promoteThread(postIds[0], title);
      } else {
        await promoteMultiple(postIds, title);
      }
      onComplete();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isPending) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const typeLabel =
    type === "single"
      ? "post"
      : type === "thread"
        ? "thread"
        : `${postIds.length} posts`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to Inbox</DialogTitle>
          <DialogDescription>
            Promote this {typeLabel} to your inbox for later review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="promote-title">Title</Label>
            <Input
              id="promote-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a title..."
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Promoting..." : "Promote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
