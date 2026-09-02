import ReplayPlayer from '@/components/timetravel/ReplayPlayer';
import TradingChart from '@/components/dashboard/TradingChart';
import EquityCurve from '@/components/timetravel/EquityCurve';
import DrawdownHeatmap from '@/components/timetravel/DrawdownHeatmap';

export default function TimeTravelAnalytics() {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top Controls */}
      <div className="shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <ReplayPlayer />
      </div>

      {/* Middle: Chart (Reused) */}
      <div className="flex-1 min-h-[360px] bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
        <div className="absolute top-2 right-2 bg-accent/20 text-accent px-2 py-1 rounded text-xs font-semibold z-10">
          REPLAY MODE
        </div>
        <TradingChart />
      </div>

      {/* Bottom: Analytics */}
      <div className="h-64 shrink-0 flex gap-4">
        <div className="w-[60%] bg-gray-900 border border-gray-800 rounded-xl flex flex-col p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Equity Curve</h3>
          <div className="flex-1 min-h-0 relative h-full">
            <EquityCurve />
          </div>
        </div>
        <div className="w-[40%] bg-gray-900 border border-gray-800 rounded-xl flex flex-col p-4 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Performance & Drawdown</h3>
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-auto">
            <DrawdownHeatmap />
            
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-500 uppercase">Win / Loss Ratio</div>
                <div className="text-lg font-bold text-white mt-1">2.4 <span className="text-sm text-gray-400 font-normal">W/L</span></div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                <div className="text-xs text-gray-500 uppercase">Best Trade</div>
                <div className="text-lg font-bold text-profit mt-1">+₹4,520</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
