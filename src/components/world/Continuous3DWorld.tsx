import React, { useEffect, useRef } from "react";

const TOTAL_FRAMES_PER_SEQ = 300;

interface Continuous3DWorldProps {
  scrollProgress: number; // 0.0 to 1.0 from parent scroll observer
}

export const Continuous3DWorld: React.FC<Continuous3DWorldProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache for loaded images from sequences
  const seq1Images = useRef<Map<number, HTMLImageElement>>(new Map());
  const seq2Images = useRef<Map<number, HTMLImageElement>>(new Map());
  
  // Keep track of last drawn valid frame to prevent any blank or distant fallback flashes
  const lastDrawnSeq1Ref = useRef<HTMLImageElement | null>(null);
  const lastDrawnSeq2Ref = useRef<HTMLImageElement | null>(null);

  // Decouple scroll progress prop from canvas lifecycle
  const targetProgressRef = useRef<number>(scrollProgress);
  const currentProgressRef = useRef<number>(scrollProgress);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0 });

  // Update target progress ref whenever prop updates without restarting render loop
  useEffect(() => {
    targetProgressRef.current = Math.max(0, Math.min(1, scrollProgress));
  }, [scrollProgress]);

  // Helper to format frame path from public/sequences
  const getFrameUrl = (seq: 1 | 2, index: number) => {
    const padded = String(Math.max(1, Math.min(TOTAL_FRAMES_PER_SEQ, Math.round(index)))).padStart(3, "0");
    const folder = seq === 1 ? "/sequences/seq01" : "/sequences/seq02";
    return `${folder}/ezgif-frame-${padded}.jpg`;
  };

  // Helper to load an image with background decode
  const loadImage = (seq: 1 | 2, index: number): Promise<HTMLImageElement> => {
    const map = seq === 1 ? seq1Images.current : seq2Images.current;
    if (map.has(index)) {
      return Promise.resolve(map.get(index)!);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.src = getFrameUrl(seq, index);
      const onLoad = () => {
        if ("decode" in img) {
          img.decode().catch(() => {}).finally(() => {
            map.set(index, img);
            resolve(img);
          });
        } else {
          map.set(index, img);
          resolve(img);
        }
      };
      img.onload = onLoad;
      img.onerror = () => {
        // Resolve anyway to prevent hanging
        resolve(img);
      };
    });
  };

  // Optimized progressive preheating: priority scaffold first, then smooth idle batch backfill
  useEffect(() => {
    let cancelled = false;

    const preloadScaffold = async () => {
      // 1. Immediate Priority: First 30 frames of Sequence 1 (hero view)
      const immediateSeq1: Promise<any>[] = [];
      for (let i = 1; i <= 30; i++) {
        immediateSeq1.push(loadImage(1, i));
      }
      // Also grab initial frame of Sequence 2
      immediateSeq1.push(loadImage(2, 1));
      await Promise.all(immediateSeq1);
      if (cancelled) return;

      // 2. High Priority Keyframes: every 4th frame across both sequences
      // This guarantees an instant high-resolution frame is available wherever the user scrubs
      const keyIndices: number[] = [];
      for (let i = 1; i <= TOTAL_FRAMES_PER_SEQ; i += 4) {
        keyIndices.push(i);
      }

      for (let i = 0; i < keyIndices.length; i += 6) {
        if (cancelled) return;
        const chunk = keyIndices.slice(i, i + 6);
        await Promise.all([
          ...chunk.map(idx => loadImage(1, idx)),
          ...chunk.map(idx => loadImage(2, idx))
        ]);
        // Yield briefly so UI and main thread remain completely free
        await new Promise((r) => setTimeout(r, 12));
      }

      // 3. Background Idle Backfill: Fill all intermediate frames smoothly in batches
      const remaining: number[] = [];
      for (let i = 1; i <= TOTAL_FRAMES_PER_SEQ; i++) {
        if (!seq1Images.current.has(i) || !seq2Images.current.has(i)) {
          remaining.push(i);
        }
      }

      for (let i = 0; i < remaining.length; i += 8) {
        if (cancelled) return;
        const chunk = remaining.slice(i, i + 8);
        await Promise.all([
          ...chunk.map(idx => loadImage(1, idx)),
          ...chunk.map(idx => loadImage(2, idx))
        ]);
        await new Promise((r) => setTimeout(r, 20));
      }
    };

    preloadScaffold();

    return () => {
      cancelled = true;
    };
  }, []);

  // Subtle mouse spatial tracking for gentle parallax
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const currentSpeed = dist / dt;
      mouseRef.current.speed = mouseRef.current.speed * 0.85 + currentSpeed * 0.15;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Persistent, high-framerate 60fps/120fps hardware-accelerated canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // High-DPI crisp buffer sizing (capped at 2.0 to balance razor sharpness with 60/120Hz GPU fill)
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    // Multilayer 3D Atmospheric Stardust Particles (gold & emerald teal)
    const particles = Array.from({ length: 48 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 2 + 0.5,
      size: Math.random() * 1.6 + 0.6,
      speedY: (Math.random() - 0.5) * 0.18,
      speedX: (Math.random() - 0.5) * 0.14,
      opacity: Math.random() * 0.4 + 0.15,
      isTeal: i % 3 === 0,
    }));

    let animId: number;
    let time = 0;

    // Helper to get best available frame
    const getBestFrame = (seq: 1 | 2, frameIndex: number): HTMLImageElement | null => {
      const map = seq === 1 ? seq1Images.current : seq2Images.current;
      const target = Math.max(1, Math.min(TOTAL_FRAMES_PER_SEQ, frameIndex));
      const exact = map.get(target);
      if (exact && exact.complete && exact.naturalWidth > 0) {
        return exact;
      }

      // Check last drawn frame for this sequence
      const lastDrawn = seq === 1 ? lastDrawnSeq1Ref.current : lastDrawnSeq2Ref.current;
      if (lastDrawn && lastDrawn.complete && lastDrawn.naturalWidth > 0) {
        return lastDrawn;
      }

      // Nearest loaded fallback
      let closestImg: HTMLImageElement | null = null;
      let minDiff = Infinity;
      for (const [idx, img] of map.entries()) {
        if (img.complete && img.naturalWidth > 0) {
          const diff = Math.abs(idx - target);
          if (diff < minDiff) {
            minDiff = diff;
            closestImg = img;
          }
        }
      }
      return closestImg;
    };

    const render = () => {
      time += 0.016;

      // Silky-smooth camera momentum lerp: 0.088 factor gives responsive yet luxurious weight
      const targetP = targetProgressRef.current;
      const diff = targetP - currentProgressRef.current;
      if (Math.abs(diff) < 0.0001) {
        currentProgressRef.current = targetP;
      } else {
        currentProgressRef.current += diff * 0.088;
      }
      const p = Math.max(0, Math.min(1, currentProgressRef.current));

      // Mouse spatial inertia
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const width = canvas.width;
      const height = canvas.height;

      // Enable Bicubic Image Smoothing for Upscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 1. Base Dark Teal Obsidian Fill
      ctx.fillStyle = "#08161A";
      ctx.fillRect(0, 0, width, height);

      // 2. Compute sequence, fractional frame, and adjacent crossfade frames
      let seq: 1 | 2 = 1;
      let exactFrame = 1;

      if (p <= 0.45) {
        seq = 1;
        const subP = p / 0.45;
        exactFrame = 1 + subP * (TOTAL_FRAMES_PER_SEQ - 1);
      } else if (p <= 0.80) {
        seq = 2;
        const subP = (p - 0.45) / 0.35;
        exactFrame = 1 + subP * 84;
      } else {
        seq = 2;
        const subP = (p - 0.80) / 0.20;
        exactFrame = 220 + subP * 79;
      }

      const frameFloor = Math.floor(exactFrame);
      const frameCeil = Math.min(TOTAL_FRAMES_PER_SEQ, frameFloor + 1);
      const crossfadeBlend = exactFrame - frameFloor;

      const imgA = getBestFrame(seq, frameFloor);
      const imgB = crossfadeBlend > 0.03 ? getBestFrame(seq, frameCeil) : null;

      if (imgA && imgA.complete && imgA.naturalWidth > 0) {
        if (seq === 1) lastDrawnSeq1Ref.current = imgA;
        else lastDrawnSeq2Ref.current = imgA;

        const imgAspect = imgA.naturalWidth / imgA.naturalHeight;
        const canvasAspect = width / height;

        let drawW: number;
        let drawH: number;
        let offX: number;
        let offY: number;

        // Cover fit with subtle bleed
        if (canvasAspect > imgAspect) {
          drawW = width * 1.02;
          drawH = drawW / imgAspect;
          offX = (width - drawW) / 2;
          offY = (height - drawH) / 2;
        } else {
          drawH = height * 1.02;
          drawW = drawH * imgAspect;
          offX = (width - drawW) / 2;
          offY = (height - drawH) / 2;
        }

        // Parallax offset
        const parallaxX = mouseRef.current.x * 12;
        const parallaxY = mouseRef.current.y * 12 + Math.sin(time * 0.75) * 4;

        // Draw primary base frame
        ctx.save();
        ctx.globalAlpha = 0.98;
        ctx.drawImage(imgA, offX + parallaxX, offY + parallaxY, drawW, drawH);

        // Frame crossfade: smoothly blend consecutive frame for filmic 60/120fps motion
        if (imgB && imgB !== imgA && imgB.complete && imgB.naturalWidth > 0) {
          ctx.globalAlpha = crossfadeBlend * 0.98;
          ctx.drawImage(imgB, offX + parallaxX, offY + parallaxY, drawW, drawH);
        }
        ctx.restore();

        // 3. Top & Bottom Edge Masking for Pristine Visual Cleanliness
        // Cleans mock website UI headers ("Foillern", "allage", buttons)
        const topMaskRatio = seq === 2 && frameFloor > 85 ? 0.26 : 0.12;

        const topMask = ctx.createLinearGradient(0, offY + parallaxY, 0, offY + parallaxY + drawH * topMaskRatio);
        topMask.addColorStop(0, "#08161A");
        topMask.addColorStop(0.70, "#08161A");
        topMask.addColorStop(1, "rgba(7, 20, 24, 0)");
        ctx.fillStyle = topMask;
        ctx.fillRect(0, 0, width, offY + parallaxY + drawH * (topMaskRatio + 0.02));

        // Bottom mask: softens bottom edge into deep obsidian
        const bottomMask = ctx.createLinearGradient(0, offY + parallaxY + drawH * 0.88, 0, offY + parallaxY + drawH);
        bottomMask.addColorStop(0, "rgba(7, 20, 24, 0)");
        bottomMask.addColorStop(0.45, "#08161A");
        bottomMask.addColorStop(1, "#08161A");
        ctx.fillStyle = bottomMask;
        ctx.fillRect(0, offY + parallaxY + drawH * 0.87, width, height - (offY + parallaxY + drawH * 0.87));

        // 4. Subtle Cinematic Vignette (blending outer perimeter into rich dark teal #08161A)
        const radial = ctx.createRadialGradient(
          width * 0.5,
          height * 0.48,
          Math.min(width, height) * 0.30,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.78
        );
        radial.addColorStop(0, "rgba(7, 20, 24, 0)");
        radial.addColorStop(0.55, "rgba(7, 20, 24, 0.25)");
        radial.addColorStop(0.85, "rgba(7, 20, 24, 0.75)");
        radial.addColorStop(1, "rgba(7, 20, 24, 0.98)");

        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      // 5. Atmospheric floating particles with 3D depth parallax
      ctx.save();
      for (const pt of particles) {
        pt.y += pt.speedY * pt.z;
        pt.x += pt.speedX * pt.z;

        if (pt.y < 0) pt.y = window.innerHeight;
        if (pt.y > window.innerHeight) pt.y = 0;
        if (pt.x < 0) pt.x = window.innerWidth;
        if (pt.x > window.innerWidth) pt.x = 0;

        ctx.fillStyle = pt.isTeal 
          ? `rgba(158, 152, 141, ${pt.opacity * 0.75})`
          : `rgba(204, 164, 101, ${pt.opacity})`;
        ctx.beginPath();
        ctx.arc(
          pt.x * (width / window.innerWidth) + mouseRef.current.x * (6 * pt.z),
          pt.y * (height / window.innerHeight) + mouseRef.current.y * (6 * pt.z),
          pt.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []); // Run ONCE on mount — completely persistent render loop

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#08161A]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block will-change-transform"
        style={{
          // Hardware-accelerated presentation without costly CPU/GPU filter recomputation
          transform: "translateZ(0)",
        }}
      />
      {/* Archival dark obsidian atmospheric ambient depth gradients framing the viewport */}
      <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#08161A] via-[#08161A]/85 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#08161A] via-[#08161A]/85 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#08161A]/75 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#08161A]/75 to-transparent pointer-events-none" />
    </div>
  );
};
