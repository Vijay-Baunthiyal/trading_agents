import { Fragment, useState } from 'react';
import { useStore } from '@/store/useStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function OrderBook() {
  const orders = useStore((state) => state.orders);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fallback mock data if empty
  const displayOrders = orders.length > 0 ? orders : [
    {
      id: 'ORD-1234',
      symbol: 'RELIANCE',
      side: 'BUY' as const,
      order_type: 'MARKET' as const,
      quantity: 50,
      price: 2450.50,
      status: 'EXECUTED' as const,
      created_at: new Date().toISOString(),
      execution_latency_ms: 45,
    }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="h-12 border-b border-gray-800 flex items-center px-4 shrink-0 font-medium text-white">
        Live Orders & Trades
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-800/50 sticky top-0 z-10 text-gray-400 text-xs">
            <tr>
              <th className="py-2 px-3 font-medium">Time</th>
              <th className="py-2 px-3 font-medium">Symbol</th>
              <th className="py-2 px-3 font-medium">Side</th>
              <th className="py-2 px-3 font-medium text-right">Qty</th>
              <th className="py-2 px-3 font-medium text-right">Price</th>
              <th className="py-2 px-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayOrders.slice(0, 50).map((order) => {
              const isExpanded = expandedRow === order.id;
              const timeStr = format(new Date(order.created_at), 'HH:mm:ss');
              
              return (
                <Fragment key={order.id}>
                  <tr 
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                    onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                  >
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {timeStr}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-medium text-white">{order.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={clsx(
                        "text-xs px-1.5 py-0.5 rounded font-semibold",
                        order.side === 'BUY' ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
                      )}>
                        {order.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{order.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">
                      ₹{order.price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={clsx(
                        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                        order.status === 'EXECUTED' ? "bg-profit/10 text-profit border border-profit/20" :
                        order.status === 'PENDING' ? "bg-warning/10 text-warning border border-warning/20" :
                        "bg-gray-800 text-gray-400 border border-gray-700"
                      )}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-800/20 border-b border-gray-800/50">
                      <td colSpan={6} className="py-3 px-4">
                        <div className="flex flex-col gap-2 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>Order ID: <span className="font-mono text-gray-300">{order.id}</span></span>
                            {order.execution_latency_ms && (
                              <span>Latency: <span className="font-mono text-white">{order.execution_latency_ms}ms</span></span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-300">AI Rationale:</span> Momentum spike detected in MACD across 5m and 15m intervals. Confidence: 87%.
                          </div>
                          <div className="h-1.5 w-full bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: '87%' }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {displayOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                  No active orders or recent trades.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
