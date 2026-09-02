import axios from 'axios';
import type { 
  AccountState, Trade, Position, 
  SimulationConfig, SimulationResult, 
  TimeTravelSnapshot, DashboardMetrics
} from '@/types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getBalance = async (): Promise<AccountState> => {
  const { data } = await api.get('/account/balance');
  return data;
};

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const { data } = await api.get('/account/dashboard-metrics');
  return data;
};

export const executeTrade = async (req: any): Promise<Trade> => {
  const { data } = await api.post('/trade/execute', req);
  return data;
};

export const squareOffAll = async (): Promise<{ status: string; closed_positions: number }> => {
  const { data } = await api.post('/trade/squareoff-all');
  return data;
};

export const getTradeHistory = async (params?: any): Promise<Trade[]> => {
  const { data } = await api.get('/trade/history', { params });
  return data;
};

export const getActivePositions = async (): Promise<Position[]> => {
  const { data } = await api.get('/trade/active');
  return data;
};

export const runSimulation = async (config: SimulationConfig): Promise<SimulationResult> => {
  const { data } = await api.post('/sandbox/run-simulation', config);
  return data;
};

export const getTimeTravelSnapshot = async (timestamp: string): Promise<TimeTravelSnapshot> => {
  const { data } = await api.get(`/time-travel/snapshot?timestamp=${encodeURIComponent(timestamp)}`);
  return data;
};

export const getEquityCurve = async (from: string, to: string): Promise<{ timestamp: string; balance: number }[]> => {
  const { data } = await api.get(`/time-travel/equity-curve?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return data;
};

export const getMarketCandles = async (
  symbol: string,
  interval: string,
  from: string,
  to: string,
): Promise<Array<{ symbol: string; open: number; high: number; low: number; close: number; volume: number; timestamp: string }>> => {
  const { data } = await api.get(`/time-travel/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return data;
};

export const getFyersLoginUrl = async (): Promise<{ auth_url: string; redirect_uri: string }> => {
  const { data } = await api.get('/account/fyers/login-url');
  return data;
};

export const completeFyersLogin = async (authCode: string): Promise<{ status: string; token_preview: string; message: string }> => {
  const { data } = await api.post('/account/fyers/complete-login', { auth_code: authCode });
  return data;
};

export const getTradeLog = async (from: string, to: string): Promise<Trade[]> => {
  const { data } = await api.get(`/time-travel/trade-log?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return data;
};
