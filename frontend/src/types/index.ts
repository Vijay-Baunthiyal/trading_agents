export interface TickData {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface CandleData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string; // for lightweight-charts
}

export interface Signal {
  id: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  confidence_score: number;
  target_price?: number;
  stop_loss_price?: number;
  rationale: string;
  timestamp: string;
  price: number;
  executed: boolean;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  entry_time: string;
  exit_time?: string;
  stop_loss: number;
  take_profit: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  pnl: number;
  ai_confidence: number;
  ai_rationale: string;
  execution_latency_ms: number;
}

export interface Order {
  id: string;
  trade_id?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price: number;
  trigger_price?: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  broker_order_id?: string;
  execution_latency_ms?: number;
  filled_price?: number;
  filled_at?: string;
  created_at: string;
}

export interface AccountState {
  total_balance: number;
  allocated_margin: number;
  free_margin: number;
  unrealized_pnl: number;
  realized_pnl: number;
  leverage_factor: number;
}

export interface DashboardMetrics {
  account_balance: number;
  active_trades: number;
  executed_trades: number;
  profitable_trades: number;
  loss_trades: number;
  total_profit: number;
  total_loss: number;
}

export interface SystemLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  details?: string;
}

export interface LiveFeedMessage {
  tick_data?: TickData;
  active_positions?: Position[];
  account_state?: AccountState;
  system_logs?: SystemLog[];
  signals?: Signal[];
}

export interface SimulationConfig {
  symbol: string;
  start_date: string;
  end_date: string;
  interval: string;
  use_latest_data: boolean;
  initial_capital: number;
  leverage: number;
  confidence_threshold: number;
  sl_pct: number;
  tp_pct: number;
}

export interface SimulationResult {
  trades: Trade[];
  total_pnl: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  equity_curve: { timestamp: string; balance: number }[];
  fund_audit_log: { timestamp: string; event: string; amount: number; balance: number }[];
}

export interface TimeTravelSnapshot {
  timestamp: string;
  account_state: AccountState;
  positions: Trade[];
  trades: Trade[];
  system_logs: SystemLog[];
}

export interface Position {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  stop_loss: number;
  take_profit: number;
  trailing_sl?: number;
}
