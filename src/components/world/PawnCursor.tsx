import React, { useEffect, useState, useRef } from "react";

export const PawnCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hoverType, setHoverType] = useState<"default" | "button" | "link" | "image" | "3d">("default");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const [isOverInput, setIsOverInput] = useState(false);

  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check touch/mobile
    if (typeof window !== "undefined") {
      const touchMatch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      if (touchMatch) {
        setIsTouch(true);
        return;
      }
    }

    // Add class to body to suppress default cursor on desktop
    document.body.classList.add("custom-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest("input, textarea, select, [contenteditable='true']")) {
          setIsOverInput(true);
        } else {
          setIsOverInput(false);
        }

        if (target.closest("button") || target.closest(".cursor-button")) {
          setHoverType("button");
        } else if (target.closest("a") || target.closest(".cursor-link")) {
          setHoverType("link");
        } else if (target.closest("canvas") || target.closest(".cursor-3d")) {
          setHoverType("3d");
        } else if (target.closest("img") || target.closest(".cursor-image")) {
          setHoverType("image");
        } else {
          setHoverType("default");
        }
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Smooth inertia lerp loop
    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;
    const loop = () => {
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.24);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.24);
      setPos({ x: currentRef.current.x, y: currentRef.current.y });
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (isTouch || !isVisible || isOverInput) return null;

  // Scale and styling calculations based on state
  const isInteracting = hoverType !== "default";
  const scale = isMouseDown ? 0.85 : hoverType === "button" ? 1.35 : hoverType === "3d" ? 1.25 : hoverType === "image" ? 1.2 : 1;
  const glow = hoverType === "3d" ? "drop-shadow(0 0 10px rgba(199, 164, 91, 0.8))" : hoverType === "button" ? "drop-shadow(0 0 8px rgba(245, 243, 237, 0.5))" : "none";

  return (
    <>
      {/* Precision Pawn Cursor Vector */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[99999] transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`,
          filter: glow,
        }}
      >
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-colors duration-200"
        >
          {/* Head Sphere */}
          <circle 
            cx="10" 
            cy="4.5" 
            r="3.5" 
            fill={hoverType === "button" ? "#8E5830" : hoverType === "3d" ? "#8E5830" : "#2D221C"}
            stroke={hoverType === "button" ? "#2D221C" : "rgba(142, 88, 48, 0.4)"}
            strokeWidth="0.8"
          />
          {/* Collar Collar Ring */}
          <path 
            d="M7 9C7 8.5 8.3 8.2 10 8.2C11.7 8.2 13 8.5 13 9C13 9.5 11.7 9.8 10 9.8C8.3 9.8 7 9.5 7 9Z" 
            fill={hoverType === "button" ? "#8E5830" : "#2D221C"} 
          />
          {/* Slender Body */}
          <path 
            d="M8.5 10C8.5 12.5 7.2 15.5 6 17.5H14C12.8 15.5 11.5 12.5 11.5 10H8.5Z" 
            fill={hoverType === "button" ? "#8E5830" : hoverType === "3d" ? "#8E5830" : "#2D221C"} 
            stroke={hoverType === "button" ? "#2D221C" : "rgba(142, 88, 48, 0.3)"}
            strokeWidth="0.8"
          />
          {/* Base Rim */}
          <rect 
            x="4" 
            y="18.5" 
            width="12" 
            height="2.5" 
            rx="1" 
            fill={hoverType === "button" ? "#8E5830" : "#2D221C"} 
          />
          <path 
            d="M3 22C3 21.4 3.5 21 4.1 21H15.9C16.5 21 17 21.4 17 22H3Z" 
            fill={hoverType === "3d" ? "#8E5830" : "#7A6E63"} 
          />
        </svg>
      </div>

      {/* Slow Hover Optical Refraction & Blur Lens */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[99980] rounded-full transition-all duration-700 ease-out will-change-transform"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
          width: isInteracting ? "320px" : "220px",
          height: isInteracting ? "320px" : "220px",
          backdropFilter: isInteracting ? "blur(3px)" : "blur(1.5px)",
          WebkitBackdropFilter: isInteracting ? "blur(3px)" : "blur(1.5px)",
          maskImage: "radial-gradient(circle at center, black 0%, rgba(0,0,0,0.5) 45%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, rgba(0,0,0,0.5) 45%, transparent 70%)",
          opacity: isVisible ? (isInteracting ? 0.9 : 0.6) : 0,
        }}
      />

      {/* Subtle Golden Ambient Light Bloom following cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[99990] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`,
          width: isInteracting ? "300px" : "200px",
          height: isInteracting ? "300px" : "200px",
          background: hoverType === "3d" 
            ? "radial-gradient(circle, rgba(204, 164, 101, 0.12) 0%, transparent 70%)"
            : hoverType === "button"
            ? "radial-gradient(circle, rgba(217, 181, 123, 0.10) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(245, 242, 235, 0.05) 0%, transparent 70%)",
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
};
