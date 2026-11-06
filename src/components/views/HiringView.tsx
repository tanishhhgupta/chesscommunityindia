import React, { useState, useEffect } from "react";
import { sound } from "../../lib/audio";
import { contentStore, EditableJobPost, useResolvedMediaUrl } from "../../lib/storage/contentStore";
import { 
  MapPin, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  X
} from "lucide-react";

interface HiringViewProps {
  onNavigate: (view: string, param?: string) => void;
  initialJobId?: string;
}

export const HiringView: React.FC<HiringViewProps> = ({ onNavigate, initialJobId }) => {
  const [jobs, setJobs] = useState<EditableJobPost[]>(() => contentStore.getJobs());
  const hiringArchUrl = useResolvedMediaUrl("/images/redesign/hiring-king-arch.jpg", "hiring_hero");

  useEffect(() => {
    const sync = () => setJobs(contentStore.getJobs());
    window.addEventListener("cci-content-synced", sync);
    const unsub = contentStore.subscribe(sync);
    return () => {
      window.removeEventListener("cci-content-synced", sync);
      unsub();
    };
  }, []);

  const [selectedJob, setSelectedJob] = useState<EditableJobPost>(() => {
    if (initialJobId) {
      const found = jobs.find((j) => j.id === initialJobId);
      if (found) return found;
    }
    return jobs[0];
  });

  useEffect(() => {
    if (jobs.length > 0 && !jobs.some(j => j.id === selectedJob?.id)) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs]);

  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Application form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [coverNote, setCoverNote] = useState("");

  const departments = [
    "All", 
    "Tournament Operations", 
    "Community Growth", 
    "Technology & Engineering"
  ];

  const filteredJobs = jobs.filter((j) => {
    if (departmentFilter === "All") return true;
    return j.department === departmentFilter;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playGoldenChord();
    contentStore.saveFormSubmission({
      type: "work-with-us",
      name: fullName,
      email,
      phone,
      city,
      subject: `Application for ${selectedJob?.title || "Role"}`,
      details: { portfolioLink, coverNote }
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowApplyModal(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setPortfolioLink("");
      setCoverNote("");
    }, 2500);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F4EFEA] text-[#1C1613] overflow-hidden font-sans selection:bg-[#8E5830]/20 selection:text-[#1C1613]">
      
      {/* ========================================================================= */}
      {/* HERO ARCHITECTURAL BACKGROUND GRAPHIC (Right-aligned King & Classical Arch)*/}
      {/* ========================================================================= */}
      <div className="absolute top-0 right-0 w-full lg:w-[58%] h-[520px] sm:h-[620px] pointer-events-none select-none z-0 overflow-hidden">
        {/* The Classical Stone Arch & Chess King Graphic */}
        <img
          src={hiringArchUrl}
          alt="Classical Chess Arch"
          className="w-full h-full object-cover object-center opacity-85 scale-105"
        />

        {/* Seamless Radial & Linear Edge Dissolves into Warm Ivory */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4EFEA] via-[#F4EFEA]/80 sm:via-[#F4EFEA]/50 to-transparent to-55%" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4EFEA] via-[#F4EFEA]/65 to-transparent to-75%" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#F4EFEA] via-[#F4EFEA]/70 to-transparent" />
      </div>

      {/* Sweeping Golden Ribbon SVG Lines Weaving Across the Hero */}
      <div className="absolute top-10 left-0 w-full h-[550px] pointer-events-none select-none z-0 opacity-70">
        <svg className="w-full h-full" viewBox="0 0 1440 550" fill="none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hiringGoldLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECCF96" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C69E58" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8E5830" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="hiringGoldLine2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E6C075" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {/* Upper swooping bezier curve */}
          <path 
            d="M -50,140 C 200,90 480,80 820,180 C 1100,260 1280,180 1500,120" 
            stroke="url(#hiringGoldLine)" 
            strokeWidth="1.5" 
          />
          {/* Lower accent curve */}
          <path 
            d="M -30,320 C 180,240 320,380 580,360 C 900,340 1200,480 1480,420" 
            stroke="url(#hiringGoldLine2)" 
            strokeWidth="1.2" 
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER CONTENT                                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-32 sm:pt-36 pb-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-10">
        
        {/* 1. Header Hero Typography */}
        <section className="space-y-4 max-w-2xl">
          {/* Kicker with warm bronze dash */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-sans font-bold tracking-[0.24em] text-[#8C6826] uppercase">
              CAREERS &amp; FELLOWSHIPS
            </span>
            <span className="w-10 h-[1.5px] bg-[#C5A059]/70" />
          </div>

          {/* Main Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-[70px] font-bold text-[#1C1613] tracking-tight leading-[1.04]">
            Build the Future<br />
            of Indian Chess.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#5C534B] font-sans leading-relaxed pt-1">
            We are looking for community pioneers, certified FIDE arbiters, creative engineers, and organizers who want to grow grassroots chess into India’s most vibrant cultural movement.
          </p>
        </section>

        {/* 2. Department Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {departments.map((dept) => {
            const isActive = departmentFilter === dept;
            return (
              <button
                key={dept}
                onClick={() => {
                  sound.playTactileClick();
                  setDepartmentFilter(dept);
                }}
                className={`px-5 py-2 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1C1613] text-[#FAF7F2] font-semibold shadow-sm"
                    : "bg-[#EDE6DC]/75 hover:bg-[#E5DCD0] text-[#4A423B] border border-[#DDD3C5] font-medium"
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>

        {/* 3. Master-Detail Split Grid (Left Job Cards | Right Expanded Details) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start pt-4">
          
          {/* LEFT COLUMN: Job Listings Cards */}
          <div className="lg:col-span-6 space-y-4">
            {filteredJobs.map((job) => {
              const isSelected = selectedJob.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => {
                    sound.playPieceMove();
                    setSelectedJob(job);
                  }}
                  className={`group rounded-2xl p-6 sm:p-7 glass-card cursor-pointer transition-all relative ${
                    isSelected
                      ? "border-[#C5A059] bg-white/70 shadow-[0_8px_30px_rgba(197,160,89,0.22)] ring-1 ring-[#C5A059]/60"
                      : "shadow-xs"
                  }`}
                >
                  {/* Top Row: Type Pill Badge & Department Name */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded text-[10px] font-sans font-bold tracking-wider uppercase bg-[#C5A059]/20 text-[#7D5A1B]">
                      {job.type}
                    </span>
                    <span className="text-xs font-sans font-medium text-[#7A7067]">
                      {job.department}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1613] tracking-tight mb-2">
                    {job.title}
                  </h3>

                  {/* Location with Pin Icon */}
                  <div className="flex items-center gap-1.5 text-xs text-[#5E554D] font-sans mb-4">
                    <MapPin className="w-3.5 h-3.5 text-[#A38342] shrink-0" />
                    <span>{job.location}</span>
                  </div>

                  {/* Bottom Row: Compensation & Chevron Action Circle */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-serif font-semibold text-[#8F6E2A] italic">
                      {job.compensation}
                    </span>
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? "bg-[#C5A059] text-[#1C1613]" 
                        : "bg-[#E5DCD0] text-[#5A5046] group-hover:bg-[#C5A059] group-hover:text-[#1C1613]"
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Selected Job Details Card */}
          <div className="lg:col-span-6 sticky top-28">
            <div className="rounded-3xl p-8 sm:p-10 glass-panel shadow-xl space-y-7">
              
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3.5 py-1 rounded-full text-xs font-sans font-bold bg-[#B88E3E] text-[#FAF7F2] shadow-xs">
                  {selectedJob.type}
                </span>
                <span className="px-3.5 py-1 rounded-full text-xs font-sans font-medium border border-[#CDBFA9] bg-[#E5DDD1] text-[#594E44]">
                  {selectedJob.department}
                </span>
              </div>

              {/* Detail Job Title */}
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1613] tracking-tight leading-tight">
                {selectedJob.title}
              </h2>

              {/* Location & Compensation Meta Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5C534B] font-sans">
                <span className="flex items-center gap-1.5 text-[#1C1613] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#B88E3E] shrink-0" />
                  {selectedJob.location}
                </span>
                <span className="text-[#998D80]">•</span>
                <span className="font-medium text-[#7A5B1D] font-serif">
                  {selectedJob.compensation}
                </span>
              </div>

              {/* Role Overview */}
              <div className="space-y-2 pt-5 border-t border-[#D9CFC1]">
                <h4 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#84631D]">
                  Role Overview
                </h4>
                <p className="text-sm text-[#4A423A] font-sans leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              {/* Key Requirements */}
              <div className="space-y-3 pt-5 border-t border-[#D9CFC1]">
                <h4 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#84631D]">
                  Key Requirements
                </h4>
                <ul className="space-y-2.5">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4A423A] font-sans leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-[#B88E3E] mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Row */}
              <div className="pt-6 border-t border-[#D9CFC1] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#7A7067] font-sans italic">
                  Applications reviewed on a rolling basis.
                </span>

                <button
                  onClick={() => {
                    sound.playTactileClick();
                    setShowApplyModal(true);
                  }}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#241711] hover:bg-[#38261E] active:scale-95 text-[#FAF7F2] font-sans text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F2]" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE APPLICATION MODAL (Warm Luxury Ivory Theme)                    */}
      {/* ========================================================================= */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="rounded-3xl p-6 sm:p-10 max-w-lg w-full bg-[#F7F3EE] border border-[#D5C7B3] space-y-6 relative shadow-2xl">
            
            {/* Close Modal Button */}
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#7A7067] hover:text-[#1C1613] hover:bg-[#EAE2D7] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-sans font-bold text-[#8C6826] tracking-[0.2em] uppercase block">
                    APPLICATION FORM
                  </span>
                  <h3 className="text-2xl font-serif font-bold text-[#1C1613] mt-1">
                    Apply: {selectedJob.title}
                  </h3>
                  <p className="text-xs text-[#635A52] font-sans mt-0.5">
                    {selectedJob.department} &bull; {selectedJob.location}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Viswanathan Anand"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                    Current City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  >
                    <option value="Bangalore">Bangalore</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Lucknow">Lucknow</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Jabalpur">Jabalpur</option>
                    <option value="Bhopal">Bhopal</option>
                    <option value="Indore">Indore</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                    LinkedIn / Portfolio / Resume URL
                  </label>
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="text-xs font-sans font-semibold text-[#5C534B] uppercase block mb-1">
                    Why do you want to join CCI?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Share a brief note about your passion for chess and relevant background..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#241711] hover:bg-[#38261E] text-[#FAF7F2] font-sans font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Submit Application
                </button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1C1613]">
                  Application Received!
                </h3>
                <p className="text-xs text-[#5C534B] font-sans max-w-sm mx-auto leading-relaxed">
                  Thank you for applying for <strong>{selectedJob.title}</strong>. Our core coordination team will review your submission and contact you via email or WhatsApp within 3 business days.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default HiringView;
