import clsx from 'clsx';

export default function DrawdownHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  // Mock 4 weeks of data (20 trading days)
  const data = Array.from({ length: 20 }, (_, i) => {
    const val = (Math.random() - 0.3) * 1000; // random PnL
    return {
      date: `Day ${i+1}`,
      pnl: i % 7 === 0 ? 0 : val // some zero/flat days
    };
  });

  const getColor = (pnl: number) => {
    if (pnl > 500) return 'bg-profit text-profit shadow-[0_0_8px_rgba(34,197,94,0.4)]';
    if (pnl > 0) return 'bg-profit/60 border border-profit/50';
    if (pnl < -500) return 'bg-loss text-loss shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (pnl < 0) return 'bg-loss/60 border border-loss/50';
    return 'bg-gray-800 border border-gray-700';
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-1.5 mb-1.5">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {data.map((day, i) => (
          <div 
            key={i}
            title={`${day.date}: ₹${day.pnl.toFixed(2)}`}
            className={clsx(
              "w-full pt-[100%] rounded-sm relative group cursor-pointer transition-transform hover:scale-110",
              getColor(day.pnl)
            )}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
        <span>Loss</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-loss rounded-sm"></div>
          <div className="w-3 h-3 bg-loss/60 rounded-sm"></div>
          <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
          <div className="w-3 h-3 bg-profit/60 rounded-sm"></div>
          <div className="w-3 h-3 bg-profit rounded-sm"></div>
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}
