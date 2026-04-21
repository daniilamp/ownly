import { useAccount, useBalance, useDisconnect, useConnect } from 'wagmi';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  return {
    address,
    isConnected,
    chainId,
    balance: balanceData?.formatted || '0',
    balanceSymbol: balanceData?.symbol || 'POL',
    disconnect,
    connect: handleConnect,
  };
}
