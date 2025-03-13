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
    console.log("Starting data gathering for token:", tokenAddress);
    
    // Try to get data from both sources, but prioritize GeckoTerminal
    let hourlyTransferCounts, contractABI, geckoTerminalData, dexScreenerTokenInfo;
    
    try {
      // First try to get GeckoTerminal data (primary source)
      geckoTerminalData = await getGeckoTerminalData(chainId, tokenAddress).catch(err => {
        console.warn("Failed to get GeckoTerminal data:", err);
        return undefined;
      });
      
      // Only try DexScreener if GeckoTerminal fails (fallback)
      if (!geckoTerminalData) {
        console.log("GeckoTerminal data not available, trying DexScreener as fallback");
        dexScreenerTokenInfo = await getTokenInfo(tokenAddress).catch(err => {
          console.warn("Failed to get DexScreener data:", err);
          return null;
        });
      }
      
      // Get other data in parallel
      [hourlyTransferCounts, contractABI] = await Promise.all([
        getHourlyTransferCount(chainId, tokenAddress).catch(err => {
          console.warn("Failed to get hourly transfer counts:", err);
          return undefined;
        }),
        getContractABI(chainId, tokenAddress).catch(err => {
          console.warn("Failed to get contract ABI:", err);
          return undefined;
        }),
      ]);
    } catch (error) {
      console.error("Error gathering token data:", error);
      // Continue with whatever data we have
    }

    // Convert null to undefined for type compatibility
    let dexScreenerData = dexScreenerTokenInfo || undefined;

    // Log what data we have
    console.log("Data gathering results:", {
      hasHourlyTransferCounts: !!hourlyTransferCounts,
      hasContractABI: !!contractABI,
      hasGeckoTerminalData: !!geckoTerminalData,
      hasDexScreenerData: !!dexScreenerData,
    });

    // Create minimal token data if both APIs failed
    if (!geckoTerminalData && !dexScreenerData) {
      console.warn("Both GeckoTerminal and DexScreener APIs failed");
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
