import React, { useState } from "react";
import { INITIAL_EVENTS, EventItem, saveEventRegistration } from "../../lib/storage/mockDatabase";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  QrCode, 
  Share2 
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "../../lib/audio";

export const EventsCalendar: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("Jabalpur");
  const [regFideId, setRegFideId] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const filteredEvents = INITIAL_EVENTS.filter((e) => {
    if (filter === "all") return true;
    return e.status === filter;
  });

  const handleOpenRegister = (ev: EventItem) => {
    sound.playGlassClick();
    setSelectedEvent(ev);
    setRegistrationSuccess(false);
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !regName || !regEmail) return;

    saveEventRegistration({
      eventId: selectedEvent.id,
      name: regName,
      email: regEmail,
      phone: regPhone,
      city: regCity,
      fideId: regFideId || undefined
    });

    sound.playGoldenChord();
    setRegistrationSuccess(true);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#3B82F6", "#10B981"]
    });
  };

  return (
    <section id="events" className="py-24 relative bg-[#08161A] border-t border-[rgba(245, 242, 235,0.04)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold">
              <Calendar className="w-3.5 h-3.5 text-chess-gold" />
              <span>National Tournament Calendar</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Tournaments, Drives &amp; <br />
              <span className="gold-gradient-text">Masterclasses.</span>
            </h2>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Find upcoming rated Swiss showdowns, weekend cafe blitz arena drives, and college championships across India. All events feature verified arbiters and count toward your CCI continuum rating.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] self-start md:self-end">
            {(["all", "upcoming", "ongoing", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  sound.playTactileClick();
                  setFilter(tab);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === tab
                    ? "bg-chess-gold text-black shadow-lg shadow-chess-gold/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "All Circuits" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`group glass-card rounded-3xl p-6 border flex flex-col justify-between transition-all duration-300 ${
                event.status === "ongoing"
                  ? "border-emerald-500/40 bg-emerald-950/[0.08]"
                  : event.isFeatured
                    ? "border-chess-gold/30 hover:border-chess-gold"
                    : "border-[rgba(245, 242, 235,0.06)] hover:border-white/20"
              }`}
            >
              <div className="space-y-4">
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    event.status === "ongoing"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      : event.status === "upcoming"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-slate-800 text-slate-400"
                  }`}>
                    {event.status === "ongoing" ? "LIVE NOW" : event.category}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {event.city}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-chess-gold transition-colors">
                  {event.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                {/* Details Meta */}
                <div className="space-y-2 pt-2 border-t border-[rgba(245, 242, 235,0.04)] text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-chess-gold" />
                    <span>{event.startsAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{event.timeControl} &bull; {event.format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-chess-gold">{event.prizePool}</span>
                  </div>
                </div>

                {/* Capacity Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Registered: {event.registeredCount} / {event.capacity}</span>
                    <span className="font-mono text-chess-gold font-bold">
                      {Math.round((event.registeredCount / event.capacity) * 100)}% Full
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-chess-gold"
                      style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {event.status === "ongoing" ? (
                  <a
                    href="#tournaments"
                    onClick={() => sound.playTactileClick()}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02]"
                  >
                    <span>View Live Pairings &amp; Standings</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : event.status === "upcoming" ? (
                  <button
                    onClick={() => handleOpenRegister(event)}
                    className="w-full py-3 rounded-2xl gold-gradient-btn text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    <span>Register Now &bull; {event.entryFee}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-2xl bg-white/5 text-slate-400 text-center text-xs font-semibold">
                    Tournament Completed &bull; Standings Archived
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Registration Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#090e17] rounded-3xl border border-chess-gold/30 shadow-2xl p-6 sm:p-8 space-y-6">
              
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!registrationSuccess ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-chess-gold">
                      Official Tournament Registration
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedEvent.venue} &bull; {selectedEvent.timeControl}
                    </p>
                  </div>

                  <form onSubmit={handleSubmitRegistration} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Praggnanandhaa R."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="player@gmail.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          WhatsApp Mobile *
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          City
                        </label>
                        <select
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-[rgba(245, 242, 235,0.06)] text-white text-sm focus:outline-none focus:border-chess-gold"
                        >
                          <option value="Jabalpur">Jabalpur</option>
                          <option value="Bhopal">Bhopal</option>
                          <option value="Indore">Indore</option>
                          <option value="Delhi">Delhi NCR</option>
                          <option value="Bangalore">Bengaluru</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Other">Other City</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          FIDE ID / Rating (Optional)
                        </label>
                        <input
                          type="text"
                          value={regFideId}
                          onChange={(e) => setRegFideId(e.target.value)}
                          placeholder="Unrated / 5049382"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-chess-gold/30 text-xs text-slate-300 flex items-center justify-between">
                      <span>Entry Fee Total:</span>
                      <span className="font-bold text-chess-gold text-sm">{selectedEvent.entryFee}</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl gold-gradient-btn text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Official Registration</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-5 py-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">Registration Confirmed!</h3>
                    <p className="text-xs text-slate-300">
                      Welcome to the tournament roster, <strong className="text-white">{regName}</strong>.
                    </p>
                  </div>

                  {/* Digital Ticket Pass */}
                  <div className="p-5 rounded-2xl bg-white/[0.04] border border-[rgba(245, 242, 235,0.06)] text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-3">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-chess-gold">CCI Player Pass</div>
                        <div className="text-sm font-bold text-white">{selectedEvent.title}</div>
                      </div>
                      <QrCode className="w-10 h-10 text-chess-gold" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>City: <span className="text-white font-medium">{regCity}</span></div>
                      <div>Venue: <span className="text-white font-medium">{selectedEvent.venue}</span></div>
                      <div>Format: <span className="text-white font-medium">{selectedEvent.timeControl}</span></div>
                      <div>Reporting: <span className="text-white font-medium">30 Mins Before Round 1</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
