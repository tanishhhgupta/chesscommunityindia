import React, { useState } from "react";
import { 
  X, 
  MapPin, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  Download, 
  QrCode, 
  Sparkles 
} from "lucide-react";
import { EventItem } from "../../lib/storage/mockDatabase";
import { sound } from "../../lib/audio";

interface EventRegistrationModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({ event, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState("");
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [ticketId, setTicketId] = useState("");

  if (!event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playGoldenChord();
    const generated = `CCI-${event.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generated);
    setTicketGenerated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay animate-fade-in font-sans">
      <div className="relative w-full max-w-xl glass-modal rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7067] hover:text-[#1C1613] hover:bg-[#EAE2D7] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!ticketGenerated ? (
          <>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/30 text-[11px] font-sans font-bold text-[#7D5A1B] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#B88E3E]" />
                <span>{event.category}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1613] tracking-tight">
                {event.title}
              </h3>
            </div>

            {/* Event Summary Pill */}
            <div className="p-4 rounded-2xl bg-[#EDE6DC] border border-[#D9CEBF] space-y-2 text-xs text-[#5C534B]">
              <div className="flex items-center gap-2 text-[#1C1613] font-medium">
                <MapPin className="w-4 h-4 text-[#A38342] shrink-0" />
                <span>{event.venue}, {event.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A38342] shrink-0" />
                <span>{event.startsAt} &bull; {event.timeControl}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#A38342] shrink-0" />
                <span className="text-[#1C1613] font-semibold">Prize Pool: {event.prizePool}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6158] mb-1">
                  Your Full Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Praggnanandhaa R"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] placeholder:text-[#998D80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6158] mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@chess.in"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] placeholder:text-[#998D80]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#6B6158] mb-1">
                    Current Rating / FIDE ID
                  </label>
                  <input
                    type="text"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="e.g. 1650 or Unrated"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#D5C7B3] text-[#1C1613] text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] placeholder:text-[#998D80]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-[#5C534B]">
                  Entry Fee: <strong className="text-[#1C1613] font-semibold">{event.entryFee}</strong>
                </span>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-[#241711] hover:bg-[#38261E] active:scale-95 text-[#FAF7F2] font-sans font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Generate Official Tournament Pass
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1613]">
                Seat Confirmed &bull; Pass Issued!
              </h3>
              <p className="text-xs text-[#5C534B] mt-1 font-sans">
                You are registered for <strong>{event.title}</strong>
              </p>
            </div>

            {/* Simulated Digital Ticket */}
            <div className="p-6 rounded-2xl bg-[#EDE6DC] border border-[#D9CEBF] text-left space-y-3 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-[#D5C7B3] pb-3">
                <div>
                  <div className="text-[10px] font-sans font-bold tracking-wider text-[#8C6826] uppercase">
                    Official Entry Pass
                  </div>
                  <div className="text-base font-serif font-bold text-[#1C1613]">
                    {name || "Contender"}
                  </div>
                </div>
                <QrCode className="w-10 h-10 text-[#8C6826]" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#7A6E63] block text-[10px] uppercase font-bold">Pass ID</span>
                  <span className="font-mono text-[#1C1613] font-bold">{ticketId}</span>
                </div>
                <div>
                  <span className="text-[#7A6E63] block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-emerald-700 font-bold">Arbiter Verified</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playPieceMove();
                  alert(`Digital Pass #${ticketId} downloaded to device!`);
                }}
                className="flex-1 py-3 rounded-full bg-[#241711] hover:bg-[#38261E] text-[#FAF7F2] font-sans font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF Pass</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full border border-[#D5C7B3] bg-white hover:bg-[#EDE6DC] text-[#1C1613] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationModal;
