import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { runSimulation } from '@/lib/api';
import type { SimulationConfig, SimulationResult } from '@/types';
import { IndianRupee } from 'lucide-react';

interface Props {
  onResults: (results: SimulationResult) => void;
  onLoading: (loading: boolean) => void;
}

export default function SimulationPanel({ onResults, onLoading }: Props) {
  const [config, setConfig] = useState<SimulationConfig>({
    symbol: 'RELIANCE',
    interval: '1',
    use_latest_data: true,
    start_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: 10000,
    leverage: 1,
    confidence_threshold: 0.8,
    sl_pct: 0.5,
    tp_pct: 0.8,
  });

  const mutation = useMutation({
    mutationFn: runSimulation,
    onMutate: () => onLoading(true),
    onSuccess: (data) => {
      onResults(data);
      onLoading(false);
    },
    onError: (err) => {
      console.error(err);
      onLoading(false);
      alert('Simulation failed. Check console.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(config);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? Number(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 font-medium">Symbol</label>
        <select 
          name="symbol" 
          value={config.symbol} 
          onChange={handleChange}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
        >
          {['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'].map(sym => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 font-medium">Fyers Candle Interval</label>
        <select
          name="interval"
          value={config.interval}
          onChange={handleChange}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
        >
          {[
            ['1', '1 minute'],
            ['5', '5 minutes'],
            ['15', '15 minutes'],
            ['30', '30 minutes'],
            ['60', '1 hour'],
            ['D', 'Daily'],
          ].map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 font-medium">Start Date</label>
          <input 
            type="date" 
            name="start_date" 
            value={config.start_date}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 font-medium">End Date</label>
          <input 
            type="date" 
            name="end_date" 
            value={config.end_date}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          name="use_latest_data"
          checked={config.use_latest_data}
          onChange={(event) => setConfig((prev) => ({ ...prev, use_latest_data: event.target.checked }))}
          className="h-4 w-4 accent-accent"
        />
        <span>
          Use latest Fyers data
          <span className="block text-xs text-gray-500">Fetches the newest available candles when the test starts</span>
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 font-medium">Initial Capital</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IndianRupee size={16} className="text-gray-500" />
          </div>
          <input 
            type="number" 
            name="initial_capital" 
            value={config.initial_capital}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 w-full outline-none focus:border-accent"
            min="1000"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-gray-400 font-medium">Leverage</label>
          <span className="text-white font-mono">{config.leverage}x</span>
        </div>
        <input 
          type="range" 
          name="leverage" 
          value={config.leverage}
          onChange={handleChange}
          min="1" max="5" step="1"
          className="accent-accent cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-gray-400 font-medium">AI Confidence Threshold</label>
          <span className="text-white font-mono">{config.confidence_threshold.toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          name="confidence_threshold" 
          value={config.confidence_threshold}
          onChange={handleChange}
          min="0.5" max="1.0" step="0.05"
          className="accent-accent cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 font-medium">Stop Loss (%)</label>
          <input 
            type="number" 
            name="sl_pct" 
            value={config.sl_pct}
            onChange={handleChange}
            step="0.1" min="0.1" max="5.0"
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 font-medium">Take Profit (%)</label>
          <input 
            type="number" 
            name="tp_pct" 
            value={config.tp_pct}
            onChange={handleChange}
            step="0.1" min="0.1" max="10.0"
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:border-accent"
            required
          />
        </div>
      </div>

      <button 
        type="submit"
        disabled={mutation.isPending}
        className="mt-4 bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        Run Simulation
      </button>
    </form>
  );
}
