import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { parsePlayerCsv, generateSampleCsv, downloadCsv, CsvParseResult } from '../../lib/csv';
import { UploadCloud, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Player } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      const result = parsePlayerCsv(text);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    const sample = generateSampleCsv();
    downloadCsv('chesspair_players_sample.csv', sample);
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validPlayers.length === 0) return;
    onImport(parseResult.validPlayers);
    onClose();
  };

  const handleReset = () => {
    setFileContent('');
    setFileName('');
    setParseResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Players (CSV)"
      subtitle="Upload club rosters, scholastic team lists, or FIDE rating lists"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Sample Download Bar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-amber-400" />
            <span>Need the expected format? Download our sample CSV header template.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            icon={<Download size={13} />}
          >
            Sample CSV
          </Button>
        </div>

        {/* Dropzone */}
        {!parseResult ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl p-8 text-center bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={24} />
            </div>
            <div className="text-sm font-semibold text-white">Click or drag CSV file to upload</div>
            <div className="text-xs text-slate-400 mt-1">
              Supports columns: <code className="text-amber-300">Name</code>, <code className="text-amber-300">Rating</code>, <code className="text-amber-300">Title</code>, <code className="text-amber-300">FIDE ID</code>, <code className="text-amber-300">Federation</code>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <div className="text-xs">
                  <span className="font-semibold text-white">{parseResult.validPlayers.length}</span> valid players found in{' '}
                  <span className="font-mono text-slate-400">{fileName}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Change File
              </Button>
            </div>

            {/* Error notifications if any */}
            {parseResult.errors.length > 0 && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs space-y-1.5 text-rose-200">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-rose-400" />
                  {parseResult.errors.length} rows could not be parsed:
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-rose-300/80">
                  {parseResult.errors.map((err, idx) => (
                    <div key={idx}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Player Name</th>
                    <th className="p-2.5">Title</th>
                    <th className="p-2.5">Rating</th>
                    <th className="p-2.5">FIDE ID</th>
                    <th className="p-2.5">Fed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parseResult.validPlayers.slice(0, 15).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 text-slate-200">
                      <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-white">{p.name}</td>
                      <td className="p-2.5 font-mono text-amber-300">{p.title !== 'None' ? p.title : '-'}</td>
                      <td className="p-2.5 font-mono">{p.rating}</td>
                      <td className="p-2.5 font-mono text-slate-400">{p.fideId || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-400">{p.federation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parseResult.validPlayers.length > 15 && (
                <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-950">
                  + {parseResult.validPlayers.length - 15} more players
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="amber"
            disabled={!parseResult || parseResult.validPlayers.length === 0}
            onClick={handleConfirmImport}
            icon={<UploadCloud size={16} />}
          >
            Import {parseResult?.validPlayers.length || 0} Players
          </Button>
        </div>
      </div>
    </Modal>
  );
};
