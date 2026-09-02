import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { completeFyersLogin, getFyersLoginUrl, getMarketCandles } from '@/lib/api';
import clsx from 'clsx';

const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BAJAJFINSV', 'SBIN', 'ITC', 'MARUTI', 'WIPRO'];
const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];

export default function FyersControlPanel() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1m');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [useFyers, setUseFyers] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showLoginFlow, setShowLoginFlow] = useState(false);

  const setSelectedSymbol = useStore((state) => state.setSelectedSymbol);

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sym = e.target.value;
    setSymbol(sym);
    setSelectedSymbol(sym);
  };

  const handleConnectFyers = async () => {
    setIsConnecting(true);
    setStatus('loading');
    setMessage('Opening the Fyers login page...');

    try {
      const { auth_url } = await getFyersLoginUrl();
      window.open(auth_url, '_blank', 'noopener,noreferrer');
      setShowLoginFlow(true);
      setMessage('Fyers login opened in a new tab. Paste the auth_code that appears after login and then click “Save Fyers Token”.');
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(`Could not open Fyers login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveAuthCode = async () => {
    if (!authCode.trim()) {
      setStatus('error');
      setMessage('Paste the auth_code from the Fyers redirect URL before saving.');
      return;
    }

    setStatus('loading');
    setMessage('Exchanging auth code for a Fyers access token...');

    try {
      const result = await completeFyersLogin(authCode.trim());
      setStatus('success');
      setMessage(result.message || 'Fyers token saved successfully.');
      setAuthCode('');
      setShowLoginFlow(false);
    } catch (error) {
      setStatus('error');
      setMessage(`Fyers login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFetchCandles = async () => {
    if (!useFyers) {
      setMessage('Fyers mode is disabled.');
      return;
    }

    setStatus('loading');
    setMessage('Fetching live candles from Fyers...');

    try {
      const to = new Date();
      const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 7);

      const intervalMap: Record<string, string> = {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '1d': '1440',
      };

      const candles = await getMarketCandles(
        symbol,
        intervalMap[timeframe] || '1',
        from.toISOString(),
        to.toISOString()
      );

      if (candles && candles.length > 0) {
        setStatus('success');
        setMessage('');
        setLastUpdated(new Date().toLocaleTimeString());
        console.log('Fyers candles sample:', candles.slice(0, 3));
      } else {
        setStatus('success');
        setMessage('');
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error fetching candles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Candle fetch error:', error);
    }
  };

  useEffect(() => {
    if (useFyers) {
      const timer = setTimeout(handleFetchCandles, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Market Data Source</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseFyers(!useFyers)}
            className={clsx(
              'px-3 py-1 rounded text-xs font-medium transition-colors',
              useFyers
                ? 'bg-green-900 text-green-200 hover:bg-green-800'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            {useFyers ? '🔴 Live Fyers' : '⚪ Simulated'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="min-w-[130px] flex-1">
          <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-2">Symbol</label>
          <select
            value={symbol}
            onChange={handleSymbolChange}
            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-accent"
          >
            {symbols.map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[110px] flex-1">
          <label className="block text-[10px] uppercase tracking-wide text-gray-400 mb-2">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-accent"
          >
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleConnectFyers}
          disabled={isConnecting || status === 'loading'}
          className="px-4 py-2 rounded text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60 whitespace-nowrap"
        >
          {isConnecting ? '⏳ Opening...' : '🔐 Connect to Fyers'}
        </button>

        <button
          onClick={handleFetchCandles}
          disabled={status === 'loading' || !useFyers}
          className={clsx(
            'px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap',
            status === 'loading'
              ? 'bg-blue-900 text-blue-200 cursor-wait'
              : useFyers
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          )}
        >
          {status === 'loading' ? '⏳ Fetching...' : '📊 Fetch Live Data'}
        </button>
      </div>

      {showLoginFlow && (
        <div className="space-y-3 mb-4">
          <label className="block text-xs text-gray-400">Auth code</label>
          <textarea
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            rows={3}
            placeholder="Paste the auth_code from the Fyers redirect URL here"
            className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 outline-none focus:border-accent resize-none"
          />

          <button
            onClick={handleSaveAuthCode}
            disabled={status === 'loading' || !authCode.trim()}
            className="w-full py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-500 disabled:opacity-60"
          >
            Save Fyers Token
          </button>
        </div>
      )}

      {message && (
        <div
          className={clsx(
            'p-3 rounded text-sm mb-2 border',
            status === 'success'
              ? 'bg-green-900 border-green-700 text-green-200'
              : status === 'error'
                ? 'bg-red-900 border-red-700 text-red-200'
                : status === 'loading'
                  ? 'bg-blue-900 border-blue-700 text-blue-200'
                  : 'bg-gray-700 border-gray-600 text-gray-200'
          )}
        >
          {message}
        </div>
      )}

      {lastUpdated && (
        <div className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdated}
        </div>
      )}

      {!showLoginFlow && status !== 'success' && (
        <div className="mt-3 p-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-400">
          <div className="mb-2">
            <strong className="text-gray-300">ℹ️ How it works:</strong>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Live Fyers:</strong> Fetches real market data from Fyers API (requires OAuth login)
            </li>
            <li>
              <strong>Connect:</strong> Opens the Fyers login page and accepts the pasted auth_code inside the app
            </li>
            <li>Click <code className="bg-gray-800 px-1 rounded">Fetch Live Data</code> to update the chart</li>
          </ul>
        </div>
      )}
    </div>
  );
}
