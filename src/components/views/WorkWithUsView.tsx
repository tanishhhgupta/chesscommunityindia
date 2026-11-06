import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { contentStore, WorkWithUsContent, useResolvedMediaUrl, resolveMediaUrl } from "../../lib/storage/contentStore";
import { 
  Users, 
  Calendar, 
  Heart, 
  Share2, 
  Handshake, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown
} from "lucide-react";

interface WorkWithUsViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const WorkWithUsView: React.FC<WorkWithUsViewProps> = ({ onNavigate }) => {
  const [workContent, setWorkContent] = useState<WorkWithUsContent>(() => contentStore.getWorkWithUsContent());
  const heroArchUrl = useResolvedMediaUrl("/images/redesign/hero-arch.jpg", "homepage_hero_arch");

  useEffect(() => {
    const sync = () => setWorkContent(contentStore.getWorkWithUsContent());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const [selectedTrack, setSelectedTrack] = useState<string>("city-leadership");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Jabalpur (Origin Chapter)");
  const [pitch, setPitch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const tracks = [
    {
      id: "city-leadership",
      title: "City Community Leadership",
      icon: Users,
      badge: "CHAPTER LEADS",
      description: "Launch or lead weekly chess meetups in your city. Partner with local cafés, libraries, and college campuses to build a thriving grassroots hub.",
    },
    {
      id: "event-organization",
      title: "Event Organization",
      icon: Calendar,
      badge: "TOURNAMENT DIRECTORS",
      description: "Help orchestrate Swiss opens, collegiate clashes, and public mall chess arenas. Handle venue setup, sensory board management, and player registration.",
    },
    {
      id: "volunteering",
      title: "Volunteering & Community Support",
      icon: Heart,
      badge: "GRASSROOTS CHAMPIONS",
      description: "Introduce novice players to chess, set up boards, assist arbiters, and create a warm, inclusive environment for everyone who steps in.",
    },
    {
      id: "social-media",
      title: "Social Media & Content",
      icon: Share2,
      badge: "MEDIA CREATORS",
      description: "Capture memorable moments across the board through photography, reels, tournament highlights, player interviews, and community stories.",
    },
    {
      id: "partnerships",
      title: "Partnerships & Collaborations",
      icon: Handshake,
      badge: "STRATEGIC ALLIANCES",
      description: "Connect Chess Community India with colleges, schools, corporate houses, local associations, and brands wanting to sponsor chess initiatives.",
    },
    {
      id: "arbiter-ops",
      title: "Arbiter & Technical Operations",
      icon: ShieldCheck,
      badge: "FIDE & CLUB ARBITERS",
      description: "Join our official arbiter roster. Supervise FIDE Dutch Swiss pairings, verify scorecards, resolve disputes, and mentor apprentice arbiters.",
    },
  ];

  const activeTrackObj = tracks.find((t) => t.id === selectedTrack) || tracks[0];

  const handleTrackSelect = (id: string) => {
    sound.playPieceMove();
    setSelectedTrack(id);
    const formElement = document.getElementById("contribution-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playGoldenChord();
    contentStore.saveFormSubmission({
      type: "work-with-us",
      name: fullName,
      email,
      phone,
      city,
      subject: `Track: ${activeTrackObj.title}`,
      details: { pitch, trackId: selectedTrack }
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setPitch("");
    }, 4500);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* ========================================================================= */}
      {/* TOP-RIGHT ARCHITECTURAL BACKGROUND GRAPHIC                                */}
      {/* ========================================================================= */}
      <div className="absolute top-0 right-0 w-full lg:w-[50%] h-[460px] sm:h-[540px] pointer-events-none select-none z-0 overflow-hidden">
        <img
          src={heroArchUrl}
          alt="Classical Architecture"
          className="w-full h-full object-cover object-center opacity-85 scale-105"
        />
        {/* Gradients blending into warm ivory */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4EFEA] via-[#F4EFEA]/80 sm:via-[#F4EFEA]/45 to-transparent to-55%" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4EFEA] via-[#F4EFEA]/65 to-transparent to-75%" />
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#F4EFEA] via-[#F4EFEA]/70 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-RIGHT CHESSBOARD & PIECES GRAPHIC                                  */}
      {/* ========================================================================= */}
      <div className="absolute bottom-0 right-0 w-full sm:w-[48%] lg:w-[40%] h-[480px] pointer-events-none select-none z-0 overflow-hidden">
        <img
          src={resolveMediaUrl(workContent.heroImageUrl, 'work_hero')}
          alt="Chess Pieces and Board"
          className="w-full h-full object-cover object-left opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4EFEA] via-[#F4EFEA]/80 sm:via-[#F4EFEA]/50 to-transparent to-60%" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4EFEA] via-transparent to-transparent to-40%" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F4EFEA] to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* SWEEPING GOLD RIBBON CURVES                                               */}
      {/* ========================================================================= */}
      <div className="absolute top-0 inset-x-0 w-full h-full pointer-events-none select-none z-0 opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 1200" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wwuGoldCurve1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C69E58" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="wwuGoldCurve2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E6C075" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Upper Ribbon Swoop */}
          <path 
            d="M -40,110 C 240,60 520,70 820,160 C 1120,250 1280,170 1480,90" 
            stroke="url(#wwuGoldCurve1)" 
            strokeWidth="1.5" 
          />
          {/* Middle/Bottom Ribbon Swoop wrapping around Application section */}
          <path 
            d="M -60,780 C 180,680 440,790 740,750 C 1040,710 1260,820 1500,770" 
            stroke="url(#wwuGoldCurve2)" 
            strokeWidth="1.3" 
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT                                                              */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-12">
        
        {/* 1. Header Hero Typography */}
        <section className="space-y-4 max-w-2xl">
          {/* Kicker with warm bronze dash */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              CONTRIBUTE &amp; COLLABORATE
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          {/* Main Serif Headline */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-[70px] font-bold text-[#1C1613] tracking-tight leading-[1.04]">
            Work With <span className="font-serif italic font-normal text-[#B88E3E]">Us.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed pt-1 max-w-xl">
            Chess Community India is built by players, organizers, arbiters, and leaders across the nation. Explore opportunities to contribute your unique skills to the collective movement.
          </p>
        </section>

        {/* 2. Available Collaboration Tracks Section */}
        <section className="space-y-6 pt-2">
          {/* Track Header Bar */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1613] tracking-tight">
              Available Collaboration Tracks
            </h2>
            <button
              onClick={() => {
                sound.playTactileClick();
                const formEl = document.getElementById("contribution-form");
                if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-sans text-[#7A7067] hover:text-[#1C1613] flex items-center gap-1 transition-colors cursor-pointer group"
            >
              <span>Select a track to apply</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#B88E3E] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 6-Track Grid (3x2 on desktop, responsive) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tracks.map((track) => {
              const Icon = track.icon;
              const isSelected = selectedTrack === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackSelect(track.id)}
                  className={`group rounded-2xl p-6 sm:p-7 glass-card cursor-pointer transition-all flex flex-col justify-between relative ${
                    isSelected
                      ? "border-[#C5A059] bg-white/70 shadow-[0_8px_30px_rgba(197,160,89,0.22)] ring-1 ring-[#C5A059]/60"
                      : "shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top Row: Icon Container & Pill Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        isSelected 
                          ? "bg-[#C5A059] text-[#1C1613]" 
                          : "bg-[#E5DCD0] text-[#5A5046] group-hover:bg-[#C5A059] group-hover:text-[#1C1613]"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase bg-[#E2D8CC] text-[#7A5B1D] border border-[#D5C9B8]">
                        {track.badge}
                      </span>
                    </div>

                    {/* Track Title */}
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1613] tracking-tight mb-2 group-hover:text-[#7A5B1D] transition-colors">
                      {track.title}
                    </h3>

                    {/* Track Description */}
                    <p className="text-xs text-[#5C534B] leading-relaxed font-sans">
                      {track.description}
                    </p>
                  </div>

                  {/* Bottom Right: Circular Chevron / Arrow Action Button */}
                  <div className="flex justify-end pt-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#C5A059] text-[#1C1613] scale-105"
                        : "bg-[#E5DCD0] text-[#5A5046] group-hover:bg-[#C5A059] group-hover:text-[#1C1613] group-hover:translate-x-0.5"
                    }`}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Embedded Contribution Application Container */}
        <section 
          id="contribution-form" 
          className="rounded-3xl p-8 sm:p-12 glass-panel shadow-xl relative overflow-hidden"
        >
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Side: Headline & Mission Statement */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-sans font-bold tracking-[0.2em] text-[#8C6826] uppercase">
                  CONTRIBUTION APPLICATION
                </span>
                <span className="w-8 h-[1px] bg-[#C5A059]/70" />
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1C1613] tracking-tight leading-[1.08]">
                Apply: <span className="text-[#8C6826] font-normal italic block sm:inline">{activeTrackObj.title}</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#5C534B] font-sans leading-relaxed max-w-sm pt-1">
                Fill out your details below. Your submission connects directly with the CCI central executive panel.
              </p>
            </div>

            {/* Right Side: Interactive Contribution Form */}
            <div className="lg:col-span-7">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Row 1: Full Name & Email Address */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priyanshi Saxena"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all placeholder:text-[#998D80]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all placeholder:text-[#998D80]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone / WhatsApp & Target City Chapter */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all placeholder:text-[#998D80]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                        Target City Chapter
                      </label>
                      <div className="relative">
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-2.5 sm:py-3 pr-9 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all appearance-none cursor-pointer"
                        >
                          <option value="Jabalpur (Origin Chapter)">Jabalpur (Origin Chapter)</option>
                          <option value="Bhopal (City of Lakes)">Bhopal (City of Lakes)</option>
                          <option value="Indore (Collegiate Hub)">Indore (Collegiate Hub)</option>
                          <option value="Delhi NCR (Capital Circuit)">Delhi NCR (Capital Circuit)</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Pune">Pune</option>
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Lucknow">Lucknow</option>
                          <option value="Other New City">Other New City</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-[#7A7067] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Selected Capacity */}
                  <div>
                    <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                      Selected Capacity
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTrack}
                        onChange={(e) => {
                          sound.playTactileClick();
                          setSelectedTrack(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 sm:py-3 pr-9 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all appearance-none cursor-pointer font-medium"
                      >
                        {tracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#7A7067] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Row 4: Pitch / Tell us about your background */}
                  <div>
                    <label className="text-[10px] font-sans font-bold text-[#6B6158] uppercase tracking-wider block mb-1.5">
                      Tell us about your background &amp; how you want to contribute
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      placeholder="Mention any prior experience organizing events, your connection to chess, or ideas for growing the community..."
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#E2D8CC]/70 border border-[#D0C2B0] text-[#1C1613] text-xs focus:bg-white focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all placeholder:text-[#998D80]"
                    />
                  </div>

                  {/* Row 5: Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-full bg-[#241711] hover:bg-[#38261E] active:scale-95 text-[#FAF7F2] font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
                  >
                    <span>Submit Contribution Proposal</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F2]" />
                  </button>
                </form>
              ) : (
                <div className="text-center py-10 space-y-4 animate-fade-in bg-[#E2D8CC]/40 rounded-2xl p-8 border border-[#D0C2B0]">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#1C1613]">
                    Proposal Submitted!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C534B] font-sans max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{fullName}</strong>. Your proposal for <strong>{activeTrackObj.title}</strong> in <strong>{city}</strong> has been received. Our leadership committee will connect with you via WhatsApp and email.
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

      </div>

    </div>
  );
};

export default WorkWithUsView;
