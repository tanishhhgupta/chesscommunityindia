import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Tournament } from '../../types';
import { Copy, Check, ExternalLink, QrCode, Globe, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onOpenPublicPortal: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onOpenPublicPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/#tournament-${tournament.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Tournament"
      subtitle={`Share "${tournament.name}" with players, arbiters, and spectators.`}
      maxWidth="md"
    >
      <div className="space-y-5 text-slate-800">
        {/* Direct Link */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Public Tournament URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-700 select-all focus:outline-none"
            />
            <Button
              variant="navy"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* QR Code section */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center text-center">
          <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-300 shadow-inner flex items-center justify-center mb-2">
            {/* SVG QR Code Simulation */}
            <svg
              className="w-32 h-32 text-slate-900"
              viewBox="0 0 100 100"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="30" height="30" fill="currentColor" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" />
              <rect x="70" y="0" width="30" height="30" fill="currentColor" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" fill="currentColor" />
              <rect x="0" y="70" width="30" height="30" fill="currentColor" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" fill="currentColor" />
              <rect x="40" y="10" width="10" height="20" fill="currentColor" />
              <rect x="40" y="40" width="20" height="20" fill="currentColor" />
              <rect x="70" y="40" width="20" height="10" fill="currentColor" />
              <rect x="40" y="70" width="10" height="20" fill="currentColor" />
              <rect x="60" y="70" width="30" height="10" fill="currentColor" />
              <rect x="80" y="85" width="15" height="15" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-700">QR Code for Venue Display</span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Print or project this on screen for players to scan with their phones.
          </p>
        </div>

        {/* Public Portal Button */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="navy"
            onClick={() => {
              onClose();
              onOpenPublicPortal();
            }}
            icon={<ExternalLink size={14} />}
          >
            Open Spectator View
          </Button>
        </div>
      </div>
    </Modal>
  );
};
