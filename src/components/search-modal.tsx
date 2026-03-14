"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, MessageSquare } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchPosts, type SearchResult } from "@/app/actions/search";

function formatTimestamp(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = useCallback(async (value: string) => {
    setLoading(true);
    try {
      const data = await searchPosts(value);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!value.trim()) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(() => performSearch(value), 300);
    },
    [performSearch],
  );

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/channels/${result.channelId}?highlight=${result.id}`);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
    }
  };

  const postResults = results.filter((r) => r.type === "post");
  const replyResults = results.filter((r) => r.type === "reply");

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search posts and replies across all channels"
    >
      <CommandInput
        placeholder="Search posts and replies..."
        value={query}
        onValueChange={handleSearch}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}
        {!loading && query.trim() && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!loading && postResults.length > 0 && (
          <CommandGroup heading="Posts">
            {postResults.map((result) => (
              <CommandItem
                key={`post-${result.id}`}
                value={`post-${result.id}`}
                onSelect={() => handleSelect(result)}
                className="flex flex-col items-start gap-1"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>{result.channelName}</span>
                  <span>·</span>
                  <span>{formatTimestamp(result.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm">{result.content}</p>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && replyResults.length > 0 && (
          <CommandGroup heading="Replies">
            {replyResults.map((result) => (
              <CommandItem
                key={`reply-${result.id}`}
                value={`reply-${result.id}`}
                onSelect={() => handleSelect(result)}
                className="flex flex-col items-start gap-1"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{result.channelName}</span>
                  <span>·</span>
                  <span>{formatTimestamp(result.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-sm">{result.content}</p>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && !query.trim() && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type to search posts and replies across all channels
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
