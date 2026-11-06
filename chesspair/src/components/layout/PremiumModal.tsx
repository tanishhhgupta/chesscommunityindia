import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Check, Sparkles, Trophy, Zap, Shield, Globe } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ChessManager Premium"
      subtitle="Elevate your tournaments with pro arbiter features and federation broadcasting."
      maxWidth="lg"
    >
      <div className="space-y-6 text-slate-800">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-300 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xl shrink-0">
            ★
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Upgrade to Arbiter Premium</h4>
            <p className="text-xs text-slate-600">
              Run tournaments with zero player limits, official FIDE TRF reports, and custom domain links.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Plan</span>
            <div className="text-2xl font-black text-slate-900">₹0 <span className="text-xs font-normal text-slate-500">/ forever</span></div>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                Up to 20 players per tournament
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                Basic Swiss pairing engine
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                Public live standings page
              </li>
            </ul>
          </div>

          <div className="border-2 border-amber-400 rounded-xl p-4 bg-amber-50/30 relative space-y-3">
            <div className="absolute -top-3 right-4 bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
              Popular
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Organizer Pro</span>
            <div className="text-2xl font-black text-slate-900">₹999 <span className="text-xs font-normal text-slate-500">/ year</span></div>
            <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-amber-200">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <strong>Unlimited players & rounds</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Official FIDE TRF & Swiss-Manager export
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                SMS & WhatsApp pairing alerts
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                Custom club branding & certificates
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                DGT e-Board live relay integration
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            variant="gold"
            onClick={() => {
              alert('Thank you for choosing ChessManager Premium! Pro features are unlocked.');
              onClose();
            }}
            icon={<Sparkles size={16} />}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};
