import { useWallet } from '@/hooks/useWallet';
import { Wallet, LogOut } from 'lucide-react';

export default function WalletButton() {
  const { address, isConnected, balance, balanceSymbol, connect, disconnect } = useWallet();

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
          color: '#070510',
          boxShadow: '0 0 20px rgba(183,148,246,0.3)',
        }}>
        <Wallet className="w-4 h-4" />
        Conectar Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-xs font-mono" style={{ color: 'rgba(240,234,255,0.5)' }}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <div className="text-sm font-semibold" style={{ color: '#B794F6' }}>
          {parseFloat(balance).toFixed(4)} {balanceSymbol}
        </div>
      </div>
      <button
        onClick={() => disconnect()}
        className="p-2 rounded-lg transition-all hover:opacity-70"
        style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6' }}>
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
