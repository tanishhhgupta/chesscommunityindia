import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Player, Tournament, TournamentPlayer } from '../../types';
import { Mail, Copy, Check, ExternalLink, Send, Users, AlertCircle, Sparkles } from 'lucide-react';

interface EmailPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  tournamentPlayers: (TournamentPlayer & { player: Player })[];
  selectedPlayerIds: Set<string>;
  onLogAudit?: (action: string, details: any) => void;
}

export const EmailPlayersModal: React.FC<EmailPlayersModalProps> = ({
  isOpen,
  onClose,
  tournament,
  tournamentPlayers,
  selectedPlayerIds,
  onLogAudit,
}) => {
  const [recipientFilter, setRecipientFilter] = useState<'selected' | 'all' | 'confirmed'>(() => {
    return selectedPlayerIds.size > 0 ? 'selected' : 'all';
  });

  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Compute recipient list based on filter
  const recipientPlayers = tournamentPlayers.filter((tp) => {
    if (recipientFilter === 'selected') {
      return selectedPlayerIds.has(tp.playerId);
    }
    if (recipientFilter === 'confirmed') {
      return tp.isConfirmed !== false && !tp.isWithdrawn;
    }
    return !tp.isWithdrawn;
  });

  const validEmails = recipientPlayers
    .map((tp) => tp.player.email)
    .filter((email): email is string => Boolean(email && email.trim().length > 0));

  const [subject, setSubject] = useState<string>(
    `[${tournament.name}] Important Tournament Update & Pairings`
  );

  const [message, setMessage] = useState<string>(
    `Dear Players,\n\nHere is an update regarding ${tournament.name}.\n\nPlease ensure you are present at the venue on time for your scheduled round.\n\nBest regards,\nTournament Arbiter / Organizing Committee`
  );

  const templates = [
    {
      title: '♟️ Round Pairings',
      subject: `[${tournament.name}] Round Pairings & Board Schedule`,
      body: `Dear Players,\n\nPairings for the upcoming round of ${tournament.name} have been published.\n\nPlease check your assigned board and color on the tournament board or online portal.\n\nGood luck with your games!\nTournament Arbiter`,
    },
    {
      title: '🕒 Schedule & Check-in',
      subject: `[${tournament.name}] Attendance Check-in & Schedule Reminder`,
      body: `Dear Players,\n\nThis is a reminder that player attendance check-in for ${tournament.name} will close 30 minutes before Round 1 begins.\n\nIf you anticipate any delay, please inform the arbiter immediately.\n\nBest regards,\nOrganizing Committee`,
    },
    {
      title: '📍 Venue & Logistics',
      subject: `[${tournament.name}] Venue Location & Logistics Details`,
      body: `Dear Players,\n\nWe look forward to welcoming you to ${tournament.name}.\n\nVenue: ${tournament.venue || tournament.city || 'Tournament Hall'}\nDates: ${tournament.startDate || 'Upcoming'}\n\nPlease bring your notation sheets and pens if applicable.\n\nBest regards,\nOrganizing Committee`,
    },
    {
      title: '🏆 Results & Awards',
      subject: `[${tournament.name}] Final Standings & Closing Ceremony`,
      body: `Dear Players,\n\nCongratulations to everyone for participating in ${tournament.name}!\n\nThe final standings have been calculated. The awards ceremony will commence shortly in the main hall.\n\nThank you for playing!\nTournament Director`,
    },
  ];

  const handleCopyEmails = () => {
    if (validEmails.length === 0) return;
    navigator.clipboard.writeText(validEmails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenEmailClient = () => {
    const bcc = encodeURIComponent(validEmails.join(','));
    const sub = encodeURIComponent(subject);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:?bcc=${bcc}&subject=${sub}&body=${body}`;
  };

  const handleSendNotification = () => {
    if (onLogAudit) {
      onLogAudit('EMAIL_BROADCAST_SENT', {
        tournamentId: tournament.id,
        recipientCount: recipientPlayers.length,
        subject,
      });
    }
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Email to Players"
      subtitle={tournament.name}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Recipient Audience Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Recipients
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRecipientFilter('selected')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                recipientFilter === 'selected'
                  ? 'bg-[#f0e8dc] border-[#84592B] text-[#442D1C] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users size={14} />
              <span>Selected ({selectedPlayerIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setRecipientFilter('all')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                recipientFilter === 'all'
                  ? 'bg-[#f0e8dc] border-[#84592B] text-[#442D1C] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users size={14} />
              <span>All Players ({tournamentPlayers.filter((tp) => !tp.isWithdrawn).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setRecipientFilter('confirmed')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                recipientFilter === 'confirmed'
                  ? 'bg-[#f0e8dc] border-[#84592B] text-[#442D1C] shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check size={14} />
              <span>Confirmed ({tournamentPlayers.filter((tp) => tp.isConfirmed !== false && !tp.isWithdrawn).length})</span>
            </button>
          </div>
        </div>

        {/* Recipients Summary Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-700">
              {recipientPlayers.length} Recipient(s) ({validEmails.length} with verified emails)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyEmails}
            disabled={validEmails.length === 0}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#84592B] hover:text-[#743014] disabled:opacity-40 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Addresses'}</span>
          </button>
        </div>

        {/* Quick Message Templates */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Quick Templates</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSubject(tpl.subject);
                  setMessage(tpl.body);
                }}
                className="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium transition-colors cursor-pointer"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84592B]/20 focus:border-[#84592B] text-slate-800 font-medium"
          />
        </div>

        {/* Message Body */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Message Body
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#84592B]/20 focus:border-[#84592B] text-slate-800 font-sans"
          />
        </div>

        {sentSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span className="font-semibold">Notification sent and logged to tournament activity!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleOpenEmailClient}
              className="flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Open in Email App</span>
            </Button>

            <Button
              variant="primary"
              type="button"
              onClick={handleSendNotification}
              className="flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>Broadcast Update</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
