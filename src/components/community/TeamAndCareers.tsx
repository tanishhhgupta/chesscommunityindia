import React, { useState } from "react";
import { resolveMediaUrl } from "../../lib/storage/contentStore";
import { INITIAL_JOBS, INITIAL_TESTIMONIALS, JobPost } from "../../lib/storage/mockDatabase";
import { 
  Heart, 
  Briefcase, 
  Quote, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Send, 
  Crown, 
  ShieldCheck, 
  Award, 
  Sparkles 
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "../../lib/audio";

export const TeamAndCareers: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [appSubmitted, setAppSubmitted] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantNote, setApplicantNote] = useState("");

  const handleApply = (job: JobPost) => {
    sound.playGlassClick();
    setSelectedJob(job);
    setAppSubmitted(false);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playPromoteFanfare();
    setAppSubmitted(true);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#3B82F6"]
    });
  };

  return (
    <section id="about" className="py-24 relative bg-[#08161A] border-t border-[rgba(245, 242, 235,0.04)] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {/* 1. Our Story & Manifesto */}
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold">
              <Heart className="w-3.5 h-3.5 text-chess-gold" />
              <span>Our Founding Manifesto</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Community Before <br />
              <span className="gold-gradient-text">Competition.</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              In 2024, twenty chess players in Jabalpur sat down around concrete park tables. There was no prize fund, no corporate sponsor, and no entry barrier. Just boards, clocks, and an obsession with 64 squares.
            </p>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Today, Chess Community India connects over 12,000 players across four states. We believe that competitive chess should not be locked behind private academies or elite circuits. Every Indian child, student, and grandfather deserves a welcoming table, a fair tournament, and a verified rating continuum.
            </p>

            {/* Founder Note */}
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-[rgba(245, 242, 235,0.06)] flex items-center gap-4">
              <img
                src={resolveMediaUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200", "founder_tanish")}
                alt="Tanish Gupta"
                className="w-14 h-14 rounded-2xl object-cover border border-chess-gold/40 shadow-md"
              />
              <div>
                <div className="text-sm font-bold text-white">Tanish Gupta</div>
                <div className="text-xs text-chess-gold">Founder &amp; Community Director, CCI</div>
                <div className="text-[11px] text-slate-400 italic">"The next Indian World Champion is sitting at a cafe table right now."</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
              Voices From The Board
            </div>
            {INITIAL_TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="glass-card p-6 rounded-3xl border border-[rgba(245, 242, 235,0.06)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveMediaUrl(t.avatarUrl)}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.role} &bull; {t.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-chess-gold">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Careers & Open Positions */}
        <div id="careers" className="space-y-10 pt-12 border-t border-[rgba(245, 242, 235,0.04)]">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-chess-gold/30 text-xs font-semibold text-chess-gold">
              <Briefcase className="w-3.5 h-3.5 text-chess-gold" />
              <span>Join The Core Team</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Build the Future of Indian Chess.
            </h2>

            <p className="text-xs sm:text-sm text-slate-400">
              We are expanding into 10 new metro &amp; tier-2 cities. Join us as a Chapter Lead, FIDE Arbiter, or Creative Technologist.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {INITIAL_JOBS.map((job) => (
              <div
                key={job.id}
                className="glass-card rounded-3xl p-6 border border-[rgba(245, 242, 235,0.06)] hover:border-chess-gold/40 flex flex-col justify-between space-y-6 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-chess-gold border border-[rgba(245, 242, 235,0.06)]">
                      {job.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{job.location}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[rgba(245, 242, 235,0.04)]">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Key Requirements:</div>
                    {job.requirements.map((req, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-chess-gold shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleApply(job)}
                  className="w-full py-3 rounded-2xl bg-white/10 hover:bg-chess-gold hover:text-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <span>Apply for Position</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#090e17] rounded-3xl border border-chess-gold/30 shadow-2xl p-6 sm:p-8 space-y-6">
              
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!appSubmitted ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-chess-gold font-bold">
                      Team Application
                    </span>
                    <h3 className="text-2xl font-black text-white">{selectedJob.title}</h3>
                    <p className="text-xs text-slate-400">{selectedJob.location} &bull; {selectedJob.compensation}</p>
                  </div>

                  <form onSubmit={handleSubmitApplication} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="e.g. Ramesh Babu"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="ramesh@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Why are you excited to join Chess Community India? *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={applicantNote}
                        onChange={(e) => setApplicantNote(e.target.value)}
                        placeholder="Tell us about your chess journey or community organizing background..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-chess-gold resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl gold-gradient-btn text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Application</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-4 py-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-chess-gold/20 border border-chess-gold text-chess-gold mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Application Received!</h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Thank you, <strong className="text-white">{applicantName}</strong>. Our core team reviews every candidate personally within 48 hours.
                  </p>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
                  >
                    Close
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
