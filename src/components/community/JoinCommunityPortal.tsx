import React, { useState } from "react";
import { 
  Users, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Award, 
  CheckCircle2, 
  Send, 
  ArrowRight,
  ShieldCheck,
  HeartHandshake
} from "lucide-react";
import { sound } from "../../lib/audio";

type RoleType = "player" | "arbiter" | "chapter_lead" | "volunteer" | "campus_ambassador";

export const JoinCommunityPortal: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleType>("player");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Jabalpur");
  const [experience, setExperience] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playGoldenChord();
    setSubmitted(true);
  };

  const roles = [
    {
      id: "player" as RoleType,
      title: "Active Player",
      subtitle: "Compete in local blitz and Swiss opens",
      badge: "Grassroots Access",
      icon: Users,
    },
    {
      id: "chapter_lead" as RoleType,
      title: "Start a City Chapter",
      subtitle: "Launch CCI tables in your hometown",
      badge: "Leadership Grant",
      icon: MapPin,
    },
    {
      id: "arbiter" as RoleType,
      title: "Arbiter Fellowship",
      subtitle: "Train and officiate FIDE Swiss events",
      badge: "Certification",
      icon: Award,
    },
    {
      id: "campus_ambassador" as RoleType,
      title: "Campus Ambassador",
      subtitle: "Represent your college or school",
      badge: "University League",
      icon: Briefcase,
    },
  ];

  return (
    <section id="join-portal" className="py-24 relative bg-[#080808] text-[#F5F1E8] border-t border-[rgba(245, 242, 235,0.04)] overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-[#C9A45C]/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] backdrop-blur-md">
            <HeartHandshake className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>National Collective Onboarding</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial tracking-wide">
            Your Move. <br />
            <span className="gold-gradient-text">Shape the Future of Indian Chess.</span>
          </h2>

          <p className="text-[#8D8D8D] text-sm sm:text-base leading-relaxed">
            Whether you want to play in weekly weekend cafe meetups, launch a sanctioned chapter in your city, or train as a FIDE arbiter, there is a place for you in Chess Community India.
          </p>
        </div>

        {/* Interactive Application Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-12 border border-[#C9A45C]/20 max-w-4xl mx-auto shadow-2xl">
          
          {/* Role Selection Tabs */}
          <div className="mb-10">
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 text-center sm:text-left">
              1. Choose How You Wish to Participate
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      sound.playPieceMove();
                      setSelectedRole(r.id);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                      isSelected
                        ? "bg-[#C9A45C]/15 border-[#C9A45C] shadow-lg shadow-[#C9A45C]/10 scale-[1.02]"
                        : "bg-[#141414] border-[rgba(245, 242, 235,0.04)] hover:border-white/20 text-[#8D8D8D]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`w-5 h-5 ${isSelected ? "text-[#C9A45C]" : "text-slate-400"}`} />
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-[#C9A45C] text-black font-bold" : "bg-white/5 text-slate-400"
                        }`}>
                          {r.badge}
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-[#8D8D8D] mt-1 leading-snug">
                        {r.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-[rgba(245, 242, 235,0.04)] text-[10px] font-bold text-[#C9A45C] flex items-center gap-1">
                      {isSelected ? "Selected" : "Select Role"} &bull;
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-t border-[rgba(245, 242, 235,0.06)] pt-6">
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 text-center sm:text-left">
                  2. Your Details &amp; Location
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Viswanathan Anand"
                      className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="viswanathan@chess.org"
                      className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp / Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Primary City / District</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C9A45C] transition-colors"
                    >
                      <option value="Jabalpur">Jabalpur (Origin Chapter)</option>
                      <option value="Bhopal">Bhopal (Lake City)</option>
                      <option value="Indore">Indore (Malwa)</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Pune">Pune</option>
                      <option value="Other">Other (Request New Chapter)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tell us briefly about your chess background or vision for your community
                  </label>
                  <textarea
                    rows={3}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. Current rating 1540 on Chess.com, played in district tournaments, or want to start weekend boards in my local cafe."
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[11px] text-[#8D8D8D] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C9A45C]" />
                  Zero membership fee &bull; 100% Volunteer &amp; Community Run
                </span>

                <button
                  type="submit"
                  className="w-full sm:w-auto gold-gradient-btn px-8 py-3.5 rounded-2xl text-[#080808] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-102 transition-transform"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Welcome to Chess Community India!</h3>
              <p className="text-xs sm:text-sm text-[#8D8D8D] max-w-md mx-auto">
                Thank you, <strong>{fullName || "Player"}</strong>. Your application for <strong>{selectedRole.replace("_", " ").toUpperCase()}</strong> in <strong>{city}</strong> has been logged in our national ledger. Our regional coordinator will reach out on WhatsApp shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                Submit Another Application
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
