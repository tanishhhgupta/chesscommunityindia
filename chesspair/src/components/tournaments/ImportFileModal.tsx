import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Player, ChessTitle } from '../../types';
import {
  parsePlayerCsv,
  generateSampleCsv,
  generateSampleTrf,
  generateSampleJson,
  downloadCsv,
  downloadFile,
} from '../../lib/csv';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';

interface ImportFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlayers?: (players: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[]) => void;
  onImportTournament?: (tournamentMeta: any, players: any[]) => void;
}

const parseTrfPlayers = (content: string): Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] => {
  const lines = content.split(/\r?\n/);
  const playerLines = lines.filter((l) => l.startsWith('001 '));
  if (playerLines.length === 0) return [];
  const validTitles: ChessTitle[] = ['GM', 'IM', 'WGM', 'FM', 'WIM', 'CM', 'WCM', 'None'];

  return playerLines.map((line) => {
    const titleRaw = line.length >= 14 ? line.substring(9, 14).trim().toUpperCase() : 'NONE';
    const title: ChessTitle = validTitles.includes(titleRaw as ChessTitle) ? (titleRaw as ChessTitle) : 'None';
    const nameRaw = line.length >= 48 ? line.substring(14, 48).trim() : line.substring(14).trim();
    const ratingStr = line.length >= 53 ? line.substring(48, 53).trim() : '';
    const parsedRating = parseInt(ratingStr, 10);
    const rating = !isNaN(parsedRating) && parsedRating > 0 ? parsedRating : 1200;
    const fedRaw = line.length >= 57 ? line.substring(53, 57).trim() : 'FID';
    const fideRaw = line.length >= 69 ? line.substring(57, 69).trim() : '';

    return {
      name: nameRaw || 'Tournament Player',
      surname: nameRaw,
      rating,
      title,
      federation: fedRaw || 'FID',
      fideId: fideRaw || undefined,
      isActive: true,
    };
  });
};

const parseJsonPlayers = (content: string): Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] => {
  const parsed = JSON.parse(content);
  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.players)
    ? parsed.players
    : Array.isArray(parsed.tournamentPlayers)
    ? parsed.tournamentPlayers
    : [];

  return rawList.map((p: any) => ({
    name: p.name || p.playerName || `${p.surname || ''} ${p.firstName || ''}`.trim() || 'Imported Player',
    surname: p.surname || p.name,
    rating: Number(p.rating || p.elo || p.initialRating || 1200),
    title: (p.title as ChessTitle) || 'None',
    fideId: p.fideId ? String(p.fideId) : undefined,
    federation: p.federation || p.country || 'FID',
    club: p.club,
    email: p.email,
    phone: p.phone,
    isActive: true,
  }));
};

export const ImportFileModal: React.FC<ImportFileModalProps> = ({
  isOpen,
  onClose,
  onImportPlayers,
  onImportTournament,
}) => {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'trf' | 'pgn' | 'json'>('csv');
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'parsed' | 'success'>('idle');
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'trf') setFileType('trf');
    else if (ext === 'pgn') setFileType('pgn');
    else if (ext === 'json') setFileType('json');
    else setFileType('csv');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      setFileContent(content);
      parseContent(content, ext || 'csv');
    };
    reader.readAsText(file);
  };

  const parseContent = (content: string, ext: string) => {
    try {
      if (ext === 'csv' || ext === 'txt') {
        const { validPlayers, errors } = parsePlayerCsv(content);
        if (errors.length > 0 && validPlayers.length === 0) {
          setErrorMsg(errors[0].error);
          setStatus('idle');
          return;
        }
        setParsedCount(validPlayers.length);
        setErrorMsg('');
        setStatus('parsed');
      } else if (ext === 'trf') {
        const players = parseTrfPlayers(content);
        if (players.length === 0) {
          setErrorMsg('No valid 001 player lines found in TRF file.');
          setStatus('idle');
          return;
        }
        setParsedCount(players.length);
        setErrorMsg('');
        setStatus('parsed');
      } else if (ext === 'json') {
        const players = parseJsonPlayers(content);
        if (players.length === 0) {
          setErrorMsg('No valid players found in JSON file.');
          setStatus('idle');
          return;
        }
        setParsedCount(players.length);
        setErrorMsg('');
        setStatus('parsed');
      } else {
        const { validPlayers } = parsePlayerCsv(content);
        setParsedCount(validPlayers.length > 0 ? validPlayers.length : 1);
        setErrorMsg('');
        setStatus('parsed');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to parse file');
      setStatus('idle');
    }
  };

  const handleConfirmImport = () => {
    try {
      let playersToImport: Omit<Player, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] = [];
      if (fileType === 'csv' || fileType === 'pgn') {
        const { validPlayers, errors } = parsePlayerCsv(fileContent);
        if (validPlayers.length === 0 && errors.length > 0) {
          setErrorMsg(errors[0].error);
          return;
        }
        playersToImport = validPlayers;
      } else if (fileType === 'trf') {
        playersToImport = parseTrfPlayers(fileContent);
      } else if (fileType === 'json') {
        playersToImport = parseJsonPlayers(fileContent);
      }

      if (playersToImport.length === 0) {
        setErrorMsg('No valid players could be parsed from the file.');
        return;
      }

      if (onImportPlayers) {
        onImportPlayers(playersToImport);
      }
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFileContent('');
        setFileName('');
      }, 700);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to import file');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Tournament File"
      subtitle="Upload Swiss-Manager TRF, CSV player roster, PGN game records, or ChessManager JSON."
      maxWidth="lg"
    >
      <div className="space-y-4 text-slate-800">
        {/* Sample Templates & Format Guide */}
        <div className="bg-[#FAF7F2] border border-[#84592B]/20 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#442D1C]/10 flex items-center justify-center shrink-0 text-[#442D1C] mt-0.5">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Sample Templates & Formats
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Download a sample player file to inspect headers and structure:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadCsv('tournament_players_sample.csv', generateSampleCsv())}
                icon={<Download size={13} />}
                className="text-xs font-semibold cursor-pointer"
              >
                Sample CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile('sample_swiss_manager.trf', generateSampleTrf(), 'text/plain')}
                icon={<Download size={13} />}
                className="text-xs font-semibold cursor-pointer"
              >
                Sample TRF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile('sample_players.json', generateSampleJson(), 'application/json')}
                icon={<Download size={13} />}
                className="text-xs font-semibold cursor-pointer"
              >
                Sample JSON
              </Button>
            </div>
          </div>

          {/* Collapsible Format Guide */}
          <div className="pt-2 border-t border-[#84592B]/15">
            <button
              type="button"
              onClick={() => setShowFormatGuide(!showFormatGuide)}
              className="flex items-center justify-between w-full text-xs font-medium text-[#442D1C] hover:text-[#84592B] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle size={13} />
                {showFormatGuide ? 'Hide supported format specifications' : 'View supported format specifications & columns'}
              </span>
              {showFormatGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFormatGuide && (
              <div className="mt-2.5 pt-2 text-[11px] text-slate-600 space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    CSV Format (Comma, Semicolon, or Tab Delimited)
                  </div>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    Accepted headers: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Name</code> (or <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Surname, First Name</code>), <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Rating</code> (or ELO), <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Title</code> (GM, IM, WGM, FM, WIM, CM, WCM, None), <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">FIDE ID</code>, <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Federation</code>, <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Club</code>, <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">Email</code>.
                  </p>
                </div>

                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    TRF Format (Swiss-Manager standard export)
                  </div>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    FIDE tournament report files containing player rows starting with <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">001 </code>. Player names, titles, ratings, federations, and FIDE IDs are automatically parsed.
                  </p>
                </div>

                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                    JSON Format
                  </div>
                  <p className="mt-0.5 text-slate-600 leading-relaxed">
                    Array of player objects: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">&#91;&#123; "name": "Magnus Carlsen", "rating": 2830, "title": "GM", "fideId": "1503014", "federation": "NOR" &#125;&#93;</code>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload drop zone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-[#84592B] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-[#FAF7F2]">
          <UploadCloud size={40} className="text-[#442D1C] mb-2" />
          <span className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop file
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Supported formats: .TRF, .CSV, .PGN, .JSON
          </span>
          <input
            type="file"
            accept=".csv,.trf,.pgn,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {fileName && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#84592B]" />
              <div>
                <span className="text-xs font-semibold text-slate-900 block truncate max-w-[220px]">
                  {fileName}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">{fileType} file</span>
              </div>
            </div>

            {status === 'parsed' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} /> {parsedCount} entries found
              </span>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <FileCheck size={14} className="shrink-0" />
            <span>Import completed successfully!</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="navy"
            disabled={!fileContent || status === 'success'}
            onClick={handleConfirmImport}
          >
            Import File
          </Button>
        </div>
      </div>
    </Modal>
  );
};
