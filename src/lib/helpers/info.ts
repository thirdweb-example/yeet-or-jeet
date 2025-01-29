import { getContractABI } from './contracts';
import { type GeckoTerminalData, getGeckoTerminalData } from './geckoterminal';
import { calculateGrowthScore } from './growth-score';
import { getHourlyTransferCount, type TransferCount } from './insight';

export type StartingData = {
  contractABI?: string;
  geckoTerminalData?: GeckoTerminalData;
  growthScore?: number;
  hourlyTransferCounts?: TransferCount[];
  chainId: number;
  tokenAddress: string;
  userWalletAddress: string;
};

export const gatherStartingData = async (chainId: number, tokenAddress: string, userWalletAddress: string): Promise<StartingData | undefined> => {
  try {
    const [hourlyTransferCounts, contractABI, geckoTerminalData] = await Promise.all([
      getHourlyTransferCount(chainId, tokenAddress),
      getContractABI(chainId, tokenAddress),
      getGeckoTerminalData(chainId, tokenAddress)
    ]);
    const growthScore = calculateGrowthScore(hourlyTransferCounts);
    return { chainId, tokenAddress, userWalletAddress, contractABI, geckoTerminalData, growthScore, hourlyTransferCounts };
  } catch (error) {
    console.error('Error in getTokenInfo:', error);
    return undefined;
  }
};
