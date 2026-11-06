import React, { useState } from "react";
import { sound } from "../../lib/audio";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { HandDrawnUnderline } from "../ui/HandDrawnUnderline";

interface JoinViewProps {
  onNavigate: (view: string) => void;
}

export const JoinView: React.FC<JoinViewProps> = ({ onNavigate }) => {
  const [role, setRole] = useState("player");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Jabalpur");
  const [vision, setVision] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playGoldenChord();
    setSubmitted(true);
  };

  return (
    <div className="relative w-full z-10 pt-32 pb-24 px-6 sm:px-12 max-w-3xl mx-auto space-y-16">
      
      {/* 1. Header */}
      <section className="space-y-4 apple-scroll-reveal">
        <span className="text-xs font-sans tracking-[0.2em] text-[#C5A059] uppercase block font-semibold">
          Invitation
        </span>
        <h1 className="text-5xl sm:text-7xl font-display font-bold text-[#F5F2EB] tracking-tight leading-[1.05]">
          Your <HandDrawnUnderline className="text-[#C5A059]" delay={200}>Move.</HandDrawnUnderline>
        </h1>
        <p className="text-base sm:text-lg text-[#9CA3A8] font-normal font-sans leading-relaxed">
          Be part of the Chess Community India journey.
        </p>
      </section>

      {/* 2. Quiet, Restrained Form */}
      <section className="quiet-card rounded-3xl p-8 sm:p-12 space-y-8 apple-scroll-reveal">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Select */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#9CA3A8] tracking-wider uppercase block">
                Select Your Capacity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {[
                  { id: "player", label: "Player" },
                  { id: "chapter", label: "Start Chapter" },
                  { id: "arbiter", label: "Arbiter" },
                  { id: "volunteer", label: "Volunteer" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sound.playPieceMove();
                      setRole(item.id);
                    }}
                    className={`py-3 px-4 rounded-xl border text-center transition-all ${
                      role === item.id
                        ? "bg-[#C5A059] text-[#08161A] font-bold border-[#C5A059]"
                        : "bg-white/[0.02] text-[#9CA3A8] border-[rgba(245, 242, 235,0.04)] hover:border-white/20"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-mono text-[#9CA3A8] tracking-wider uppercase block mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Viswanathan Anand"
                  className="w-full px-4 py-3 rounded-xl glass-pill-dark text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#9CA3A8] tracking-wider uppercase block mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@chess.in"
                    className="w-full px-4 py-3 rounded-xl glass-pill-dark text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#9CA3A8] tracking-wider uppercase block mb-1.5">
                    City / Chapter
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0E2126] border border-[rgba(245, 242, 235,0.06)] text-white text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
                  >
                    <option value="Jabalpur">Jabalpur (Origin Chapter)</option>
                    <option value="Bhopal">Bhopal (Lake City)</option>
                    <option value="Indore">Indore (Malwa Circuit)</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Other">Other / Request New Chapter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#9CA3A8] tracking-wider uppercase block mb-1.5">
                  Chess background or vision for your community (Optional)
                </label>
                <textarea
                  rows={3}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Tell us about your rating or local cafe meetup plans..."
                  className="w-full px-4 py-3 rounded-xl glass-pill-dark text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#C5A059] transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#9CA3A8]/60">
                100% Free &bull; Volunteer Community
              </span>
              <button
                type="submit"
                className="accent-gold-btn px-8 py-3.5 rounded-full text-sm font-sans font-semibold text-[#08161A] shadow-lg"
              >
                Join the Community
              </button>
            </div>

          </form>
        ) : (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#C5A059] mx-auto" />
            <h3 className="text-2xl font-serif-editorial font-bold text-white">Application Received.</h3>
            <p className="text-xs text-[#9CA3A8] max-w-sm mx-auto font-light leading-relaxed">
              Thank you, <strong>{name}</strong>. Your onboarding inquiry for <strong>{city}</strong> has been logged. Our regional chapter coordinator will contact you via email/WhatsApp.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-6 py-2 rounded-full border border-[rgba(245, 242, 235,0.06)] text-xs font-mono text-white hover:bg-white/5"
            >
              Submit Another
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
