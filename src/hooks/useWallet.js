import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  return {
    address,
    isConnected,
    chainId,
    balance: balanceData?.formatted || '0',
    balanceSymbol: balanceData?.symbol || 'POL',
    disconnect,
    connect: openConnectModal,
  };
}
