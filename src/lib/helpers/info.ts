import { getContractABI } from "./contracts";
import { type GeckoTerminalData, getGeckoTerminalData } from "./geckoterminal";
import { calculateGrowthScore } from "./growth-score";
import { getHourlyTransferCount, type TransferCount } from "./insight";
import { getTokenInfo, type DexScreenerToken } from "../../lib/dexscreener";

export type StartingData = {
  contractABI?: string;
  geckoTerminalData?: GeckoTerminalData;
  dexScreenerData?: DexScreenerToken;
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
    const [hourlyTransferCounts, contractABI, geckoTerminalData, dexScreenerTokenInfo] =
      await Promise.all([
        getHourlyTransferCount(chainId, tokenAddress),
        getContractABI(chainId, tokenAddress),
        getGeckoTerminalData(chainId, tokenAddress),
        getTokenInfo(tokenAddress),
      ]);

    // Convert null to undefined for type compatibility
    const dexScreenerData = dexScreenerTokenInfo || undefined;

    // Validate required data - try to get data from either source
    if (!geckoTerminalData && !dexScreenerData) {
      throw new Error("Failed to fetch token data from both GeckoTerminal and DexScreener");
    }

    const growthScore = calculateGrowthScore(hourlyTransferCounts || []);
    
    return {
      chainId,
      tokenAddress,
      userWalletAddress,
      contractABI,
      geckoTerminalData,
      dexScreenerData,
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
