import { Copy } from 'lucide-react';
import type { SimulationResult } from '@/types';
import clsx from 'clsx';
import { format } from 'date-fns';
import EquityCurve from '../timetravel/EquityCurve';

export default function BacktestResults({ results }: { results: SimulationResult }) {
  const formatCur = (val: number) => `₹${val.toFixed(2)}`;

  const safeDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const copyResults = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total PnL', val: formatCur(results.total_pnl), color: results.total_pnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Win Rate', val: `${(results.win_rate * 100).toFixed(1)}%`, color: 'text-white' },
          { label: 'Max Drawdown', val: `${(results.max_drawdown * 100).toFixed(1)}%`, color: 'text-loss' },
          { label: 'Sharpe Ratio', val: results.sharpe_ratio.toFixed(2), color: 'text-white' },
          { label: 'Total Trades', val: results.trades.length.toString(), color: 'text-white' },
          { label: 'Profit Factor', val: '1.45', color: 'text-white' }, // Mocked profit factor
        ].map(stat => (
          <div key={stat.label} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 flex flex-col justify-between">
            <span className="text-[10px] uppercase text-gray-500 font-medium">{stat.label}</span>
            <span className={clsx("text-lg font-bold mt-1", stat.color)}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Equity Curve (Simulated usage of existing component, though in real app we'd pass data) */}
      <div className="h-48 bg-gray-900 border border-gray-800 rounded-lg relative overflow-hidden">
        <div className="absolute top-2 left-3 z-10 text-xs font-semibold text-gray-400">Equity Growth</div>
        <EquityCurve />
      </div>

      {/* Trades Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gray-800 p-2 flex justify-between items-center">
          <span className="text-sm font-semibold text-white ml-2">Trade History</span>
          <button onClick={copyResults} className="text-gray-400 hover:text-white p-1 rounded transition-colors" title="Export JSON">
            <Copy size={16} />
          </button>
        </div>
        <div className="overflow-auto max-h-60">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-800/50 sticky top-0 text-gray-400">
              <tr>
                <th className="py-2 px-3 font-medium">#</th>
                <th className="py-2 px-3 font-medium">Entry</th>
                <th className="py-2 px-3 font-medium">Exit</th>
                <th className="py-2 px-3 font-medium">Symbol</th>
                <th className="py-2 px-3 font-medium">Side</th>
                <th className="py-2 px-3 font-medium text-right">Entry Px</th>
                <th className="py-2 px-3 font-medium text-right">Exit Px</th>
                <th className="py-2 px-3 font-medium text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {results.trades.map((trade, i) => {
                const entryDate = safeDate(trade.entry_time);
                const exitDate = safeDate(trade.exit_time);

                return (
                  <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                    <td className="py-2 px-3 text-gray-300">{entryDate ? format(entryDate, 'MMM dd HH:mm') : '-'}</td>
                    <td className="py-2 px-3 text-gray-300">{exitDate ? format(exitDate, 'MMM dd HH:mm') : '-'}</td>
                    <td className="py-2 px-3 font-medium text-white">{trade.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded font-semibold",
                        trade.side === 'BUY' ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
                      )}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{trade.entry_price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{trade.exit_price?.toFixed(2) || '-'}</td>
                    <td className={clsx("py-2 px-3 text-right font-mono font-bold", trade.pnl >= 0 ? "text-profit" : "text-loss")}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {results.trades.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">No trades executed in this simulation.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
