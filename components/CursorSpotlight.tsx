"use client";

import { useEffect, useRef } from "react";

export default function CursorSpotlight() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (spotRef.current) {
        spotRef.current.style.background = `radial-gradient(380px circle at ${e.clientX}px ${e.clientY}px, rgba(59, 130, 246, 0.06), transparent 70%)`;

      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={spotRef}
      className="fixed inset-0 pointer-events-none z-[9997] transition-[background] duration-200"
      aria-hidden="true"
    />
  );
}
