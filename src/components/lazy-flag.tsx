import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LazyFlagProps {
  src: string;
  alt?: string;
  className?: string;
  isSelected?: boolean;
}

export function LazyFlag({ src, alt = "", className, isSelected }: LazyFlagProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "80px", // pre-load when 80px close
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]); // Re-observe if the source changes (e.g. search filter updates the list)

  if (!visible) {
    return (
      <div
        ref={ref}
        className={cn(
          "w-5 h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-[2px] border border-border/40 shrink-0 shadow-xs animate-pulse",
          className
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "w-5 h-3.5 object-cover rounded-[2px] border shadow-xs shrink-0",
        isSelected ? "border-white/20" : "border-border/40",
        className
      )}
      onError={(e) => {
        (e.target as HTMLElement).style.display = "none";
      }}
    />
  );
}
