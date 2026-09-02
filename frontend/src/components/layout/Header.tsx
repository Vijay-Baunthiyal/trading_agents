import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import clsx from 'clsx';

export default function Header() {
  const location = useLocation();
  const isConnected = useStore((state) => state.isConnected);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Live Command Center';
      case '/time-travel': return 'Time Travel Analytics';
      case '/sandbox': return 'Strategy Sandbox';
      default: return 'Dashboard';
    }
  };

  const getMarketStatus = () => {
    // Basic IST market logic (assuming system is in IST for simplicity or using UTC offset)
    const hours = time.getUTCHours() + 5;
    const mins = time.getUTCMinutes() + 30;
    
    const totalMins = (hours * 60) + mins; // current time in mins from 00:00 IST
    
    const preOpenStart = 9 * 60; // 9:00 AM
    const openStart = 9 * 60 + 15; // 9:15 AM
    const openEnd = 15 * 60 + 30; // 3:30 PM

    if (totalMins >= preOpenStart && totalMins < openStart) return { label: 'Pre-Open', color: 'bg-warning text-yellow-900' };
    if (totalMins >= openStart && totalMins < openEnd) return { label: 'Market Open', color: 'bg-profit text-green-900' };
    return { label: 'Market Closed', color: 'bg-gray-700 text-gray-300' };
  };

  const status = getMarketStatus();

  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className={clsx("px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider", status.color)}>
          {status.label}
        </div>
        
        <div className="font-mono text-sm text-gray-300">
          {time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400 border-l border-gray-700 pl-4">
          <span className={clsx(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-profit shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-loss"
          )}></span>
          {isConnected ? 'API Live' : 'Connecting...'}
        </div>
      </div>
    </header>
  );
}
