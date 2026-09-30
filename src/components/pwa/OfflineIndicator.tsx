import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white border border-slate-700 px-3.5 py-2 text-xs font-medium shadow-2xl animate-bounce">
      <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="font-semibold text-white leading-tight">Modo Offline Ativo</p>
        <p className="text-[10px] text-slate-400">Cofre e cálculos funcionando 100% no dispositivo</p>
      </div>
    </div>
  );
};
