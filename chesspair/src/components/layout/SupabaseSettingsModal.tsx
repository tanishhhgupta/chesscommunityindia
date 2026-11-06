import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getSupabaseConfig, saveSupabaseConfig } from '../../lib/supabase';
import { db } from '../../lib/storage';
import { Database, CheckCircle2, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all tournaments, players, and pairings to sample data?')) {
      db.resetToDefaults();
      setIsResetDone(true);
      if (onDataReset) onDataReset();
      setTimeout(() => {
        setIsResetDone(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase & Database Configuration"
      subtitle="Connect live Supabase PostgreSQL backend or manage local persistence"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Status card */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            currentConfig.isConfigured
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}
        >
          {currentConfig.isConfigured ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Database size={20} className="text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className="font-semibold text-white">
              {currentConfig.isConfigured
                ? 'Connected to Live Supabase Backend'
                : 'Local Persistent Database Active'}
            </div>
            <p className="text-slate-300">
              {currentConfig.isConfigured
                ? 'Your project is configured to synchronize tournaments and pairings directly with Supabase PostgreSQL.'
                : 'ChessPair is operating in self-contained local persistent mode. All clubs, players, rounds, and pairings are persistently saved in your browser storage and ready for instant evaluation.'}
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Supabase Project Credentials
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Project URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Anon / Public API Key</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>SQL Schema:</span>
              <span className="font-mono text-slate-400">supabase/schema.sql</span>
            </div>
            <Button variant="amber" size="sm" type="submit">
              Save Supabase Config
            </Button>
          </div>

          {isSaved && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
              <CheckCircle2 size={14} /> Credentials saved. Client re-initialized.
            </div>
          )}
        </form>

        {/* PostgreSQL Schema Info */}
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-200 flex items-center justify-between">
            <span>PostgreSQL Schema & RLS Policies</span>
            <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded">Ready to Apply</span>
          </div>
          <p>
            The project includes <code className="text-amber-400">supabase/schema.sql</code> defining organizations, members, players, tournaments, rounds, pairings, and audit logs with complete Row Level Security (RLS) policies.
          </p>
        </div>

        {/* Reset Database */}
        <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Reset Demo Data</div>
            <div className="text-[11px] text-slate-400">Restore default GM roster, sample tournaments, and rounds</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            icon={<RotateCcw size={14} />}
          >
            {isResetDone ? 'Reset Complete!' : 'Reset Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
