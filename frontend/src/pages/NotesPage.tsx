import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SplitView } from '../layouts/SplitView';
import { NoteList } from '../components/NoteList';
import { ThreadView } from '../components/ThreadView';
import {
  useInfiniteNotes,
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useUpdateNoteHidden,
} from '../services/note.service';
import { useNotesUI } from '../store/notes.store';
import { useFocus } from '../store/focus.context';
import { useSettings } from '../store/settings.store';

export const NotesPage: React.FC = () => {
  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();
  const { selectedNoteId, setSelectedNoteId, replyingToNoteId, stopReply } = useNotesUI();
  const { focusInput } = useFocus();
  const { showHiddenNotes } = useSettings();

  // NOTE: Fetch notes with infinite scroll
  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: notesLoading,
  } = useInfiniteNotes(20, showHiddenNotes);

  // NOTE: Fetch selected note with thread
  const { data: noteData, isLoading: noteLoading } = useNote(selectedNoteId ?? undefined);

  // NOTE: Create note mutation
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const updateNoteHidden = useUpdateNoteHidden();

  // NOTE: Real-time updates to be implemented in the future
  // TODO: Implement WebSocket or polling for real-time note updates

  // NOTE: Sync URL param with selected note
  useEffect(() => {
    if (noteId && noteId !== selectedNoteId) {
      setSelectedNoteId(noteId);
    }
  }, [noteId, selectedNoteId, setSelectedNoteId]);

  // NOTE: Update URL when note is selected
  const handleNoteSelect = (id: string) => {
    setSelectedNoteId(id);
    navigate(`/notes/${id}`);
  };

  // NOTE: Close thread view (mobile navigation)
  const handleCloseThread = () => {
    setSelectedNoteId(null);
    navigate('/');

    // NOTE: Focus message input when thread closes
    setTimeout(() => {
      focusInput('note-editor');
    }, 100);
  };

  // NOTE: Create new note or reply
  const handleCreateNote = async (content: string) => {
    try {
      const newNote = await createNote.mutateAsync({
        content,
        parentId: replyingToNoteId || undefined,
      });

      // NOTE: Select newly created note
      if (!replyingToNoteId) {
        handleNoteSelect(newNote.id);
      }

      stopReply();
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  };

  // NOTE: Load more notes for infinite scroll
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // NOTE: Toggle note hidden status
  const handleToggleHidden = async (noteId: string, isHidden: boolean) => {
    try {
      await updateNoteHidden.mutateAsync({ id: noteId, isHidden });
    } catch (error) {
      console.error('Failed to update note hidden status:', error);
    }
  };

  // NOTE: Flatten paginated notes
  const displayNotes = notesData?.pages.flatMap((page) => page.notes) || [];

  return (
    <div className="h-full w-full">
      {/* NOTE: Split view layout */}
      <SplitView
        showRight={!!selectedNoteId}
        onCloseRight={handleCloseThread}
        left={
          <NoteList
            notes={displayNotes}
            selectedNoteId={selectedNoteId ?? undefined}
            onNoteSelect={handleNoteSelect}
            onLoadMore={handleLoadMore}
            hasMore={hasNextPage}
            loading={notesLoading || isFetchingNextPage}
            onCreateNote={!replyingToNoteId ? handleCreateNote : undefined}
            onToggleHidden={handleToggleHidden}
          />
        }
        right={
          <div className="h-full w-full flex flex-col">
            {selectedNoteId && noteData?.note ? (
              <ThreadView
                rootNote={noteData.note}
                thread={noteData.thread || []}
                onClose={handleCloseThread}
                onReply={async (parentId: string, content: string) => {
                  await createNote.mutateAsync({
                    content,
                    parentId,
                  });
                }}
                onEdit={async (noteId: string, content: string) => {
                  try {
                    await updateNote.mutateAsync({ id: noteId, content });
                  } catch (error) {
                    console.error('Failed to update note:', error);
                  }
                }}
                onDelete={async (noteId: string) => {
                  try {
                    await deleteNote.mutateAsync(noteId);

                    // NOTE: Clear selection if deleted note was selected
                    if (selectedNoteId === noteId) {
                      handleCloseThread();
                    }
                  } catch (error) {
                    console.error('Failed to delete note:', error);
                  }
                }}
              />
            ) : noteLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground text-sm">Loading thread...</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">Select a note to view its thread</p>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};
