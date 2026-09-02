import { useState } from 'react';
import { Skull, Pause, Play, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { squareOffAll } from '@/lib/api';
import clsx from 'clsx';

export default function EmergencyControls() {
  const engineState = useStore((state) => state.engineState);
  const setEngineState = useStore((state) => state.setEngineState);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSquareOff = async () => {
    setIsProcessing(true);
    try {
      await squareOffAll();
      // On success, reset UI
      setShowConfirm(false);
    } catch (err) {
      console.error('Failed to square off', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEngine = () => {
    if (engineState === 'RUNNING') {
      setEngineState('PAUSED');
      // In real app, call API to pause engine
    } else {
      setEngineState('RUNNING');
      // In real app, call API to resume
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]",
            engineState === 'RUNNING' ? "bg-profit text-profit animate-pulse" :
            engineState === 'PAUSED' ? "bg-warning text-warning" : "bg-loss text-loss"
          )} />
          <span className="font-mono text-sm uppercase font-semibold text-gray-300">
            Engine: {engineState}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleEngine}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors",
            engineState === 'RUNNING' 
              ? "bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30" 
              : "bg-profit/20 text-profit hover:bg-profit/30 border border-profit/30"
          )}
        >
          {engineState === 'RUNNING' ? <Pause size={18} /> : <Play size={18} />}
          {engineState === 'RUNNING' ? 'Pause Engine' : 'Resume Engine'}
        </button>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-loss/10 text-loss hover:bg-loss/20 border border-loss/30 transition-colors"
          >
            <Skull size={18} />
            Square Off All
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 rounded-lg p-1">
            <span className="flex items-center gap-2 px-2 text-sm text-loss font-semibold">
              <AlertTriangle size={16} /> Confirm?
            </span>
            <button
              onClick={handleSquareOff}
              disabled={isProcessing}
              className="bg-loss text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Yes, Close All'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
