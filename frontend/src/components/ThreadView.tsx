import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocus } from '@/store/focus.context';
import {
  X,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Trash2,
  Bookmark,
  Link2,
  Edit,
  Pin,
  ArrowLeft,
} from 'lucide-react';
import { Note } from '../../../shared/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRelativeTime } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import NoteEditor from './NoteEditor';

interface ThreadViewProps {
  rootNote: Note;
  thread: Note[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  currentUserId?: string;
  onClose?: () => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  rootNote,
  thread,
  onReply,
  onEdit,
  onDelete,
  currentUserId: _currentUserId,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
  const isMobile = !useMediaQuery('(min-width: 1024px)');
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const { registerInput, unregisterInput } = useFocus();

  // NOTE: Register reply input with FocusContext
  useEffect(() => {
    registerInput('thread-reply', replyInputRef);
    return () => {
      unregisterInput('thread-reply');
    };
  }, [registerInput, unregisterInput]);

  // NOTE: Smart auto-focus - focus reply input when thread opens (with delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [rootNote.id]);

  const copyLink = (noteId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/notes/${noteId}`);
  };

  const toggleImageExpansion = (noteId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await onReply(rootNote.id, replyContent);
    setReplyContent('');

    // NOTE: Smart auto-focus - re-focus for next reply
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 0);
  };

  const handleEdit = async (noteId: string, content: string) => {
    await onEdit(noteId, content);
    setIsEditing(null);
  };

  const handleDelete = async (noteId: string) => {
    if (window.confirm('Delete this note? This cannot be undone.')) {
      await onDelete(noteId);
    }
  };

  const renderContent = (content: string) => {
    // NOTE: Parse mentions and make them clickable
    const parts = content.split(/(@\w{6})/g);
    return parts.map((part, index) => {
      if (part.match(/^@\w{6}$/)) {
        const noteId = part.substring(1);
        return (
          <a
            key={index}
            href={`#${noteId}`}
            className="text-primary hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/notes/${noteId}`);
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // NOTE: Get replies (all notes except root)
  const replies = useMemo(() => {
    return thread
      .filter((note) => note.id !== rootNote.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [thread, rootNote.id]);

  return (
    <div className="flex w-full h-full flex-col bg-background" data-testid="thread-view">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Back to notes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="font-semibold text-foreground text-sm">Thread</h3>
        </div>
        {!isMobile && onClose && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable Messages Container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* Original Message */}
          <div className="border-b border-border p-4">
            <div className="group relative space-y-2" data-testid="thread-node">
              <div className="absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin note
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyLink(rootNote.id)}>
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsEditing(rootNote.id)}
                      data-testid="thread-action-edit"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit note
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(rootNote.id)}
                      className="text-destructive"
                      data-testid="thread-action-delete"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tags */}
              {rootNote.tags && rootNote.tags.length > 0 && (
                <div className="flex gap-1.5">
                  {rootNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded bg-primary/10 px-2 py-0.5 font-mono font-medium text-primary text-xs"
                    data-testid="thread-node-id"
                  >
                    #{rootNote.id}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {getRelativeTime(rootNote.createdAt)}
                  </span>
                  {rootNote.bookmarked && (
                    <Bookmark className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                {rootNote.pinned && <Pin className="h-4 w-4 fill-primary text-primary" />}
              </div>

              {isEditing === rootNote.id ? (
                <NoteEditor
                  initialContent={rootNote.content}
                  onSubmit={(content) => handleEdit(rootNote.id, content)}
                  onCancel={() => setIsEditing(null)}
                  maxLength={1000}
                  autoFocus
                />
              ) : (
                <>
                  <p
                    className="text-foreground text-sm leading-relaxed"
                    data-testid="thread-node-content"
                  >
                    {renderContent(rootNote.content)}
                  </p>

                  {/* Image Previews */}
                  {rootNote.images && rootNote.images.length > 0 && (
                    <div className="space-y-2">
                      {expandedImages[rootNote.id] ? (
                        // Expanded: show all images
                        <>
                          {rootNote.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Image ${i + 1}`}
                              className="w-full rounded-lg border border-border"
                            />
                          ))}
                          <button
                            onClick={() => toggleImageExpansion(rootNote.id)}
                            className="text-primary text-xs hover:underline"
                          >
                            Collapse images
                          </button>
                        </>
                      ) : (
                        // Collapsed: thumbnail stack
                        <button
                          onClick={() => toggleImageExpansion(rootNote.id)}
                          className="flex items-center gap-2"
                        >
                          <div className="flex -space-x-2">
                            {rootNote.images.slice(0, 3).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Thumbnail ${i + 1}`}
                                className="h-12 w-12 rounded border-2 border-background object-cover"
                              />
                            ))}
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {rootNote.images.length}{' '}
                            {rootNote.images.length === 1 ? 'image' : 'images'} - Click to expand
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="text-muted-foreground text-xs">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </div>
            </div>
          </div>

          {/* Thread Replies */}
          <div className="space-y-3 p-4">
            {replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-accent p-4">
                  <Smile className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground text-sm">No replies yet</p>
                <p className="text-muted-foreground text-xs">Be the first to reply to this note</p>
              </div>
            ) : (
              replies.map((note) => (
                <div key={note.id} className="group relative space-y-2" data-testid="thread-node">
                  <div className="absolute top-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Bookmark className="mr-2 h-4 w-4" />
                          Bookmark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(note.id)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsEditing(note.id)}
                          data-testid="thread-action-edit"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit note
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(note.id)}
                          className="text-destructive"
                          data-testid="thread-action-delete"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className="rounded bg-primary/10 px-2 py-0.5 font-mono font-medium text-primary text-xs"
                      data-testid="thread-node-id"
                    >
                      #{note.id}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {getRelativeTime(note.createdAt)}
                    </span>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <span className="text-muted-foreground text-xs">(edited)</span>
                    )}
                    {note.bookmarked && (
                      <Bookmark className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>

                  {isEditing === note.id ? (
                    <NoteEditor
                      initialContent={note.content}
                      onSubmit={(content) => handleEdit(note.id, content)}
                      onCancel={() => setIsEditing(null)}
                      maxLength={1000}
                      autoFocus
                    />
                  ) : (
                    <>
                      <p
                        className="text-foreground text-sm leading-relaxed"
                        data-testid="thread-node-content"
                      >
                        {renderContent(note.content)}
                      </p>

                      {/* Image Previews */}
                      {note.images && note.images.length > 0 && (
                        <div className="space-y-2">
                          {expandedImages[note.id] ? (
                            // Expanded: show all images
                            <>
                              {note.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Image ${i + 1}`}
                                  className="w-full rounded-lg border border-border"
                                />
                              ))}
                              <button
                                onClick={() => toggleImageExpansion(note.id)}
                                className="text-primary text-xs hover:underline"
                              >
                                Collapse images
                              </button>
                            </>
                          ) : (
                            // Collapsed: thumbnail stack
                            <button
                              onClick={() => toggleImageExpansion(note.id)}
                              className="flex items-center gap-2"
                            >
                              <div className="flex -space-x-2">
                                {note.images.slice(0, 3).map((img, i) => (
                                  <img
                                    key={i}
                                    src={img}
                                    alt={`Thumbnail ${i + 1}`}
                                    className="h-12 w-12 rounded border-2 border-background object-cover"
                                  />
                                ))}
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {note.images.length} {note.images.length === 1 ? 'image' : 'images'}{' '}
                                - Click to expand
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Reply Input */}
      <div className="border-t border-border p-4 flex-shrink-0" data-testid="thread-reply-input">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-lg border border-input bg-card">
            <Textarea
              ref={replyInputRef}
              placeholder="Reply... (Cmd/Ctrl+Enter to send)"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              className="border-0 bg-transparent focus-visible:ring-0 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
              data-testid="thread-reply-textarea"
            />
            <div className="flex items-center gap-1 px-3 pb-2">
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleReply}
            data-testid="thread-reply-submit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
