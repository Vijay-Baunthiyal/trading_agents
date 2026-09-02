import { useState } from 'react';
import SimulationPanel from '@/components/sandbox/SimulationPanel';
import BacktestResults from '@/components/sandbox/BacktestResults';
import FundAuditLog from '@/components/sandbox/FundAuditLog';
import { FlaskConical } from 'lucide-react';
import type { SimulationResult } from '@/types';

export default function StrategySandbox() {
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 flex min-h-0 gap-4">
        {/* Left: Config */}
        <div className="w-[40%] bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <FlaskConical className="text-accent" size={20} />
            <h2 className="font-semibold text-white">Simulation Parameters</h2>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <SimulationPanel 
              onResults={setResults} 
              onLoading={setIsLoading} 
            />
          </div>
        </div>

        {/* Right: Results */}
        <div className="w-[60%] bg-gray-900 border border-gray-800 rounded-xl flex flex-col overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
              <div className="w-10 h-10 border-4 border-gray-700 border-t-accent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400 font-medium">Running Backtest Engine...</p>
            </div>
          ) : null}
          
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold text-white">Backtest Results</h2>
          </div>
          <div className="flex-1 overflow-auto bg-gray-950 p-4">
            {results ? (
              <BacktestResults results={results} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <FlaskConical size={48} className="mb-4 opacity-20" />
                <p>Configure parameters and run simulation to see results.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Logs */}
      <div className="shrink-0 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col max-h-[30vh]">
        <FundAuditLog logs={results?.fund_audit_log || []} />
      </div>
    </div>
  );
}
