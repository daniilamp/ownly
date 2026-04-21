import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';

const BATCH_PROCESSOR_ADDRESS = import.meta.env.VITE_BATCH_PROCESSOR_ADDRESS || '0x65ac8030675592aeB9E93994ac35bA48282E98CA';

const BATCH_ABI = parseAbi([
  'function addCommitmentsBulk(bytes32[] calldata commitments) external',
  'function submitBatch(bytes32 merkleRoot) external returns (uint256)',
  'function getPendingCount(address issuer) external view returns (uint256)',
]);

export function useContracts() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addCommitments = async (commitments) => {
    return writeContract({
      address: BATCH_PROCESSOR_ADDRESS,
      abi: BATCH_ABI,
      functionName: 'addCommitmentsBulk',
      args: [commitments],
    });
  };

  const submitBatch = async (merkleRoot) => {
    return writeContract({
      address: BATCH_PROCESSOR_ADDRESS,
      abi: BATCH_ABI,
      functionName: 'submitBatch',
      args: [merkleRoot],
    });
  };

  return {
    addCommitments,
    submitBatch,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
