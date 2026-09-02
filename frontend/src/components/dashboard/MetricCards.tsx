import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getDashboardMetrics } from '@/lib/api';
import { TrendingUp, TrendingDown, IndianRupee, PieChart, Activity, ShieldAlert, WalletCards, Briefcase, ListChecks, BadgeDollarSign, CircleDollarSign } from 'lucide-react';
import type { DashboardMetrics } from '@/types';
import clsx from 'clsx';

export default function MetricCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const account = useStore((state) => state.account);
  const engineState = useStore((state) => state.engineState);
  const selectedSymbol = useStore((state) => state.selectedSymbol);
  const candles = useStore((state) => state.candles[selectedSymbol] || []);

  const latestCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const closeChange = latestCandle && firstCandle ? latestCandle.close - firstCandle.open : 0;
  const trendPct = firstCandle && firstCandle.open ? (closeChange / firstCandle.open) * 100 : 0;

  const completedTradeCount = (metrics?.profitable_trades ?? 0) + (metrics?.loss_trades ?? 0);
  const winRate = completedTradeCount > 0
    ? ((metrics?.profitable_trades ?? 0) / completedTradeCount) * 100
    : 0;

  const totalPnl = account.unrealized_pnl + account.realized_pnl;
  const isProfit = totalPnl >= 0;

  useEffect(() => {
    let mounted = true;
    const refreshMetrics = async () => {
      try {
        const nextMetrics = await getDashboardMetrics();
        if (mounted) setMetrics(nextMetrics);
      } catch {
        if (mounted) setMetrics(null);
      }
    };

    refreshMetrics();
    const timer = window.setInterval(refreshMetrics, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Fyers Balance</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics?.account_balance ?? 0)}</div>
          <WalletCards className="text-accent" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Active Trades</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{metrics?.active_trades ?? 0}</div>
          <Briefcase className="text-accent" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Executed Today</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{metrics?.executed_trades ?? 0}</div>
          <ListChecks className="text-accent" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Profitable Trades</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-profit">{metrics?.profitable_trades ?? 0}</div>
          <TrendingUp className="text-profit" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Loss Trades</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-loss">{metrics?.loss_trades ?? 0}</div>
          <TrendingDown className="text-loss" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Profit</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-profit">{formatCurrency(metrics?.total_profit ?? 0)}</div>
          <BadgeDollarSign className="text-profit" size={24} />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total Loss</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-loss">{formatCurrency(metrics?.total_loss ?? 0)}</div>
          <CircleDollarSign className="text-loss" size={24} />
        </div>
      </div>

      {/* Total PnL */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Total PnL</div>
        <div className="flex items-center justify-between">
          <div className={clsx("text-2xl font-bold", isProfit ? "text-profit" : "text-loss")}>
            {formatCurrency(totalPnl)}
          </div>
          {isProfit ? <TrendingUp className="text-profit" size={24} /> : <TrendingDown className="text-loss" size={24} />}
        </div>
      </div>

      {/* Available Funds */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Available Funds</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{formatCurrency(account.free_margin)}</div>
          <IndianRupee className="text-gray-500" size={24} />
        </div>
      </div>

      {/* Allocated Margin */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Allocated Margin</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{formatCurrency(account.allocated_margin)}</div>
          <PieChart className="text-gray-500" size={24} />
        </div>
      </div>

      {/* Win Rate */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Win Rate</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{completedTradeCount > 0 ? `${winRate.toFixed(1)}%` : '0.0%'}</div>
          <Activity className="text-accent" size={24} />
        </div>
      </div>

      {/* Risk / Reward */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Risk / Reward</div>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">{candles.length > 1 ? `1:${Math.max(0.1, Math.abs(trendPct) / 10).toFixed(1)}` : '1:0.0'}</div>
          <div className="text-xs text-gray-500 font-mono">Avg</div>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 shadow-sm flex flex-col justify-between">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Engine Status</div>
        <div className="flex items-center justify-between mt-1">
          {engineState === 'RUNNING' ? (
            <div className="px-3 py-1 bg-profit/20 text-profit rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-profit animate-pulse"></span>
              ACTIVE
            </div>
          ) : engineState === 'PAUSED' ? (
            <div className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              PAUSED
            </div>
          ) : (
            <div className="px-3 py-1 bg-loss/20 text-loss rounded-full text-sm font-semibold flex items-center gap-2">
              <ShieldAlert size={16} />
              STOPPED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
