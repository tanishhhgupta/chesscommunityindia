import React, { useEffect, useRef, useState } from "react";

interface FirstScrollLoopAnimationProps {
  scrollProgress?: number;
}

const TOTAL_FRAMES = 300;
const BASE_FRAME_RATE = 28; // Standard 28 FPS smooth cinematic playback
const MERGE_FRAMES = 36; // Seamless cross-continuation window (~1.3s dissolve)

export const FirstScrollLoopAnimation: React.FC<FirstScrollLoopAnimationProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const [loadedCount, setLoadedCount] = useState(0);

  // Smooth animation and physics state
  const stateRef = useRef({
    currentFramePos: 0, // Floating frame index [0 .. 300)
    panRatio: -0.65, // Range [-0.85 .. 0.85]: negative = left, positive = right
    targetPanRatio: -0.65,
    lastScrollY: 0,
    isScrolling: false,
    scrollTimeout: null as NodeJS.Timeout | null,
    lastTime: performance.now(),
  });

  // 1. High-Performance Parallel Preloader: Rapidly stream all 300 frames into memory
  useEffect(() => {
    let isCancelled = false;
    const images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);

    const pad = (n: number) => String(n).padStart(3, "0");

    const loadFrame = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `/animation_sequence/ezgif-frame-${pad(index + 1)}.jpg`;
        img.onload = () => {
          if (!isCancelled) {
            images[index] = img;
            imagesRef.current[index] = img;
            setLoadedCount((prev) => prev + 1);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const preloadAll = async () => {
      // Step A: Load the first frame immediately for instantaneous zero-flicker display
      await loadFrame(0);
      if (isCancelled) return;

      // Step B: Concurrently load reference frames across the entire sequence
      const sampleIndices: number[] = [];
      for (let i = 1; i < TOTAL_FRAMES; i += 6) {
        sampleIndices.push(i);
      }
      await Promise.all(sampleIndices.map((idx) => loadFrame(idx)));
      if (isCancelled) return;

      // Step C: Concurrently stream all remaining frames via 18 parallel worker streams
      const remainingIndices: number[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (!images[i]) remainingIndices.push(i);
      }

      const CONCURRENCY = 18;
      let currentIndex = 0;

      const worker = async () => {
        while (currentIndex < remainingIndices.length && !isCancelled) {
          const idx = remainingIndices[currentIndex++];
          await loadFrame(idx);
        }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    };

    preloadAll();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Scroll-Driven Left-to-Right / Right-to-Left Physics
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const state = stateRef.current;
      const delta = currentY - state.lastScrollY;
      state.lastScrollY = currentY;

      // Scroll travel range across hero section
      const heroTravel = Math.max(window.innerHeight * 0.95, 650);
      // Normalized ratio: 0 at top, 1 at hero bottom
      const scrollRatio = Math.min(1, Math.max(0, currentY / heroTravel));

      // Scroll Down -> Pan smoothly towards Right (+0.75)
      // Scroll Up   -> Pan smoothly back towards Left (-0.75)
      state.targetPanRatio = -0.75 + scrollRatio * 1.5;

      // Bi-directional scroll scrub boost: scrolling down accelerates, scrolling up rewinds
      if (Math.abs(delta) > 0.5) {
        state.currentFramePos += delta * 0.18;
        // Seamless circular wrapping during manual scrub
        while (state.currentFramePos >= TOTAL_FRAMES) {
          state.currentFramePos = MERGE_FRAMES + (state.currentFramePos - TOTAL_FRAMES);
        }
        while (state.currentFramePos < 0) {
          state.currentFramePos += (TOTAL_FRAMES - MERGE_FRAMES);
        }
      }

      state.isScrolling = true;
      if (state.scrollTimeout) clearTimeout(state.scrollTimeout);
      state.scrollTimeout = setTimeout(() => {
        state.isScrolling = false;
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3. 60 FPS Canvas Render Loop with Seamless Loop Continuation & Sub-frame Dissolve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number;

    // Nearest loaded fallback if an exact frame is momentarily decoding
    const getNearestFrame = (index: number): HTMLImageElement | null => {
      const imgs = imagesRef.current;
      const safeIndex = ((index % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
      if (imgs[safeIndex]) return imgs[safeIndex];
      for (let offset = 1; offset < 40; offset++) {
        const left = (safeIndex - offset + TOTAL_FRAMES) % TOTAL_FRAMES;
        if (imgs[left]) return imgs[left];
        const right = (safeIndex + offset) % TOTAL_FRAMES;
        if (imgs[right]) return imgs[right];
      }
      return null;
    };

    const render = (timestamp: number) => {
      const state = stateRef.current;
      const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.08);
      state.lastTime = timestamp;

      // Continuous ~28 FPS playback
      const frameStep = BASE_FRAME_RATE * deltaTime;
      state.currentFramePos += frameStep;

      // Seamless wrap-around: when reaching end, smoothly merge into beginning continuation
      if (state.currentFramePos >= TOTAL_FRAMES) {
        state.currentFramePos = MERGE_FRAMES + (state.currentFramePos - TOTAL_FRAMES);
      } else if (state.currentFramePos < 0) {
        state.currentFramePos += (TOTAL_FRAMES - MERGE_FRAMES);
      }

      // Buttery smooth lerp for horizontal left-to-right panning
      state.panRatio += (state.targetPanRatio - state.panRatio) * 0.08;

      const cWidth = canvas.width;
      const cHeight = canvas.height;

      // Determine dimensions with 1.30 wide cinematic scaling
      const sampleImg = imagesRef.current[0] || imagesRef.current[1];
      const imgRatio = sampleImg && sampleImg.naturalWidth ? sampleImg.naturalWidth / sampleImg.naturalHeight : 16 / 9;
      const canvasRatio = cWidth / cHeight;
      const scale = 1.30;

      let drawWidth: number;
      let drawHeight: number;

      if (canvasRatio > imgRatio) {
        drawWidth = cWidth * scale;
        drawHeight = (cWidth / imgRatio) * scale;
      } else {
        drawHeight = cHeight * scale;
        drawWidth = (cHeight * imgRatio) * scale;
      }

      // Horizontal camera offset
      const maxOffset = (drawWidth - cWidth) / 2;
      const panOffsetX = state.panRatio * maxOffset;

      const drawX = (cWidth - drawWidth) / 2 + panOffsetX;
      const drawY = (cHeight - drawHeight) / 2;

      // Helper to draw a frame with sub-frame alpha interpolation
      const drawFrame = (framePos: number, layerAlpha: number) => {
        if (layerAlpha <= 0.001) return;
        const pos = ((framePos % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
        const fA = Math.floor(pos);
        const fB = (fA + 1) % TOTAL_FRAMES;
        const subBlend = pos - fA;

        const imgA = getNearestFrame(fA);
        const imgB = getNearestFrame(fB);

        if (imgA && imgA.complete && imgA.naturalWidth > 0) {
          ctx.globalAlpha = layerAlpha;
          ctx.drawImage(imgA, drawX, drawY, drawWidth, drawHeight);

          if (imgB && imgB.complete && imgB.naturalWidth > 0 && subBlend > 0.01) {
            ctx.globalAlpha = layerAlpha * subBlend;
            ctx.drawImage(imgB, drawX, drawY, drawWidth, drawHeight);
          }
        }
      };

      // Check if we are in the loop merge continuation window (last 36 frames)
      if (state.currentFramePos >= TOTAL_FRAMES - MERGE_FRAMES) {
        // Seamless cross-dissolve: end of video smoothly blends into continuation of beginning
        const rawProgress = (state.currentFramePos - (TOTAL_FRAMES - MERGE_FRAMES)) / MERGE_FRAMES;
        // Smoothstep curve for seamless derivative match
        const headAlpha = rawProgress * rawProgress * (3 - 2 * rawProgress);
        const headPos = rawProgress * MERGE_FRAMES;

        // 1. Draw Tail frame
        drawFrame(state.currentFramePos, 1.0);

        // 2. Seamlessly blend incoming Head continuation on top
        drawFrame(headPos, headAlpha);
      } else {
        // Standard high-fidelity frame rendering
        drawFrame(state.currentFramePos, 1.0);
      }

      // Apply dark atmospheric tint directly on canvas
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "rgba(10, 7, 5, 0.45)";
      ctx.fillRect(0, 0, cWidth, cHeight);

      animId = requestAnimationFrame(render);
    };

    // Sharp Retina / DPR canvas resizing
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#0A0705]">
      {/* High-Performance Canvas for 300-Frame Animation */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block will-change-transform"
        style={{
          filter: "brightness(0.68) contrast(1.24) saturate(1.15)",
        }}
      />

      {/* Dark Dramatic Vignettes & Gradient Overlays for High Legibility */}
      {/* Left Gradient: Deep dark tint behind headline and CTAs */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0705]/95 via-[#0A0705]/80 sm:via-[#0A0705]/60 to-transparent to-75% pointer-events-none z-10" />

      {/* Top Vignette: Shadow below header */}
      <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#0A0705]/90 via-[#0A0705]/40 to-transparent pointer-events-none z-10" />

      {/* Bottom Transition: Seamless blend into warm parchment Section 2 */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#F4EFEA] via-[#0A0705]/85 to-transparent pointer-events-none z-10" />

      {/* Subtle Radial Depth Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0A0705]/30 to-[#0A0705]/75 pointer-events-none z-10" />
    </div>
  );
};

export default FirstScrollLoopAnimation;
