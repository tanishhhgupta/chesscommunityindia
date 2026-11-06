import React, { useState } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Video, 
  Award, 
  Download, 
  Clock, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { sound } from "../../lib/audio";

interface CourseModule {
  id: string;
  title: string;
  category: "Beginner (0-1200)" | "Intermediate (1200-1800)" | "Masterclass (1800-2400)" | "Arbiter Certification";
  instructor: string;
  instructorTitle: string;
  ratingTier: string;
  duration: string;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  topics: string[];
  featured?: boolean;
}

const COURSES: CourseModule[] = [
  {
    id: "course-1",
    title: "Mastering FIDE Dutch Swiss & Arbiter Protocols",
    category: "Arbiter Certification",
    instructor: "Vikramaditya Rao",
    instructorTitle: "FIDE National Arbiter & CCI Chief Arbiter",
    ratingTier: "Tier 1 to 45 Arbiters",
    duration: "6 Weeks &bull; 18 Sessions",
    lessonsCount: 18,
    studentsCount: 340,
    rating: 4.9,
    featured: true,
    topics: [
      "Swiss-System pairing mathematics and strict color balancing",
      "Repeat pairings prevention & Buchholz Cut-1 algorithms",
      "Handling illegal moves, clock disputes & FIDE handbook ethics",
      "Live ChessManager digital pairings desk deployment",
    ],
  },
  {
    id: "course-2",
    title: "The Modern Dynamic Sicilian & King's Indian Repertoire",
    category: "Masterclass (1800-2400)",
    instructor: "GM Pravin Thipsay & CCI Master Faculty",
    instructorTitle: "Grandmaster & Former National Champion",
    ratingTier: "Tier 28+ (1800+ Elo)",
    duration: "8 Weeks &bull; 24 Sessions",
    lessonsCount: 24,
    studentsCount: 520,
    rating: 5.0,
    featured: true,
    topics: [
      "Combative pawn structures in Open Sicilian & Najdorf setups",
      "King's Indian space sacrifices & kingside storm techniques",
      "Prophylaxis, dynamic imbalance & piece coordination",
      "Grandmaster calculation shortcuts in sharp tactical positions",
    ],
  },
  {
    id: "course-3",
    title: "Positional Chess & Middle-Game Strategy Fundamentals",
    category: "Intermediate (1200-1800)",
    instructor: "Ananya Deshpande",
    instructorTitle: "WIM & Indore Chapter Technical Director",
    ratingTier: "Tier 15 to 27 (1200-1750 Elo)",
    duration: "4 Weeks &bull; 12 Sessions",
    lessonsCount: 12,
    studentsCount: 890,
    rating: 4.8,
    topics: [
      "Outpost establishment & exploiting backward/isolated pawns",
      "Rook endgames & Lucena/Philidor winning conversion",
      "Bishop pair domination vs. closed knight outposts",
      "Formulating clear multi-move plans in quiet positions",
    ],
  },
  {
    id: "course-4",
    title: "Grassroots Fundamentals: From Blunder to Solid 1200",
    category: "Beginner (0-1200)",
    instructor: "Tanish Gupta & Core Coaches",
    instructorTitle: "Founder & Grassroots Program Director",
    ratingTier: "Tier 1 to 14 (0-1150 Elo)",
    duration: "3 Weeks &bull; 9 Sessions",
    lessonsCount: 9,
    studentsCount: 1450,
    rating: 4.9,
    topics: [
      "Tactical vision: forks, pins, skewers, and discovered checks",
      "Opening principles: center control, king safety, rapid development",
      "Basic checkmate patterns: Queen+Rook, Two Rooks, King+Pawn",
      "Time management & blunder-checking routine before moving",
    ],
  },
];

export const ChessLearning: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [enrolledCourse, setEnrolledCourse] = useState<CourseModule | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredCourses = selectedCategory === "All" 
    ? COURSES 
    : COURSES.filter((c) => c.category.includes(selectedCategory));

  const handleDownloadSyllabus = (course: CourseModule) => {
    sound.playGoldenChord();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <section id="learn" className="py-24 relative bg-[#080808] text-[#F5F1E8] border-t border-[rgba(245, 242, 235,0.04)] overflow-hidden">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] bg-[#C9A45C]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#C9A45C]/30 text-xs font-semibold text-[#E0C895] backdrop-blur-md">
              <GraduationCap className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>CCI National Academy</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif-editorial tracking-wide">
              Structured Chess Pedagogy &amp; <br />
              <span className="gold-gradient-text">Arbiter Certifications.</span>
            </h2>

            <p className="text-[#8D8D8D] text-sm sm:text-base leading-relaxed">
              Designed by Grandmasters and National Arbiters. Whether you are transitioning from 800 to 1400 Elo or qualifying to officiate FIDE Dutch Swiss tournaments, our curriculum provides rigorous, structured mastery.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-[#121212] border border-[rgba(245, 242, 235,0.06)] text-center">
              <div className="text-2xl font-black text-white font-mono">3,200+</div>
              <div className="text-[11px] text-[#8D8D8D] font-medium">Academy Graduates</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#121212] border border-[rgba(245, 242, 235,0.06)] text-center">
              <div className="text-2xl font-black text-[#C9A45C] font-mono">100%</div>
              <div className="text-[11px] text-[#8D8D8D] font-medium">FIDE Swiss Aligned</div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-[rgba(245, 242, 235,0.06)]">
          {["All", "Beginner", "Intermediate", "Masterclass", "Arbiter"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playTactileClick();
                setSelectedCategory(cat);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#C9A45C] text-[#080808] shadow-md shadow-[#C9A45C]/20"
                  : "bg-[#181818] text-[#8D8D8D] hover:text-[#F5F1E8] hover:bg-[#222222] border border-[rgba(245, 242, 235,0.04)]"
              }`}
            >
              {cat === "All" ? "All Programs" : `${cat} Series`}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`glass-card rounded-3xl p-6 sm:p-8 border flex flex-col justify-between transition-all duration-300 ${
                course.featured
                  ? "border-[#C9A45C]/40 bg-[#141414]/90 shadow-xl shadow-[#C9A45C]/5"
                  : "border-[rgba(245, 242, 235,0.06)] bg-[#121212]/80"
              }`}
            >
              <div className="space-y-4">
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C9A45C] px-3 py-1 rounded-full bg-[#C9A45C]/10 border border-[#C9A45C]/20">
                    {course.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#E0C895] font-bold">
                    <span>★ {course.rating.toFixed(1)}</span>
                    <span className="text-[#8D8D8D] font-normal">({course.studentsCount} enrolled)</span>
                  </div>
                </div>

                {/* Title & Instructor */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {course.title}
                  </h3>
                  <div className="mt-2 text-xs text-[#8D8D8D] flex items-center gap-2">
                    <span className="font-semibold text-white">{course.instructor}</span>
                    <span>&bull;</span>
                    <span className="text-[#C9A45C]">{course.instructorTitle}</span>
                  </div>
                </div>

                {/* Course Metadata */}
                <div className="flex flex-wrap items-center gap-4 py-2 border-y border-[rgba(245, 242, 235,0.04)] text-xs text-[#8D8D8D]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#E0C895]" />
                    {course.lessonsCount} Master Modules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Certificate
                  </span>
                </div>

                {/* Topics Covered */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Curriculum Pillars:
                  </div>
                  <ul className="space-y-1.5">
                    {course.topics.map((topic, idx) => (
                      <li key={idx} className="text-xs text-[#F5F1E8]/90 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A45C] shrink-0 mt-0.5" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-[rgba(245, 242, 235,0.06)] flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    sound.playPieceMove();
                    setEnrolledCourse(course);
                  }}
                  className="w-full sm:flex-1 gold-gradient-btn py-3 rounded-xl text-[#080808] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-102"
                >
                  <BookOpen className="w-4 h-4" />
                  Enroll in Cohort
                </button>

                <button
                  onClick={() => handleDownloadSyllabus(course)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#F5F1E8] text-xs font-bold border border-[rgba(245, 242, 235,0.06)] flex items-center justify-center gap-1.5 transition-colors"
                  title="Download Curriculum PDF"
                >
                  <Download className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>Syllabus</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Download confirmation toast */}
        {downloadSuccess && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#121212] border border-[#C9A45C] text-[#E0C895] shadow-2xl flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">Curriculum brochure downloaded successfully!</span>
          </div>
        )}

        {/* Enrollment Modal */}
        {enrolledCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#121212] rounded-3xl border border-[#C9A45C]/40 p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[rgba(245, 242, 235,0.06)] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#C9A45C] uppercase tracking-wider">Cohort Registration</span>
                  <h4 className="text-lg font-bold text-white">{enrolledCourse.title}</h4>
                </div>
                <button
                  onClick={() => setEnrolledCourse(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-[rgba(245, 242, 235,0.04)] text-xs text-[#8D8D8D] space-y-2">
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <strong className="text-white">{enrolledCourse.instructor}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Target Rank:</span>
                  <strong className="text-[#C9A45C]">{enrolledCourse.ratingTier}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tuition / Fee:</span>
                  <strong className="text-emerald-400">Subsidized &bull; ₹0 Community Seat</strong>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sound.playGoldenChord();
                  alert(`Thank you! You have been registered for "${enrolledCourse.title}". Our education coordinator will send the classroom link to your email.`);
                  setEnrolledCourse(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Grandmaster aspirant"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="player@cci.org"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Rating / FIDE / Chess.com</label>
                  <input
                    type="text"
                    placeholder="e.g. 1420 Chess.com or Unrated"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-[rgba(245, 242, 235,0.06)] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#C9A45C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full gold-gradient-btn py-3 rounded-xl text-[#080808] font-black text-xs sm:text-sm mt-3 shadow-lg"
                >
                  Confirm Free Cohort Seat
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
