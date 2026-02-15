import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Edit3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useDailyNote, useCalendar } from '../services/daily-note.service';
import { useUpdateNote } from '../services/note.service';

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
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
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

  const { data: dailyNoteData, isLoading } = useDailyNote(selectedDate);
  const { data: calendarEntries } = useCalendar(calYear, calMonth);
  const updateNote = useUpdateNote();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const entriesSet = useMemo(() => {
    return new Set(calendarEntries?.map((e) => e.date) ?? []);
  }, [calendarEntries]);

  const handleDateSelect = (newDate: string) => {
    navigate(`/daily/${newDate}`);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const handleStartEdit = () => {
    if (dailyNoteData?.note) {
      setEditContent(dailyNoteData.note.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!dailyNoteData?.note) return;
    try {
      await updateNote.mutateAsync({
        id: dailyNoteData.note.id,
        content: editContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update daily note:', error);
    }
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
            {dailyNoteData?.note && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                data-testid="daily-note-edit"
              >
                <Edit3 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4" data-testid="daily-note-content">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[200px] resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="daily-note-textarea"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={updateNote.isPending}>
                    {updateNote.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : dailyNoteData?.note ? (
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap">{dailyNoteData.note.content}</p>
              </div>
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
