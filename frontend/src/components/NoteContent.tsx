import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NoteContentProps {
  content: string;
  onMentionClick?: (noteId: string) => void;
  truncate?: number;
  className?: string;
  'data-testid'?: string;
}

const TASK_PREFIX = '- [x] ';
const TASK_PREFIX_LENGTH = TASK_PREFIX.length;

const renderMentions = (
  text: string,
  onMentionClick?: (noteId: string) => void,
  navigate?: ReturnType<typeof useNavigate>
): React.ReactNode[] => {
  const parts = text.split(/(@\w{6})/g);
  return parts.map((part, index) => {
    if (part.match(/^@\w{6}$/)) {
      const noteId = part.substring(1);
      return (
        <a
          key={index}
          href={`#${noteId}`}
          className="text-primary hover:underline"
          aria-label={`Go to note ${noteId}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMentionClick) {
              onMentionClick(noteId);
            } else if (navigate) {
              navigate(`/notes/${noteId}`);
            }
          }}
        >
          {part}
        </a>
      );
    }
    if (!part) return null;
    return <span key={index}>{part}</span>;
  });
};

const renderLine = (
  line: string,
  lineIndex: number,
  onMentionClick?: (noteId: string) => void,
  navigate?: ReturnType<typeof useNavigate>
): React.ReactNode => {
  if (line.match(/^### /)) {
    return (
      <span key={lineIndex} className="font-semibold">
        {renderMentions(line, onMentionClick, navigate)}
      </span>
    );
  }
  if (line.match(/^## /)) {
    return (
      <span key={lineIndex} className="font-bold">
        {renderMentions(line, onMentionClick, navigate)}
      </span>
    );
  }
  if (line.match(/^# /)) {
    return (
      <span key={lineIndex} className="mt-1 font-black">
        {renderMentions(line, onMentionClick, navigate)}
      </span>
    );
  }

  // NOTE: Task patterns must be checked before plain list to avoid `- [ ]` matching as a list item
  if (line.match(/^- \[x\] /)) {
    const taskText = line.slice(TASK_PREFIX_LENGTH);
    return (
      <span key={lineIndex} className="text-muted-foreground opacity-60 line-through">
        <span className="mr-1 rounded bg-muted px-1 font-mono">- [x]</span>
        {renderMentions(taskText, onMentionClick, navigate)}
      </span>
    );
  }

  if (line.match(/^- \[ \] /)) {
    const taskText = line.slice(TASK_PREFIX_LENGTH);
    return (
      <span key={lineIndex}>
        <span className="mr-1 rounded bg-muted px-1 font-mono text-muted-foreground">- [ ]</span>
        {renderMentions(taskText, onMentionClick, navigate)}
      </span>
    );
  }

  if (line.match(/^- /)) {
    const listText = line.slice(2);
    return (
      <span key={lineIndex} className="inline-flex items-baseline pl-1">
        <span className="mr-1.5 text-muted-foreground" aria-hidden="true">
          ·
        </span>
        {renderMentions(listText, onMentionClick, navigate)}
      </span>
    );
  }

  return <span key={lineIndex}>{renderMentions(line, onMentionClick, navigate)}</span>;
};

export const NoteContent: React.FC<NoteContentProps> = ({
  content,
  onMentionClick,
  truncate,
  className,
  'data-testid': dataTestId,
}) => {
  const navigate = useNavigate();

  const displayContent =
    truncate && content.length > truncate ? content.substring(0, truncate) + '...' : content;

  const lines = displayContent.split('\n');

  return (
    <div
      className={className ?? 'text-foreground text-sm leading-relaxed'}
      data-testid={dataTestId}
    >
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {renderLine(line, index, onMentionClick, navigate)}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};
