import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import clsx from 'clsx';

export default function ReplayPlayer() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(9 * 60 + 15); // 9:15 in minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 5 | 10 | 60>(1);

  const startMins = 9 * 60 + 15;
  const endMins = 15 * 60 + 30;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev >= endMins) {
            setIsPlaying(false);
            return endMins;
          }
          return prev + 1; // step 1 minute in simulation time
        });
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(Number(e.target.value));
  };

  const formatDisplayTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const progress = ((time - startMins) / (endMins - startMins)) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button 
              onClick={() => setTime(startMins)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <SkipBack size={16} />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 text-accent hover:text-white hover:bg-accent/80 rounded transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button 
              onClick={() => setTime(Math.min(endMins, time + 15))}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
            {[1, 5, 10, 60].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s as any)}
                className={clsx(
                  "px-2 py-1 rounded text-xs font-semibold transition-colors",
                  speed === s ? "bg-accent text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="font-mono text-xl font-bold text-white tracking-widest">
          {formatDisplayTime(time)}
        </div>
      </div>

      <div className="relative pt-2">
        <div className="absolute top-0 left-0 w-full flex justify-between text-[10px] text-gray-500 font-mono">
          <span>09:15</span>
          <span>12:00</span>
          <span>15:30</span>
        </div>
        <input 
          type="range" 
          min={startMins} 
          max={endMins} 
          value={time}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <div 
          className="absolute h-1.5 bg-accent pointer-events-none rounded-l-lg top-[22px]" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
