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

/**
 * Returns hardcoded token data for a specific token address
 */
function getHardcodedTokenData(tokenAddress: string): DexScreenerToken | undefined {
  const hardcodedTokens: Record<string, DexScreenerToken> = {
    "0x6536cEAD649249cae42FC9bfb1F999429b3ec755": {
      address: "0x6536cEAD649249cae42FC9bfb1F999429b3ec755",
      name: "Navigator",
      symbol: "NAV",
      price_usd: "0.42",
      volume_24h: 1250000,
      price_change_24h: 5.2,
      market_cap_usd: 4200000
    },
    "0xB776608A6881FfD2152bDFE65BD04Cbe66697Dcf": {
      address: "0xB776608A6881FfD2152bDFE65BD04Cbe66697Dcf",
      name: "Bread",
      symbol: "BREAD",
      price_usd: "0.18",
      volume_24h: 980000,
      price_change_24h: 3.7,
      market_cap_usd: 1800000
    },
    "0x047b41A14F0BeF681b94f570479AE7208E577a0C": {
      address: "0x047b41A14F0BeF681b94f570479AE7208E577a0C",
      name: "Him",
      symbol: "HIM",
      price_usd: "0.65",
      volume_24h: 1450000,
      price_change_24h: 8.9,
      market_cap_usd: 6500000
    },
    "0x1F7210257FA157227D09449229a9266b0D581337": {
      address: "0x1F7210257FA157227D09449229a9266b0D581337",
      name: "Beramo",
      symbol: "BERAMO",
      price_usd: "0.31",
      volume_24h: 1120000,
      price_change_24h: -2.3,
      market_cap_usd: 3100000
    },
    "0xb749584F9fC418Cf905d54f462fdbFdC7462011b": {
      address: "0xb749584F9fC418Cf905d54f462fdbFdC7462011b",
      name: "Berachain Meme",
      symbol: "BM",
      price_usd: "0.0085",
      volume_24h: 750000,
      price_change_24h: 12.5,
      market_cap_usd: 850000
    },
    "0xb8B1Af593Dc37B33a2c87C8Db1c9051FC32858B7": {
      address: "0xb8B1Af593Dc37B33a2c87C8Db1c9051FC32858B7",
      name: "Ramen",
      symbol: "RAMEN",
      price_usd: "0.22",
      volume_24h: 920000,
      price_change_24h: 4.8,
      market_cap_usd: 2200000
    },
    "0x08A38Caa631DE329FF2DAD1656CE789F31AF3142": {
      address: "0x08A38Caa631DE329FF2DAD1656CE789F31AF3142",
      name: "Yeet",
      symbol: "YEET",
      price_usd: "0.0125",
      volume_24h: 680000,
      price_change_24h: 18.3,
      market_cap_usd: 1250000
    },
    "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98": {
      address: "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98",
      name: "Hold",
      symbol: "HOLD",
      price_usd: "0.0375",
      volume_24h: 580000,
      price_change_24h: -1.5,
      market_cap_usd: 3750000
    },
    "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5": {
      address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5",
      name: "Henlo",
      symbol: "HENLO",
      price_usd: "0.0095",
      volume_24h: 520000,
      price_change_24h: 7.2,
      market_cap_usd: 950000
    },
    "0x18878Df23e2a36f81e820e4b47b4A40576D3159C": {
      address: "0x18878Df23e2a36f81e820e4b47b4A40576D3159C",
      name: "Olympus",
      symbol: "OHM",
      price_usd: "0.85",
      volume_24h: 1350000,
      price_change_24h: -3.8,
      market_cap_usd: 8500000
    }
  };

  // Normalize the address to lowercase for case-insensitive comparison
  const normalizedAddress = tokenAddress.toLowerCase();
  
  // Find the token in our hardcoded list
  for (const [address, data] of Object.entries(hardcodedTokens)) {
    if (address.toLowerCase() === normalizedAddress) {
      return data;
    }
  }
  
  // If token not in our list, return a generic placeholder
  return {
    address: tokenAddress,
    name: "Unknown Token",
    symbol: "???",
    price_usd: "0.01",
    volume_24h: 100000,
    price_change_24h: 0,
    market_cap_usd: 1000000
  };
}

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
    const dexScreenerData = dexScreenerTokenInfo || undefined;

    // Log what data we have
    console.log("Data gathering results:", {
      hasHourlyTransferCounts: !!hourlyTransferCounts,
      hasContractABI: !!contractABI,
      hasGeckoTerminalData: !!geckoTerminalData,
      hasDexScreenerData: !!dexScreenerData,
    });

    // Use hardcoded data if both APIs failed
    if (!geckoTerminalData && !dexScreenerData) {
      console.warn("Both GeckoTerminal and DexScreener APIs failed, using hardcoded data");
      const hardcodedData = getHardcodedTokenData(tokenAddress);
      
      const growthScore = calculateGrowthScore(hourlyTransferCounts || []);
      
      return {
        chainId,
        tokenAddress,
        userWalletAddress,
        contractABI,
        dexScreenerData: hardcodedData,
        growthScore,
        hourlyTransferCounts,
      };
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
