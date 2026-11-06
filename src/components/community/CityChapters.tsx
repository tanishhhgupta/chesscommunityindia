import React, { useState, useEffect } from "react";
import { INITIAL_CITIES, CityChapter } from "../../lib/storage/mockDatabase";
import { contentStore, resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  MapPin, 
  Users, 
  MessageCircle, 
  Instagram, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Award, 
  X, 
  Compass, 
  CheckCircle2 
} from "lucide-react";
import { sound } from "../../lib/audio";

export const CityChapters: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<CityChapter | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [cities, setCities] = useState<CityChapter[]>(() => {
    const storeCities = contentStore.getCities();
    return storeCities.length > 0 ? storeCities : INITIAL_CITIES;
  });

  useEffect(() => {
    const sync = () => {
      const storeCities = contentStore.getCities();
      if (storeCities.length > 0) {
        setCities(storeCities);
      }
    };
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const filteredCities = cities;

  return (
    <section id="chapters" className="py-24 relative bg-[#08161A] text-slate-100 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold backdrop-blur-md">
              <Compass className="w-3.5 h-3.5 text-chess-gold" />
              <span>National Footprint</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              From Jabalpur Park Benches to <br />
              <span className="gold-gradient-text">Metro Arenas.</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Chess Community India is powered by decentralized city chapters. Every week, thousands of players gather in cafes, malls, and campus lawns for casual blitz, rated matches, and lifelong camaraderie.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-center">
              <div className="text-2xl font-black text-white font-mono">12,000+</div>
              <div className="text-[11px] text-slate-400 font-medium">Verified Players</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-center">
              <div className="text-2xl font-black text-chess-gold font-mono">20+</div>
              <div className="text-[11px] text-slate-400 font-medium">City Circuits</div>
            </div>
          </div>
        </div>

        {/* City Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              className="group glass-card rounded-3xl overflow-hidden border border-[rgba(245, 242, 235,0.06)] hover:border-chess-gold/40 flex flex-col justify-between transition-all duration-300"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={resolveMediaUrl(city.imageUrl)}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090e17] via-black/30 to-transparent" />

                  {/* Chapter Logo Badge */}
                  {city.logoUrl && (
                    <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-lg">
                      <img src={city.logoUrl} alt={`${city.name} Logo`} className="max-w-full max-h-full object-contain" />
                    </div>
                  )}

                  {/* Origin Badge */}
                  {city.isOrigin && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-chess-gold/90 text-black text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Birthplace
                    </div>
                  )}

                  {/* Member Counter */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold text-white border border-[rgba(245, 242, 235,0.06)]">
                    <Users className="w-3.5 h-3.5 text-chess-gold" />
                    <span>{city.memberCount.toLocaleString()}+ Members</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white group-hover:text-chess-gold transition-colors">
                      {city.name}
                    </h3>
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>

                  <p className="text-xs text-chess-gold/90 font-medium italic">
                    "{city.tagline}"
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {city.description}
                  </p>

                  {/* Venues Snippet */}
                  <div className="pt-2 border-t border-[rgba(245, 242, 235,0.04)] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Regular Venues:
                    </div>
                    {city.weeklyVenues.slice(0, 2).map((v, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-chess-gold shrink-0" />
                        <span className="truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-6 pt-0 space-y-2">
                <button
                  onClick={() => {
                    sound.playGlassClick();
                    setSelectedCity(city);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View Chapter Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={city.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sound.playTactileClick()}
                    className="flex-1 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={city.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sound.playTactileClick()}
                    className="p-2 rounded-xl bg-pink-950/30 hover:bg-pink-900/50 border border-pink-500/30 text-pink-400 text-xs flex items-center justify-center transition-colors"
                    title="Instagram Chapter"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for City Details */}
        {selectedCity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-2xl bg-[#090e17] rounded-3xl border border-chess-gold/30 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedCity(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4">
                {selectedCity.logoUrl && (
                  <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/20 p-2 flex items-center justify-center">
                    <img src={selectedCity.logoUrl} alt={selectedCity.name} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    {selectedCity.name} Chapter
                    {selectedCity.isOrigin && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-chess-gold text-black font-extrabold">ORIGIN</span>
                    )}
                  </h3>
                  <p className="text-xs text-chess-gold font-medium">{selectedCity.tagline}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedCity.description}
              </p>

              {/* Venues Grid */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
                  Weekly Meetups &amp; Board Locations
                </h4>
                <div className="space-y-2">
                  {selectedCity.weeklyVenues.map((venue, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-[rgba(245, 242, 235,0.06)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-sm text-white">
                        <MapPin className="w-4 h-4 text-chess-gold shrink-0" />
                        <span>{venue}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
                        Boards Provided
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapter Leadership */}
              <div className="p-4 rounded-2xl bg-chess-gold/5 border border-chess-gold/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-chess-gold font-bold">Chapter Leadership</div>
                  <div className="text-sm text-white font-semibold">{selectedCity.leadName}</div>
                  <div className="text-[11px] text-slate-400">{selectedCity.leadRole}</div>
                </div>
                <Award className="w-6 h-6 text-chess-gold" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={selectedCity.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Join {selectedCity.name} WhatsApp Hub
                </a>
                <button
                  onClick={() => setSelectedCity(null)}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
