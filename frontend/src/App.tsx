import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LiveCommandCenter from '@/pages/LiveCommandCenter';
import TimeTravelAnalytics from '@/pages/TimeTravelAnalytics';
import StrategySandbox from '@/pages/StrategySandbox';
import MarketDataPage from '@/pages/MarketDataPage';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<LiveCommandCenter />} />
            <Route path="/market-data" element={<MarketDataPage />} />
            <Route path="/time-travel" element={<TimeTravelAnalytics />} />
            <Route path="/sandbox" element={<StrategySandbox />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
