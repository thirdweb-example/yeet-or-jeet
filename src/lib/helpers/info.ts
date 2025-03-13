import { getContractABI } from "./contracts";
import { type GeckoTerminalData, getGeckoTerminalData } from "./geckoterminal";
import { calculateGrowthScore } from "./growth-score";
import { getHourlyTransferCount, type TransferCount } from "./insight";

export type StartingData = {
  contractABI?: string;
  geckoTerminalData?: GeckoTerminalData;
  growthScore?: number;
  hourlyTransferCounts?: TransferCount[];
  chainId: number;
  tokenAddress: string;
  userWalletAddress: string;
};

export const gatherStartingData = async (
  chainId: number,
  tokenAddress: string,
  userWalletAddress: string,
): Promise<StartingData | undefined> => {
  try {
    const [hourlyTransferCounts, contractABI, geckoTerminalData] =
      await Promise.all([
        getHourlyTransferCount(chainId, tokenAddress),
        getContractABI(chainId, tokenAddress),
        getGeckoTerminalData(chainId, tokenAddress),
      ]);

    // Validate required data
    if (!geckoTerminalData) {
      throw new Error("Failed to fetch token data from GeckoTerminal");
    }

    const growthScore = calculateGrowthScore(hourlyTransferCounts || []);
    
    return {
      chainId,
      tokenAddress,
      userWalletAddress,
      contractABI,
      geckoTerminalData,
      growthScore,
      hourlyTransferCounts,
    };
  } catch (error) {
    console.error("Error in gatherStartingData:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to gather token data: ${error.message}`);
    }
    throw new Error("Failed to gather token data: Unknown error");
  }
};
