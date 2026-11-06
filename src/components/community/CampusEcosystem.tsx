import React, { useState } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Building2, 
  GraduationCap, 
  Trophy, 
  Sparkles, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { sound } from "../../lib/audio";

interface CampusPartner {
  name: string;
  location: string;
  type: "University" | "Institute of National Importance" | "Engineering College" | "School";
  logoUrl: string;
  activePlayers: number;
  tournamentsHosted: number;
  highlight: string;
}

const CAMPUSES: CampusPartner[] = [
  {
    name: "IIITDM Jabalpur",
    location: "Dumna Nature Reserve Road, Jabalpur",
    type: "Institute of National Importance",
    logoUrl: "/logos/iiitdm-jabalpur.png",
    activePlayers: 620,
    tournamentsHosted: 8,
    highlight: "Official Host for the Annual CCI Inter-Collegiate Swiss Invitational.",
  },
  {
    name: "SGSITS Indore",
    location: "Park Road, Vallabh Nagar, Indore",
    type: "Engineering College",
    logoUrl: "/logos/sgsits-indore.png",
    activePlayers: 480,
    tournamentsHosted: 6,
    highlight: "Pioneering Malwa collegiate arena blitz and inter-departmental leagues.",
  },
  {
    name: "IILM University",
    location: "Gurugram / Greater Noida Campus",
    type: "University",
    logoUrl: "/logos/iilm-university.png",
    activePlayers: 540,
    tournamentsHosted: 5,
    highlight: "Strategic academic partner for chess cognitive science and arbiter fellowships.",
  },
  {
    name: "Jabalpur Engineering College",
    location: "Gokalpur, Jabalpur",
    type: "Engineering College",
    logoUrl: "/logos/jabalpur-engineering-college.png",
    activePlayers: 710,
    tournamentsHosted: 11,
    highlight: "Home to our longest-running university chess club and student arbiter brigade.",
  },
];

export const CampusEcosystem: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<CampusPartner | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  return (
    <section id="colleges" className="py-24 relative bg-[#080808] text-[#F5F1E8] border-t border-[rgba(245, 242, 235,0.04)] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-[#C9A45C]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] backdrop-blur-md">
              <GraduationCap className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Colleges &amp; Universities Network</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial tracking-wide">
              Powering Higher Education <br />
              <span className="gold-gradient-text">Collegiate Chess Circuits.</span>
            </h2>

            <p className="text-[#8D8D8D] text-sm sm:text-base leading-relaxed">
              We partner with premier Indian institutes, engineering colleges, and universities to build official on-campus chess chapters, provide FIDE-standard tournament equipment, and fund student arbiter fellowships.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playGlassClick();
              setShowApplyModal(true);
            }}
            className="gold-gradient-btn px-6 py-3.5 rounded-2xl text-[#080808] font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-102 self-start md:self-end"
          >
            <Building2 className="w-4 h-4" />
            <span>Launch Campus Chapter</span>
          </button>
        </div>

        {/* Campuses Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {CAMPUSES.map((campus) => (
            <div
              key={campus.name}
              className="glass-card rounded-3xl p-6 border border-[rgba(245, 242, 235,0.06)] hover:border-[#C9A45C]/40 flex flex-col justify-between transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Logo & Category */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 border border-[rgba(245, 242, 235,0.06)] p-2 flex items-center justify-center overflow-hidden shadow-inner">
                    <img
                      src={resolveMediaUrl(campus.logoUrl)}
                      alt={campus.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#C9A45C] px-2.5 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/20">
                    {campus.type}
                  </span>
                </div>

                {/* Name & Location */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#E0C895] transition-colors">
                    {campus.name}
                  </h3>
                  <p className="text-xs text-[#8D8D8D] mt-0.5">{campus.location}</p>
                </div>

                {/* Highlight */}
                <p className="text-xs text-[#F5F1E8]/80 leading-relaxed border-t border-[rgba(245, 242, 235,0.04)] pt-3">
                  {campus.highlight}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                    <span className="text-[#8D8D8D] block text-[10px]">Active Players</span>
                    <span className="text-white font-bold">{campus.activePlayers}+</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-[rgba(245, 242, 235,0.04)]">
                    <span className="text-[#8D8D8D] block text-[10px]">Tournaments</span>
                    <span className="text-[#C9A45C] font-bold">{campus.tournamentsHosted} Hosted</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[rgba(245, 242, 235,0.04)]">
                <button
                  onClick={() => {
                    sound.playPieceMove();
                    setSelectedCampus(campus);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Campus Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A45C]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits for Institutions */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-[#C9A45C]/20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A45C]/15 border border-[#C9A45C]/30 flex items-center justify-center text-[#C9A45C]">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">FIDE-Standard Equipment Grants</h4>
              <p className="text-xs text-[#8D8D8D] leading-relaxed">
                CCI supplies official tournament vinyl boards, weighted pieces, and digital DGT clocks to certified college clubs free of cost.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Student Arbiter Fellowships</h4>
              <p className="text-xs text-[#8D8D8D] leading-relaxed">
                Selected collegiate students receive full scholarships for National Arbiter exam training and officiate major national Swiss Opens.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Inter-University National League</h4>
              <p className="text-xs text-[#8D8D8D] leading-relaxed">
                Campus teams compete in seasonal Swiss team leagues with cash prizes, verified CCI Elo standings, and corporate recruiting exposure.
              </p>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-fade-in">
            <div className="relative w-full max-w-lg glass-modal-dark rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#C9A45C] uppercase tracking-wider">Academic Partnership</span>
                  <h4 className="text-lg font-bold text-white">Start a CCI Campus Chapter</h4>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {!appliedSuccess ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sound.playGoldenChord();
                    setAppliedSuccess(true);
                    setTimeout(() => {
                      setAppliedSuccess(false);
                      setShowApplyModal(false);
                    }, 3000);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Institution / University Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. National Institute of Technology"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">City / State</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Pune, Maharashtra"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Your Role</label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C9A45C]">
                        <option>Student Club President</option>
                        <option>Faculty Coordinator / Sports Officer</option>
                        <option>Student Arbiter Aspirant</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Official Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="chessclub@institute.edu.in"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full gold-gradient-btn py-3 rounded-xl text-[#080808] font-black text-xs sm:text-sm mt-3 shadow-lg"
                  >
                    Submit Chapter Request &bull; Free Equipment Grant
                  </button>
                </form>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Application Received!</h4>
                  <p className="text-xs text-[#8D8D8D]">
                    Our National Campus Director will connect with your institution within 48 hours to dispatch tournament sets and approve your chapter.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
