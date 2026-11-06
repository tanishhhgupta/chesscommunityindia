import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { useOrg } from '../../context/OrgContext';
import { Badge } from '../common/Badge';
import { History, Search, Filter } from 'lucide-react';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const { activeOrg } = useOrg();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="amber" size="sm">AUDIT & COMPLIANCE</Badge>
          <span className="text-xs text-slate-400">{activeOrg.name}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <History size={24} className="text-amber-400" />
          Tournament Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable logging of pairing generations, score entries, manual board swaps, and arbiter decisions.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit records by actor, action, or details..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs pb-1 sm:pb-0">
          {['ALL', 'GENERATE_PAIRINGS', 'PUBLISH_ROUND', 'ENTER_RESULT', 'MANUAL_SWAP'].map(
            (act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  actionFilter === act
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {act.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / Arbiter</th>
                <th className="p-3">Action</th>
                <th className="p-3">Audit Details & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-white whitespace-nowrap">
                    {log.actorName}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <Badge
                      variant={
                        log.action === 'GENERATE_PAIRINGS'
                          ? 'blue'
                          : log.action === 'PUBLISH_ROUND'
                          ? 'emerald'
                          : log.action === 'MANUAL_SWAP'
                          ? 'purple'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-300">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit records found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};
