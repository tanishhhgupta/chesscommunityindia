import React, { useState, useEffect } from "react";
import { INITIAL_GALLERY, GalleryItem } from "../../lib/storage/mockDatabase";
import { contentStore, resolveMediaUrl } from "../../lib/storage/contentStore";
import { Camera, MapPin, Calendar, Maximize2, X, Sparkles } from "lucide-react";
import { sound } from "../../lib/audio";

export const CommunityGallery: React.FC = () => {
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);
  const [, setContentTimestamp] = useState(Date.now());

  useEffect(() => {
    const sync = () => setContentTimestamp(Date.now());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  return (
    <section id="gallery" className="py-24 relative bg-[#08161A] border-t border-[rgba(245, 242, 235,0.04)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold">
            <Camera className="w-3.5 h-3.5 text-chess-gold" />
            <span>Moments of Chess Passion</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            The Living Culture of <br />
            <span className="gold-gradient-text">Indian Squares.</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Real games, real intensity, real community. Glimpses into our weekend cafe blitz battles, collegiate championship halls, and grassroots training camps.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_GALLERY.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                sound.playGlassClick();
                setActivePhoto(item);
              }}
              className="group relative rounded-3xl overflow-hidden cursor-pointer h-72 border border-[rgba(245, 242, 235,0.06)] hover:border-chess-gold/50 transition-all duration-300 shadow-xl"
            >
              <img
                src={resolveMediaUrl(item.imageUrl)}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:via-black/20 transition-all" />

              {/* Hover Badge */}
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-chess-gold" />
              </div>

              {/* Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-mono text-chess-gold font-bold">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location} &bull; {item.year}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activePhoto && (
          <div 
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-2xl animate-fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-[#0a0f18] rounded-3xl border border-chess-gold/40 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={resolveMediaUrl(activePhoto.imageUrl)}
                  alt={activePhoto.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-2 bg-[#090e17] border-t border-[rgba(245, 242, 235,0.06)]">
                <div className="flex items-center gap-2 text-xs font-mono text-chess-gold font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>{activePhoto.location} &bull; Captured {activePhoto.year}</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  {activePhoto.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activePhoto.caption}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
