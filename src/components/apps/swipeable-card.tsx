import { useState, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import { Trash2, Pin, PinOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 70;

export function SwipeableCard({
  children,
  onDelete,
  onPin,
  isPinned = false,
  disabled = false,
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    ({ active, movement: [mx], direction: [dx], cancel }) => {
      if (disabled) return;

      setIsDragging(active);

      if (active) {
        // Limit the drag distance
        const maxLeft = onDelete ? -ACTION_WIDTH : 0;
        const maxRight = onPin ? ACTION_WIDTH : 0;
        const newOffset = Math.max(maxLeft, Math.min(maxRight, mx));
        setOffsetX(newOffset);
      } else {
        // On release, snap to action or reset
        if (mx < -SWIPE_THRESHOLD && onDelete) {
          // Swiped left far enough - show delete
          setOffsetX(-ACTION_WIDTH);
        } else if (mx > SWIPE_THRESHOLD && onPin) {
          // Swiped right far enough - show pin
          setOffsetX(ACTION_WIDTH);
        } else {
          // Reset
          setOffsetX(0);
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
      from: () => [offsetX, 0],
    }
  );

  const handleAction = (action: "delete" | "pin") => {
    setOffsetX(0);
    if (action === "delete" && onDelete) {
      onDelete();
    } else if (action === "pin" && onPin) {
      onPin();
    }
  };

  const handleReset = () => {
    setOffsetX(0);
  };

  // Only enable on touch devices
  if (typeof window !== "undefined" && !("ontouchstart" in window)) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg touch-pan-y"
      onClick={offsetX !== 0 ? handleReset : undefined}
    >
      {/* Left action (Pin) - revealed when swiping right */}
      {onPin && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 flex items-center justify-center transition-opacity",
            isPinned ? "bg-orange-500" : "bg-blue-500",
            offsetX > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: ACTION_WIDTH }}
          onClick={() => handleAction("pin")}
        >
          {isPinned ? (
            <PinOff className="h-5 w-5 text-white" />
          ) : (
            <Pin className="h-5 w-5 text-white" />
          )}
        </div>
      )}

      {/* Right action (Delete) - revealed when swiping left */}
      {onDelete && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 transition-opacity",
            offsetX < 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: ACTION_WIDTH }}
          onClick={() => handleAction("delete")}
        >
          <Trash2 className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Card content */}
      <div
        {...bind()}
        className={cn(
          "relative bg-background transition-transform",
          isDragging ? "transition-none" : "duration-200"
        )}
        style={{
          transform: `translateX(${offsetX}px)`,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
