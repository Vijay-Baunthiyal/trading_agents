import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, type UTCTimestamp } from 'lightweight-charts';

export default function EquityCurve() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: chartContainerRef.current.clientHeight || 220,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937', visible: false },
        horzLines: { color: '#1f2937' },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#6366f1',
      topColor: 'rgba(99, 102, 241, 0.4)',
      bottomColor: 'rgba(99, 102, 241, 0.0)',
      lineWidth: 2,
    });

    const baseTime = Math.floor(Date.now() / 1000) - 86400;
    const data = [] as Array<{ time: UTCTimestamp; value: number }>;
    let balance = 10000;
    for (let i = 0; i < 120; i++) {
      balance += (Math.random() - 0.42) * 220;
      data.push({ time: (baseTime + i * 3600) as UTCTimestamp, value: Math.max(0, balance) });
    }

    areaSeries.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-[220px] min-h-[220px] absolute inset-0" />;
}
