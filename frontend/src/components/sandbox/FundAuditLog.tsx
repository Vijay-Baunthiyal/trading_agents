import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { SimulationResult } from '@/types';

type FundLog = SimulationResult['fund_audit_log'][0];

export default function FundAuditLog({ logs }: { logs: FundLog[] }) {
  const [isOpen, setIsOpen] = useState(true);

  const normalizedLogs = (logs || []).map((log) => {
    const record = log as Record<string, unknown>;
    const event = typeof record.event === 'string'
      ? record.event
      : typeof record.msg === 'string'
        ? record.msg.toUpperCase().replace(/\s+/g, '_')
        : 'UNKNOWN_EVENT';
    const amount = typeof record.amount === 'number'
      ? record.amount
      : typeof record.pnl === 'number'
        ? record.pnl
        : 0;
    const balance = typeof record.balance === 'number'
      ? record.balance
      : typeof record.total_balance === 'number'
        ? record.total_balance
        : 0;
    const timestamp = typeof record.timestamp === 'string' ? record.timestamp : new Date().toISOString();

    return {
      ...record,
      event,
      amount,
      balance,
      timestamp,
    };
  });

  if (normalizedLogs.length === 0) return null;

  const getEventBadge = (event: string) => {
    if (event.includes('ALLOCATED') || event.includes('DEDUCTED') || event.includes('OPENED')) {
      return 'bg-warning/20 text-warning';
    }
    if (event.includes('RELEASED') || event.includes('PROFIT') || event.includes('CLOSED')) {
      return 'bg-profit/20 text-profit';
    }
    if (event.includes('LOSS') || event.includes('REJECTED')) {
      return 'bg-loss/20 text-loss';
    }
    return 'bg-gray-700 text-gray-300';
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div 
        className="h-10 border-b border-gray-800 flex items-center px-4 cursor-pointer hover:bg-gray-900 transition-colors shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm flex-1">
          <FileText size={16} className="text-gray-400" />
          Fund Audit Trail
        </div>
        {isOpen ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
      </div>
      
      {isOpen && (
        <div className="flex-1 overflow-auto p-2">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 sticky top-0 bg-gray-950">
              <tr>
                <th className="py-1.5 px-3 font-medium">Timestamp</th>
                <th className="py-1.5 px-3 font-medium">Event</th>
                <th className="py-1.5 px-3 font-medium text-right">Amount (₹)</th>
                <th className="py-1.5 px-3 font-medium text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {normalizedLogs.map((log, i) => {
                const ts = new Date(log.timestamp);
                const isValidDate = !Number.isNaN(ts.getTime());
                const amount = Number(log.amount) || 0;
                const balance = Number(log.balance) || 0;

                return (
                  <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-900/50">
                    <td className="py-1.5 px-3 text-gray-400 font-mono">
                      {isValidDate ? format(ts, 'dd MMM yy HH:mm:ss') : '—'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={clsx("px-1.5 py-0.5 rounded-[4px] font-medium text-[10px]", getEventBadge(log.event))}>
                        {log.event}
                      </span>
                    </td>
                    <td className={clsx("py-1.5 px-3 text-right font-mono", amount >= 0 ? "text-profit" : "text-loss")}>
                      {amount > 0 ? '+' : ''}{amount.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-300">
                      {balance.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
