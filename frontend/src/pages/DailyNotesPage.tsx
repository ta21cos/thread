import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useDailyNote, useCalendar, dailyNoteKeys } from '../services/daily-note.service';
import { useUpdateNote } from '../services/note.service';
import { useChannelUI } from '../store/channel.store';

const AUTO_SAVE_DELAY_MS = 1000;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarWidget: React.FC<{
  year: number;
  month: number;
  selectedDate: string | undefined;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  entriesSet: Set<string>;
}> = ({ year, month, selectedDate, onDateSelect, onMonthChange, entriesSet }) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = useMemo(() => {
    const result: Array<{ day: number; date: string } | null> = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ day: d, date });
    }
    return result;
  }, [year, month, firstDay, daysInMonth]);

  const handlePrev = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const handleNext = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full" data-testid="calendar-widget">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground">{monthLabel}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell ? (
            <button
              key={cell.date}
              onClick={() => onDateSelect(cell.date)}
              className={cn(
                'relative aspect-square flex items-center justify-center rounded-md text-xs transition-colors',
                cell.date === selectedDate && 'bg-primary text-primary-foreground',
                cell.date === today && cell.date !== selectedDate && 'border border-primary',
                cell.date !== selectedDate && 'hover:bg-accent'
              )}
              data-testid="calendar-day"
            >
              {cell.day}
              {entriesSet.has(cell.date) && (
                <Check
                  className={cn(
                    'absolute top-0 right-0 h-2.5 w-2.5',
                    cell.date === selectedDate ? 'text-primary-foreground' : 'text-primary'
                  )}
                  strokeWidth={3}
                />
              )}
            </button>
          ) : (
            <div key={`empty-${i}`} />
          )
        )}
      </div>
    </div>
  );
};

type SaveStatus = 'idle' | 'saving' | 'saved';

export const DailyNotesPage: React.FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = date || today;

  const parsedDate = useMemo(() => {
    const d = new Date(selectedDate);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [selectedDate]);

  const [calYear, setCalYear] = useState(parsedDate.year);
  const [calMonth, setCalMonth] = useState(parsedDate.month);

  const { selectedChannelId } = useChannelUI();
  const queryClient = useQueryClient();
  const { data: dailyNoteData, isLoading } = useDailyNote(
    selectedDate,
    selectedChannelId ?? undefined
  );
  const { data: calendarEntries } = useCalendar(calYear, calMonth);
  const updateNote = useUpdateNote();

  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(null);
  const originalContentRef = useRef<string>('');

  // Sync content from server data when date changes or data loads
  useEffect(() => {
    if (dailyNoteData?.note) {
      if (noteIdRef.current !== dailyNoteData.note.id) {
        setContent(dailyNoteData.note.content);
        noteIdRef.current = dailyNoteData.note.id;
        originalContentRef.current = dailyNoteData.note.content;
        setSaveStatus('idle');
      }
    } else {
      setContent('');
      noteIdRef.current = null;
      originalContentRef.current = '';
      setSaveStatus('idle');
    }
  }, [dailyNoteData]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);
    };
  }, []);

  const saveContent = useCallback(
    async (noteId: string, newContent: string) => {
      setSaveStatus('saving');
      try {
        await updateNote.mutateAsync({ id: noteId, content: newContent });
        originalContentRef.current = newContent;
        setSaveStatus('saved');
        queryClient.invalidateQueries({ queryKey: dailyNoteKeys.calendar(calYear, calMonth) });
        if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);
        savedIndicatorTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to auto-save daily note:', error);
        setSaveStatus('idle');
      }
    },
    [updateNote, queryClient, calYear, calMonth]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);

      if (!dailyNoteData?.note) return;

      // Skip save if content matches original
      if (newContent === originalContentRef.current) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        return;
      }

      const noteId = dailyNoteData.note.id;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        saveContent(noteId, newContent);
      }, AUTO_SAVE_DELAY_MS);
    },
    [dailyNoteData, saveContent]
  );

  const entriesSet = useMemo(() => {
    return new Set(calendarEntries?.filter((e) => e.hasNote).map((e) => e.date) ?? []);
  }, [calendarEntries]);

  const handleDateSelect = (newDate: string) => {
    // Flush pending save before navigating (only if content differs)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (dailyNoteData?.note && content !== originalContentRef.current) {
      saveContent(dailyNoteData.note.id, content);
    }
    navigate(`/daily/${newDate}`);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppLayout>
      <div className="flex h-full flex-col lg:flex-row">
        {/* Calendar sidebar */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-foreground">Daily Notes</h1>
          </div>
          <CalendarWidget
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
            entriesSet={entriesSet}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleDateSelect(today)}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Note content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex h-14 items-center justify-between border-b border-border px-4 flex-shrink-0">
            <span className="text-sm font-medium text-foreground">{formattedDate}</span>
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4" data-testid="daily-note-content">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dailyNoteData?.note ? (
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Write your daily note..."
                className="w-full h-full min-h-[200px] resize-none bg-transparent text-sm text-foreground focus:outline-none"
                data-testid="daily-note-textarea"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Calendar className="mb-3 h-12 w-12" />
                <p className="font-medium text-foreground">No note for this day</p>
                <p className="text-sm">Select a date to create or view a daily note.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DailyNotesPage;
