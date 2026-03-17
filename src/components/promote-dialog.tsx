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

type PromoteMode =
  | { type: "single"; postId: string; content: string; hasThread: boolean }
  | { type: "multiple"; postIds: string[]; firstContent: string };

interface PromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PromoteMode;
  onComplete: () => void;
}

export function PromoteDialog({
  open,
  onOpenChange,
  mode,
  onComplete,
}: PromoteDialogProps) {
  const defaultTitle =
    mode.type === "single"
      ? mode.content.slice(0, 30)
      : mode.firstContent.slice(0, 30);
  const [title, setTitle] = useState(defaultTitle);
  const [includeThread, setIncludeThread] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePromote = () => {
    startTransition(async () => {
      if (mode.type === "single") {
        if (includeThread && mode.hasThread) {
          await promoteThread(mode.postId, title);
        } else {
          await promotePost(mode.postId, title);
        }
      } else {
        await promoteMultiple(mode.postIds, title);
      }
      onComplete();
      onOpenChange(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isPending) {
      e.preventDefault();
      handlePromote();
    }
  };

  const typeLabel =
    mode.type === "single" ? "post" : `${mode.postIds.length} posts`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote to Inbox</DialogTitle>
          <DialogDescription>
            Save this {typeLabel} to your inbox for later.
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
          {mode.type === "single" && mode.hasThread && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeThread}
                onChange={(e) => setIncludeThread(e.target.checked)}
                className="rounded"
              />
              Include thread replies
            </label>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={isPending || !title.trim()}>
            {isPending ? "Promoting..." : "Promote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
