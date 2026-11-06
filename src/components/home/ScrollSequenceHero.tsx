import React, { useEffect, useRef, useState, useCallback } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Swords, 
  Trophy, 
  Compass, 
  Layers, 
  ChevronDown, 
  Volume2, 
  VolumeX,
  Box,
  Film
} from "lucide-react";
import { sound } from "../../lib/audio";
import { InteractiveChessScene } from "../3d/InteractiveChessScene";

interface ScrollSequenceHeroProps {
  onOpenAuth: () => void;
}

const TOTAL_FRAMES = 300;

export const ScrollSequenceHero: React.FC<ScrollSequenceHeroProps> = ({ onOpenAuth }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [activeSequence, setActiveSequence] = useState<1 | 2>(1);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(1);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Cached Image elements for Sequence 1 and Sequence 2
  const imagesSeq1Ref = useRef<Map<number, HTMLImageElement>>(new Map());
  const imagesSeq2Ref = useRef<Map<number, HTMLImageElement>>(new Map());
  const playIntervalRef = useRef<number | null>(null);

  // Helper to format frame path based on active sequence
  const getFrameUrl = (seq: 1 | 2, index: number) => {
    const padded = String(index).padStart(3, "0");
    const folder = seq === 1 ? "/frames" : "/frames2";
    return `${folder}/ezgif-frame-${padded}.jpg`;
  };

  const getActiveImagesMap = useCallback(() => {
    return activeSequence === 1 ? imagesSeq1Ref.current : imagesSeq2Ref.current;
  }, [activeSequence]);

  // Draw a frame onto the canvas with crisp aspect-fit and seamless void blending
  const renderFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentMap = activeSequence === 1 ? imagesSeq1Ref.current : imagesSeq2Ref.current;

    // Find the requested image or the closest cached frame
    let img = currentMap.get(frameIdx);
    if (!img || !img.complete || img.naturalWidth === 0) {
      let closestIdx = 1;
      let minDiff = Infinity;
      for (const [idx, loadedImg] of currentMap.entries()) {
        if (loadedImg.complete && loadedImg.naturalWidth > 0) {
          const diff = Math.abs(idx - frameIdx);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        }
      }
      img = currentMap.get(closestIdx);
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear with exact void background
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate aspect ratio fit (contain / cover)
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (canvasAspect > imgAspect) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

    // Render 3D frame
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Draw luxury soft edge vignette so the 1920x1080 bounds completely melt into #080808
    const gradient = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      Math.min(canvasWidth, canvasHeight) * 0.38,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(canvasWidth, canvasHeight) * 0.74
    );
    gradient.addColorStop(0, "rgba(8, 8, 8, 0)");
    gradient.addColorStop(0.7, "rgba(8, 8, 8, 0.45)");
    gradient.addColorStop(1, "rgba(8, 8, 8, 0.98)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, [activeSequence]);

  // Set up canvas sizing
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    renderFrame(currentFrameIndex);
  }, [currentFrameIndex, renderFrame]);

  // Preloading sequence
  useEffect(() => {
    let isCancelled = false;

    // Preload current sequence
    const currentMap = activeSequence === 1 ? imagesSeq1Ref.current : imagesSeq2Ref.current;

    // 1. Immediately preload the first frame for instantaneous hero display
    const firstImg = new Image();
    firstImg.src = getFrameUrl(activeSequence, 1);
    firstImg.onload = () => {
      if (isCancelled) return;
      currentMap.set(1, firstImg);
      updateCanvasSize();
    };

    // 2. Progressive preheating in batches
    // Phase A: Preload key intervals (every 4th frame)
    const keyFrames: number[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += 4) {
      keyFrames.push(i);
    }

    let loadedCount = 1;

    const loadSingle = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (currentMap.has(index)) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = getFrameUrl(activeSequence, index);
        img.onload = () => {
          if (!isCancelled) {
            currentMap.set(index, img);
            loadedCount++;
            setLoadingProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100));
          }
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
      });
    };

    const preloadAll = async () => {
      for (const kf of keyFrames) {
        if (isCancelled) return;
        await loadSingle(kf);
      }

      const remaining: number[] = [];
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (!currentMap.has(i)) remaining.push(i);
      }

      const batchSize = 6;
      for (let i = 0; i < remaining.length; i += batchSize) {
        if (isCancelled) return;
        const batch = remaining.slice(i, i + batchSize);
        await Promise.all(batch.map((idx) => loadSingle(idx)));
      }
    };

    preloadAll();

    return () => {
      isCancelled = true;
    };
  }, [activeSequence, updateCanvasSize]);

  // Handle Resize
  useEffect(() => {
    window.addEventListener("resize", updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  // Handle Scroll to scrub frames
  useEffect(() => {
    if (is3DMode) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.scrollHeight - window.innerHeight;
      const scrollOffset = -rect.top;

      let progress = scrollOffset / containerHeight;
      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress);

      const targetFrame = Math.max(1, Math.min(TOTAL_FRAMES, Math.floor(progress * (TOTAL_FRAMES - 1)) + 1));
      
      if (targetFrame !== currentFrameIndex) {
        setCurrentFrameIndex(targetFrame);
        renderFrame(targetFrame);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentFrameIndex, is3DMode, renderFrame]);

  // Auto-play feature
  const togglePlay = () => {
    sound.playTactileClick();
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => {
          const next = prev >= TOTAL_FRAMES ? 1 : prev + 1;
          renderFrame(next);
          return next;
        });
      }, 33);
    }
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  const handleSeek = (newVal: number) => {
    sound.playGlassClick();
    setCurrentFrameIndex(newVal);
    renderFrame(newVal);
  };

  const toggleSound = () => {
    const newState = sound.toggle();
    setSoundEnabled(newState);
  };

  // Determine storytelling phase
  const phase = currentFrameIndex < 75 
    ? 1 
    : currentFrameIndex < 160 
      ? 2 
      : currentFrameIndex < 240 
        ? 3 
        : 4;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-[#080808] text-[#F5F1E8] selection:bg-[#C9A45C] selection:text-[#080808]"
      style={{ height: is3DMode ? "auto" : "380vh" }}
    >
      {/* Pinned Sticky Stage */}
      <div className={`sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between z-10 ${is3DMode ? "py-12" : ""}`}>
        
        {/* Top Floating Controls Bar */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between z-30 pointer-events-none">
          {/* Brand Pill */}
          <div className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 border border-[rgba(245, 242, 235,0.06)] backdrop-blur-xl shadow-2xl">
            <img src={resolveMediaUrl("/logos/cci-logo.png")} alt="CCI Emblem" className="w-7 h-7 object-contain rounded-full border border-[#C9A45C]/40" />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                Chess Community India
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C] animate-pulse" />
              </span>
              <span className="text-[10px] text-[#8D8D8D] font-medium">
                {activeSequence === 1 ? "Cinema I &bull; Obsidian Medallion & Spatial Cards" : "Cinema II &bull; Crystal Glass & Grandmaster Knight"}
              </span>
            </div>
          </div>

          {/* Controls: Cinema Switcher, 3D Mode & Audio */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
            {/* Sequence 1 vs Sequence 2 Selector */}
            <div className="hidden sm:flex items-center p-1 rounded-2xl bg-black/60 border border-[rgba(245, 242, 235,0.06)] backdrop-blur-xl">
              <button
                onClick={() => {
                  sound.playPieceMove();
                  setActiveSequence(1);
                  setIs3DMode(false);
                  renderFrame(currentFrameIndex);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSequence === 1 && !is3DMode
                    ? "bg-[#C9A45C] text-[#080808] shadow-md shadow-[#C9A45C]/20"
                    : "text-[#8D8D8D] hover:text-[#F5F1E8]"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Cinema I</span>
              </button>
              <button
                onClick={() => {
                  sound.playPieceMove();
                  setActiveSequence(2);
                  setIs3DMode(false);
                  renderFrame(currentFrameIndex);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSequence === 2 && !is3DMode
                    ? "bg-[#C9A45C] text-[#080808] shadow-md shadow-[#C9A45C]/20"
                    : "text-[#8D8D8D] hover:text-[#F5F1E8]"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Cinema II</span>
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              aria-label="Toggle Sound"
              className={`p-2.5 rounded-2xl border backdrop-blur-xl transition-all ${
                soundEnabled 
                  ? "bg-[#C9A45C]/15 border-[#C9A45C]/40 text-[#C9A45C]" 
                  : "bg-black/60 border-[rgba(245, 242, 235,0.06)] text-slate-400 hover:text-white"
              }`}
              title={soundEnabled ? "Tactile Audio Active" : "Audio Muted"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* 3D Interactive Mode Toggle */}
            <button
              onClick={() => {
                sound.playTactileClick();
                setIs3DMode(!is3DMode);
              }}
              className={`px-3.5 py-2 rounded-2xl border backdrop-blur-xl text-xs font-bold flex items-center gap-2 transition-all ${
                is3DMode 
                  ? "bg-amber-500/20 border-[#C9A45C] text-[#C9A45C] shadow-lg shadow-[#C9A45C]/20" 
                  : "bg-black/60 border-[rgba(245, 242, 235,0.06)] text-slate-300 hover:text-white hover:border-white/20"
              }`}
            >
              <Box className="w-4 h-4 text-[#C9A45C]" />
              <span className="hidden sm:inline">{is3DMode ? "Return to 600-Frame Cinema" : "Switch to Free 3D Tilt"}</span>
              <span className="sm:hidden">{is3DMode ? "Cinema" : "3D Tilt"}</span>
            </button>
          </div>
        </div>

        {/* Central Display Area: Frame Sequence or Free 3D WebGL */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          {is3DMode ? (
            <div className="pointer-events-auto w-full max-w-4xl h-[550px] relative z-20">
              <InteractiveChessScene />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
              />
              {/* Edge Gradient Mask for 100% Void Immersion into #080808 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/85 via-transparent to-[#080808]/85 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Storytelling Overlays (Synchronized with Frame Index / Scroll) */}
        {!is3DMode && (
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none my-auto">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              {/* Phase 1: Core Hero Branding */}
              {phase === 1 && (
                <div className="lg:col-span-7 space-y-6 animate-fade-in pointer-events-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill-dark text-xs font-semibold text-[#E0C895]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
                    <span>Chess Community India</span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white font-serif-editorial tracking-tight leading-[1.05]">
                    More Than a <br />
                    <span className="gold-gradient-text">Game.</span>
                  </h1>

                  <p className="text-base sm:text-lg text-[#F5F1E8]/90 max-w-xl font-normal leading-relaxed">
                    Building communities, creating opportunities, and growing chess across India. From our birthplace in Jabalpur to 24+ thriving cities nationwide.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <a
                      href="#join-portal"
                      onClick={() => sound.playTactileClick()}
                      className="gold-gradient-btn px-7 py-3.5 rounded-2xl text-[#080808] font-black text-sm sm:text-base flex items-center gap-2 shadow-xl hover:scale-102 transition-transform"
                    >
                      <Swords className="w-4 h-4" />
                      JOIN THE COMMUNITY
                    </a>

                    <a
                      href="#about"
                      onClick={() => sound.playTactileClick()}
                      className="px-7 py-3.5 rounded-2xl bg-[#141414]/90 hover:bg-[#202020] text-white font-bold text-sm sm:text-base border border-[rgba(245, 242, 235,0.06)] flex items-center gap-2 transition-all hover:border-[#C9A45C]/40"
                    >
                      <Compass className="w-4 h-4 text-[#C9A45C]" />
                      EXPLORE CCI
                    </a>
                  </div>

                  {/* Micro stats */}
                  <div className="pt-4 flex items-center gap-8 text-xs text-[#8D8D8D]">
                    <div>
                      <span className="text-xl font-black text-white font-mono block">12,500+</span>
                      Active Players
                    </div>
                    <div>
                      <span className="text-xl font-black text-[#C9A45C] font-mono block">45</span>
                      Elo Micro-Tiers
                    </div>
                    <div>
                      <span className="text-xl font-black text-blue-400 font-mono block">24+</span>
                      Indian Cities
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2: Spatial Disassembly & Materiality */}
              {phase === 2 && (
                <div className="lg:col-span-6 space-y-4 animate-fade-in pointer-events-auto glass-dark p-6 rounded-3xl max-w-lg shadow-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#C9A45C] uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    Spatial Materiality &amp; 3D Depth
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black text-white font-serif-editorial">
                    Obsidian Veins &amp; Optical Crystal Glass.
                  </h2>

                  <p className="text-xs sm:text-sm text-[#8D8D8D] leading-relaxed">
                    Witness the dimensional architecture in slow cinematic motion. Floating black marble cards, precision-carved gold medals, and tournament-weighted brass pieces float with physical acoustic harmony.
                  </p>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.04)]">
                      <span className="text-slate-400">Tactile Foundation:</span>
                      <span className="text-white font-semibold">Italian Obsidian Stone &amp; Brushed Brass</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.04)]">
                      <span className="text-slate-400">Emblem Core:</span>
                      <span className="text-[#C9A45C] font-semibold">Champagne Gold Seal with CCI Knight</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 3: Tournament Engine Internals */}
              {phase === 3 && (
                <div className="lg:col-span-6 lg:ml-auto space-y-4 animate-fade-in pointer-events-auto glass-dark p-6 rounded-3xl max-w-lg shadow-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    FIDE Dutch Swiss Mathematics
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black text-white font-serif-editorial">
                    Algorithmic Arbiter Desk.
                  </h2>

                  <p className="text-xs sm:text-sm text-[#8D8D8D] leading-relaxed">
                    Behind every move lies our high-performance pairings engine. Featuring strict color balancing (no triple-colors), repeat-pairing prevention, and real-time Buchholz Cut-1 and Sonneborn-Berger recalculations.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30">
                      <div className="text-xs text-blue-300 font-bold">Buchholz Cut-1</div>
                      <div className="text-[11px] text-slate-400">Automated tiebreak sum excluding lowest adversary score</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-950/30 border border-[#C9A45C]/30">
                      <div className="text-xs text-[#C9A45C] font-bold">Sonneborn-Berger</div>
                      <div className="text-[11px] text-slate-400">Weighted opponent scoring for definitive medal clarity</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 4: Reassembly & 45 Tiers */}
              {phase === 4 && (
                <div className="lg:col-span-7 space-y-4 animate-fade-in pointer-events-auto glass-dark p-6 rounded-3xl max-w-xl shadow-2xl">
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#C9A45C] uppercase tracking-wider">
                    <Trophy className="w-4 h-4" />
                    The 45-Tier Elo Continuum
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial">
                    From <span className="text-red-400">Blunder</span> to <span className="gold-gradient-text">Chaturanga Deva</span>.
                  </h2>

                  <p className="text-xs sm:text-sm text-[#8D8D8D] leading-relaxed">
                    Components lock seamlessly back together. Every game you play at our cafe meetups, campus opens, or national Swiss events counts toward your verified CCI rating continuum.
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href="#tiers"
                      onClick={() => sound.playTactileClick()}
                      className="gold-gradient-btn px-5 py-2.5 rounded-xl text-[#080808] font-black text-xs sm:text-sm flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Explore 45 Tiers Continuum
                    </a>
                    <a
                      href="#calculator"
                      onClick={() => sound.playTactileClick()}
                      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-colors"
                    >
                      Rating Math Calculator
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Bottom Interactive HUD & Scrub Controller */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 z-30 pointer-events-auto">
          <div className="p-3.5 sm:p-4 rounded-2xl glass-dark shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Play/Pause & Frame Counter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause cinematic tour" : "Play cinematic tour"}
                className="w-9 h-9 rounded-xl bg-[#C9A45C]/20 hover:bg-[#C9A45C]/30 text-[#C9A45C] border border-[#C9A45C]/40 flex items-center justify-center transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-white">
                  FRAME {String(currentFrameIndex).padStart(3, "0")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">/ {TOTAL_FRAMES}</span>
              </div>

              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#C9A45C] px-2.5 py-1 rounded-lg bg-[#C9A45C]/10 border border-[#C9A45C]/20">
                {phase === 1 && "Stage 1: Hero Assembly"}
                {phase === 2 && "Stage 2: Spatial Disassembly"}
                {phase === 3 && "Stage 3: Engine Telemetry"}
                {phase === 4 && "Stage 4: Complete Unity"}
              </div>
            </div>

            {/* Scrub Slider */}
            <div className="w-full sm:max-w-md flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">01</span>
              <input
                type="range"
                min="1"
                max={TOTAL_FRAMES}
                value={currentFrameIndex}
                onChange={(e) => handleSeek(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#C9A45C] focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono">{TOTAL_FRAMES}</span>
            </div>

            {/* Scroll Hint */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-[#8D8D8D]">
              <ChevronDown className="w-4 h-4 text-[#C9A45C] animate-bounce" />
              <span>Scroll down to disassemble</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
