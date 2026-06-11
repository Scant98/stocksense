"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const styles = Array.from({ length: number }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 5}s`,
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {meteorStyles.map((style, i) => (
        <span
          key={i}
          className="animate-meteor absolute h-0.5 w-24 rotate-[215deg] rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          style={style}
        />
      ))}
    </div>
  );
}
