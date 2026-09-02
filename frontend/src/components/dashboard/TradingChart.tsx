import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, type Time, type UTCTimestamp } from 'lightweight-charts';
import { useStore } from '@/store/useStore';
import { getMarketCandles } from '@/lib/api';
import clsx from 'clsx';

const timeframes = ['1m', '5m', '15m'];
const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

const toChartUnixTime = (value: string | number | Date) => {
  const parsed = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) {
    return Number.NaN;
  }
  return Math.floor(parsed.getTime() / 1000);
};

const formatIstTimeLabel = (time: number | string) => {
  const numericTime = typeof time === 'number' ? time : Number(time);
  const date = new Date(numericTime * 1000);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [tf, setTf] = useState('1m');
  const selectedSymbol = useStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useStore((state) => state.setSelectedSymbol);
  const setCandlesForSymbol = useStore((state) => state.setCandlesForSymbol);
  const currentTick = useStore((state) => state.ticks[selectedSymbol]);
  const signals = useStore((state) => state.signals);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 700,
      height: chartContainerRef.current.clientHeight || 320,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      localization: {
        timeFormatter: (time: Time) => {
          if (typeof time === 'number') {
            return formatIstTimeLabel(time);
          }
          if (typeof time === 'string') {
            const numeric = Number(time);
            if (!Number.isNaN(numeric)) {
              return formatIstTimeLabel(numeric);
            }
          }
          return String(time ?? '');
        },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: Time) => {
          if (typeof time === 'number') {
            return formatIstTimeLabel(time);
          }
          if (typeof time === 'string') {
            const numeric = Number(time);
            if (!Number.isNaN(numeric)) {
              return formatIstTimeLabel(numeric);
            }
          }
          return null;
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisDoubleClickReset: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const syncLiveData = async () => {
      const intervalMap: Record<string, string> = { '1m': '1', '5m': '5', '15m': '15' };
      const to = new Date();
      const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 3);

      try {
        const candles = await getMarketCandles(selectedSymbol, intervalMap[tf] ?? '1', from.toISOString(), to.toISOString());
        const normalizedCandles = candles
          .map((candle) => ({
            candle,
            time: toChartUnixTime(candle.timestamp),
          }))
          .filter((item) => Number.isFinite(item.time))
          .sort((left, right) => left.time - right.time)
          .filter((item, index, sorted) => index === 0 || item.time !== sorted[index - 1].time)
          .map((item) => item.candle);
        const series = normalizedCandles.map((candle) => ({
          time: toChartUnixTime(candle.timestamp) as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        setCandlesForSymbol(selectedSymbol, normalizedCandles.map((candle) => ({
          symbol: selectedSymbol,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          time: candle.timestamp,
        })));

        candleSeries.setData(series);
        volumeSeries.setData(series.map((candle) => ({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        })));
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Live Fyers candles unavailable.', error);
        candleSeries.setData([]);
        volumeSeries.setData([]);
        setCandlesForSymbol(selectedSymbol, []);
      }
    };

    syncLiveData();

    const handleResize = () => {
      if (!chartContainerRef.current) return;
      const { clientWidth, clientHeight } = chartContainerRef.current;
      chart.applyOptions({ width: clientWidth, height: clientHeight });
      chart.timeScale().fitContent();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [selectedSymbol, tf, setCandlesForSymbol]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const markers = signals
      .filter((signal) => signal.symbol === selectedSymbol && signal.action !== 'HOLD')
      .map((signal) => ({
        time: toChartUnixTime(signal.timestamp) as UTCTimestamp,
        position: signal.action === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
        color: signal.executed ? (signal.action === 'BUY' ? '#22c55e' : '#ef4444') : '#f59e0b',
        shape: signal.executed ? (signal.action === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const) : 'circle' as const,
        text: signal.executed ? `${signal.action} EXECUTED` : `${signal.action} SIGNAL`,
      }))
      .filter((marker) => Number.isFinite(marker.time))
      .sort((left, right) => left.time - right.time);

    candleSeriesRef.current.setMarkers(markers);
  }, [signals, selectedSymbol]);

  useEffect(() => {
    if (currentTick && candleSeriesRef.current && volumeSeriesRef.current) {
      const time = toChartUnixTime(currentTick.timestamp) as any;
      candleSeriesRef.current.update({
        time,
        open: currentTick.open,
        high: currentTick.high,
        low: currentTick.low,
        close: currentTick.close,
      });
      volumeSeriesRef.current.update({
        time,
        value: currentTick.volume,
        color: currentTick.close >= currentTick.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      });
    }
  }, [currentTick]);

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none focus:border-accent"
          >
            {symbols.map(sym => <option key={sym} value={sym}>{sym}</option>)}
          </select>

          <div className="flex bg-gray-800 rounded overflow-hidden border border-gray-700">
            {timeframes.map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  tf === t ? "bg-accent text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {currentTick && (
          <div className="flex items-center gap-4 text-sm font-mono">
            <span className={currentTick.close >= currentTick.open ? 'text-profit' : 'text-loss'}>
              {currentTick.close.toFixed(2)}
            </span>
            <span className="text-gray-500">Vol {currentTick.volume}</span>
          </div>
        )}
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[260px] h-[320px] relative" />
    </div>
  );
}
