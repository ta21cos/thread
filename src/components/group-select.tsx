"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: string[];
}

export function GroupSelect({ value, onChange, groups }: GroupSelectProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = groups.filter(
    (g) => g.toLowerCase().includes(value.toLowerCase()) && value.length > 0,
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Group (optional)"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      />
      {showSuggestions && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filtered.map((group) => (
            <li key={group}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(group);
                  setShowSuggestions(false);
                }}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                {group}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
