"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesTextProps {
  text: string;
  className?: string;
}

export function SparklesText({ text, className }: SparklesTextProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      <motion.span
        className="gradient-text font-bold"
        animate={{ backgroundPosition: ["0% center", "200% center"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% auto" }}
      >
        {text}
      </motion.span>
      {[...Array(3)].map((_, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute text-primary"
          style={{ top: `${["-20%", "0%", "-30%"][i]}`, left: `${["-10%", "105%", "50%"][i]}`, fontSize: "10px" }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        >
          ✦
        </motion.span>
      ))}
    </span>
  );
}
