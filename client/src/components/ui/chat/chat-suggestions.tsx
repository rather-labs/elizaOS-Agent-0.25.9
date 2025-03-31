import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircleQuestion, ChevronDown, ChevronUp } from "lucide-react";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ChatSuggestions({
  suggestions,
  onSuggestionClick,
  className,
  disabled = false,
}: ChatSuggestionsProps) {
  if (!suggestions.length) return null;
  
  // State to track if suggestions are expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Split suggestions into chunks to make them more visually appealing
  const firstRow = suggestions.slice(0, 4);
  const secondRow = suggestions.slice(4);

  return (
    <div 
      className={cn("flex flex-col gap-3 mb-4", className)}
      onMouseEnter={() => !disabled && setIsExpanded(true)}
      onMouseLeave={() => !disabled && setIsExpanded(false)}
    >
      <div 
        className={cn(
          "flex items-center w-full py-2 px-4 rounded-full transition-all",
          "border shadow-sm bg-background",
          disabled 
            ? "opacity-60 cursor-not-allowed border-border/50" 
            : "hover:shadow-md cursor-pointer",
          isExpanded 
            ? "border-primary/40 text-primary" 
            : "border-border/80 text-foreground hover:border-primary/30"
        )}
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
      >
        <MessageCircleQuestion className="h-4 w-4 mr-2 text-primary" />
        <span className="text-sm font-medium">Ask me about</span>
        {!disabled && (isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-auto text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto text-primary/50" />
        ))}
      </div>
      
      {isExpanded && !disabled && (
        <div className="px-2 py-2 space-y-2 animate-fadeIn">
          <div className="flex flex-wrap gap-2">
            {firstRow.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                disabled={disabled}
                className="rounded-full bg-card hover:bg-primary/10 text-foreground font-medium border text-sm px-4 py-2 h-auto transition-all hover:shadow hover:border-primary/30"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          {secondRow.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {secondRow.map((suggestion, index) => (
                <Button
                  key={index + firstRow.length}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className="rounded-full bg-card hover:bg-primary/10 text-foreground font-medium border text-sm px-4 py-2 h-auto transition-all hover:shadow hover:border-primary/30"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 