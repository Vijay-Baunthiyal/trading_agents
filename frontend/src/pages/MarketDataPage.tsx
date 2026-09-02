import { useMemo, useState } from 'react';
import { getMarketCandles } from '@/lib/api';
import { useStore } from '@/store/useStore';

const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BAJAJFINSV', 'SBIN', 'ITC', 'MARUTI', 'WIPRO'];
const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];

type CandleRow = {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1m');
  const [rows, setRows] = useState<CandleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const setCandlesForSymbol = useStore((state) => state.setCandlesForSymbol);

  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': '1440',
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const to = new Date();
      const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 7);

      const data = await getMarketCandles(
        symbol,
        intervalMap[timeframe] || '1',
        from.toISOString(),
        to.toISOString(),
      );

      const mapped = data.map((row) => ({
        ...row,
        timestamp: row.timestamp || new Date().toISOString(),
      }));

      setCandlesForSymbol(symbol, mapped.map((row) => ({
        symbol: row.symbol || symbol,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        time: row.timestamp,
      })));

      setRows(mapped);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live market data');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const dataframePreview = useMemo(() => {
    return rows.slice(0, 12).map((row) => ({
      ...row,
      time: new Date(row.timestamp).toLocaleString(),
    }));
  }, [rows]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[140px] flex-1">
            <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-2">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-accent"
            >
              {symbols.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[120px] flex-1">
            <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-accent"
            >
              {timeframes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? 'Fetching...' : 'Fetch Live Data'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Market Data Table</h2>
            <p className="text-xs text-gray-400">Fyers dataframe preview for {symbol}</p>
          </div>
          {lastUpdated && <span className="text-xs text-gray-400">Updated: {lastUpdated}</span>}
        </div>

        {error ? (
          <div className="p-4 text-sm text-red-300">{error}</div>
        ) : dataframePreview.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No market data loaded yet. Click “Fetch Live Data”.</div>
        ) : (
          <div className="overflow-auto h-[calc(100%-64px)]">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="bg-gray-800/80 text-xs uppercase tracking-wide text-gray-300 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Open</th>
                  <th className="px-3 py-2">High</th>
                  <th className="px-3 py-2">Low</th>
                  <th className="px-3 py-2">Close</th>
                  <th className="px-3 py-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {dataframePreview.map((row) => (
                  <tr key={`${row.timestamp}-${row.close}`} className="border-t border-gray-800 hover:bg-gray-800/60">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300">{row.time}</td>
                    <td className="px-3 py-2">{row.open}</td>
                    <td className="px-3 py-2">{row.high}</td>
                    <td className="px-3 py-2">{row.low}</td>
                    <td className="px-3 py-2">{row.close}</td>
                    <td className="px-3 py-2">{row.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
