import { useEffect } from 'react';
import MetricCards from '@/components/dashboard/MetricCards';
import TradingChart from '@/components/dashboard/TradingChart';
import OrderBook from '@/components/dashboard/OrderBook';
import EmergencyControls from '@/components/dashboard/EmergencyControls';
import FyersControlPanel from '@/components/dashboard/FyersControlPanel';
import { WebSocketClient } from '@/lib/ws';
import { useStore } from '@/store/useStore';

export default function LiveCommandCenter() {
  const setConnected = useStore((state) => state.setConnected);
  const updateTick = useStore((state) => state.updateTick);
  const setAccount = useStore((state) => state.setAccount);
  const setPositions = useStore((state) => state.setPositions);
  const addLog = useStore((state) => state.addLog);
  const addSignal = useStore((state) => state.addSignal);

  useEffect(() => {
    // Determine WS URL based on current host if proxy is used, or fallback
    const wsUrl = window.location.protocol === 'https:' ? 
      `wss://${window.location.host}/ws/live-feed` : 
      `ws://${window.location.host}/ws/live-feed`;
    
    const wsClient = new WebSocketClient(wsUrl);

    wsClient.onStatusChange(setConnected);
    
    wsClient.onMessage((msg) => {
      if (msg.tick_data) {
        updateTick(msg.tick_data);
      }
      if (msg.account_state) {
        setAccount(msg.account_state);
      }
      if (msg.active_positions) {
        setPositions(msg.active_positions);
      }
      if (msg.system_logs && msg.system_logs.length > 0) {
        msg.system_logs.forEach(addLog);
      }
      if (msg.signals && msg.signals.length > 0) {
        msg.signals.forEach(addSignal);
      }
    });

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, [setConnected, updateTick, setAccount, setPositions, addLog, addSignal]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="shrink-0">
        <MetricCards />
      </div>

      <div className="shrink-0 max-h-fit overflow-y-auto">
        <FyersControlPanel />
      </div>
      
      <div className="flex-1 flex min-h-0 gap-4">
        <div className="w-[70%] min-h-[360px] bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
          <TradingChart />
        </div>
        <div className="w-[30%] bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
          <OrderBook />
        </div>
      </div>
      
      <div className="shrink-0">
        <EmergencyControls />
      </div>
    </div>
  );
}
