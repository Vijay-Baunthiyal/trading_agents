import { create } from 'zustand';
import type { 
  AccountState, Position, Order, 
  TickData, CandleData, Signal, SystemLog 
} from '@/types';

interface AppState {
  account: AccountState;
  positions: Position[];
  orders: Order[];
  ticks: Record<string, TickData>;
  candles: Record<string, CandleData[]>;
  signals: Signal[];
  systemLogs: SystemLog[];
  engineState: 'RUNNING' | 'PAUSED' | 'STOPPED';
  isConnected: boolean;
  selectedSymbol: string;

  setAccount: (account: AccountState) => void;
  setPositions: (positions: Position[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  updateTick: (tick: TickData) => void;
  addCandle: (symbol: string, candle: CandleData) => void;
  addSignal: (signal: Signal) => void;
  addLog: (log: SystemLog) => void;
  setEngineState: (state: 'RUNNING' | 'PAUSED' | 'STOPPED') => void;
  setConnected: (connected: boolean) => void;
  setSelectedSymbol: (symbol: string) => void;
  setCandlesForSymbol: (symbol: string, candles: CandleData[]) => void;
}

export const useStore = create<AppState>((set) => ({
  account: {
    total_balance: 0,
    allocated_margin: 0,
    free_margin: 0,
    unrealized_pnl: 0,
    realized_pnl: 0,
    leverage_factor: 1,
  },
  positions: [],
  orders: [],
  ticks: {},
  candles: {},
  signals: [],
  systemLogs: [],
  engineState: 'STOPPED',
  isConnected: false,
  selectedSymbol: 'RELIANCE',

  setAccount: (account) => set({ account }),
  setPositions: (positions) => set({ positions }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (order) => set((state) => ({
    orders: state.orders.map(o => o.id === order.id ? order : o)
  })),
  updateTick: (tick) => set((state) => ({
    ticks: { ...state.ticks, [tick.symbol]: tick }
  })),
  addCandle: (symbol, candle) => set((state) => {
    const existing = state.candles[symbol] || [];
    return {
      candles: {
        ...state.candles,
        [symbol]: [...existing, candle]
      }
    };
  }),
  addSignal: (signal) => set((state) => {
    const existing = state.signals.find((item) => item.id === signal.id);
    if (existing?.executed === signal.executed) return state;
    const withoutSignal = state.signals.filter((item) => item.id !== signal.id);
    const updated = [signal, ...withoutSignal];
    return { signals: updated.slice(0, 50) };
  }),
  addLog: (log) => set((state) => {
    const updated = [log, ...state.systemLogs];
    return { systemLogs: updated.slice(0, 200) };
  }),
  setEngineState: (engineState) => set({ engineState }),
  setConnected: (isConnected) => set({ isConnected }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setCandlesForSymbol: (symbol, candles) => set((state) => ({
    candles: { ...state.candles, [symbol]: candles }
  })),
}));
