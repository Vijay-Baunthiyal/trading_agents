import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, FlaskConical, Bot } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/store/useStore';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const isConnected = useStore((state) => state.isConnected);

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={24} />, label: 'Live Dashboard' },
    { to: '/market-data', icon: <History size={24} />, label: 'Market Data' },
    { to: '/time-travel', icon: <History size={24} />, label: 'Time Travel' },
    { to: '/sandbox', icon: <FlaskConical size={24} />, label: 'Sandbox' },
  ];

  return (
    <aside 
      className={clsx(
        "bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 z-50",
        isExpanded ? "w-60" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="h-14 flex items-center justify-center border-b border-gray-800 shrink-0">
        <Bot className="text-accent" size={28} />
        {isExpanded && <span className="ml-3 font-bold text-lg text-white whitespace-nowrap">AutoBot</span>}
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              "flex items-center p-2 rounded-lg transition-colors overflow-hidden whitespace-nowrap",
              isActive 
                ? "bg-accent/10 text-accent" 
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
            title={!isExpanded ? item.label : undefined}
          >
            <div className="shrink-0 flex items-center justify-center w-8 h-8">
              {item.icon}
            </div>
            {isExpanded && <span className="ml-3 font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 flex items-center shrink-0">
        <div className={clsx(
          "w-3 h-3 rounded-full shrink-0",
          isConnected ? "bg-profit shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-loss"
        )} />
        {isExpanded && (
          <span className="ml-3 text-sm text-gray-400 whitespace-nowrap">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        )}
      </div>
    </aside>
  );
}
