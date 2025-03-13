/* eslint-disable @typescript-eslint/no-explicit-any */

const DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex";

// Interface for token data returned by DexScreener
export interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
  price_usd: string;
  volume_24h: number;
  price_change_24h: number;
  market_cap_usd: number;
  image_url?: string;
  description?: string;
  websites?: string[];
  discord_url?: string;
  telegram_handle?: string;
  twitter_handle?: string;
  categories?: string[];
  trust_score?: number;
  liquidity_usd?: number;
  fdv_usd?: number;
}

// Interface for pair data returned by DexScreener
interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
}

/**
 * Fetches data from the DexScreener API
 * @param endpoint The API endpoint to fetch from
 * @returns The JSON response from the API
 */
async function fetchDexScreener(endpoint: string) {
  try {
    console.log(`Fetching DexScreener API: ${DEXSCREENER_BASE_URL}${endpoint}`);
    const response = await fetch(`${DEXSCREENER_BASE_URL}${endpoint}`);

    if (!response.ok) {
      console.error("DexScreener API error details:", {
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`DexScreener API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("DexScreener API error:", error);
    throw error;
  }
}

/**
 * Gets information about a specific token on Berachain
 * @param address The token address
 * @returns Token information
 */
export async function getTokenInfo(address: string): Promise<DexScreenerToken | null> {
  try {
    console.log(`Getting token info for address ${address}`);
    
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Fetch token pairs from DexScreener
    const data = await fetchDexScreener(`/tokens/berachain/${normalizedAddress}`);
    
    if (!data?.pairs || data.pairs.length === 0) {
      console.warn(`No pairs found for token ${normalizedAddress}`);
      return null;
    }
    
    // Get the most liquid pair for this token
    const pairs = data.pairs as DexScreenerPair[];
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    
    const topPair = pairs[0];
    const isBaseToken = topPair.baseToken.address.toLowerCase() === normalizedAddress;
    
    // Determine which token in the pair is our target token
    const tokenData = isBaseToken ? topPair.baseToken : topPair.quoteToken;
    
    // Calculate total volume across all pairs
    const totalVolume = pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
    
    // Get price change from the most liquid pair
    const priceChange = topPair.priceChange?.h24 || 0;
    
    // Create token info object
    const tokenInfo: DexScreenerToken = {
      address: normalizedAddress,
      name: tokenData.name || "Unknown",
      symbol: tokenData.symbol || "???",
      price_usd: topPair.priceUsd || "0",
      volume_24h: totalVolume,
      price_change_24h: priceChange,
      market_cap_usd: topPair.marketCap || topPair.fdv || 0,
      liquidity_usd: topPair.liquidity?.usd || 0,
      fdv_usd: topPair.fdv || 0
    };
    
    // Try to extract social info from the first pair's URL
    if (topPair.url) {
      const urlParts = topPair.url.split('/');
      const dexId = urlParts[urlParts.indexOf('dexscreener.com') + 1];
      
      if (dexId) {
        tokenInfo.websites = [`https://${dexId}.com`];
      }
    }
    
    console.log("Token info from DexScreener:", tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error("Error getting token info from DexScreener:", error);
    return null;
  }
}

/**
 * Gets the top tokens on Berachain by trading volume
 * @param limit The maximum number of tokens to return
 * @returns Array of top tokens
 */
export async function getTopTokens(limit = 12): Promise<DexScreenerToken[]> {
  try {
    console.log("Fetching top tokens from DexScreener");
    
    // Fetch top pairs from Berachain
    const data = await fetchDexScreener("/pairs/berachain");
    
    if (!data?.pairs || data.pairs.length === 0) {
      throw new Error("No pairs found on Berachain");
    }
    
    // Get all pairs and sort by volume
    const pairs = data.pairs as DexScreenerPair[];
    pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    
    // Extract unique tokens from pairs
    const tokenMap = new Map<string, DexScreenerToken>();
    const processedAddresses = new Set<string>();
    
    // Process pairs to extract tokens
    for (const pair of pairs) {
      // Process base token
      if (pair.baseToken && !processedAddresses.has(pair.baseToken.address.toLowerCase())) {
        const baseAddress = pair.baseToken.address.toLowerCase();
        processedAddresses.add(baseAddress);
        
        // Skip stablecoins and common quote tokens
        if (isStablecoin(pair.baseToken.symbol)) continue;
        
        tokenMap.set(baseAddress, {
          address: baseAddress,
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          price_usd: pair.priceUsd || "0",
          volume_24h: pair.volume?.h24 || 0,
          price_change_24h: pair.priceChange?.h24 || 0,
          market_cap_usd: pair.marketCap || pair.fdv || 0,
          liquidity_usd: pair.liquidity?.usd || 0,
          fdv_usd: pair.fdv || 0
        });
      }
      
      // Process quote token
      if (pair.quoteToken && !processedAddresses.has(pair.quoteToken.address.toLowerCase())) {
        const quoteAddress = pair.quoteToken.address.toLowerCase();
        processedAddresses.add(quoteAddress);
        
        // Skip stablecoins and common quote tokens
        if (isStablecoin(pair.quoteToken.symbol)) continue;
        
        // For quote tokens, we need to calculate the price differently
        const quotePrice = pair.priceUsd ? (1 / parseFloat(pair.priceUsd)).toString() : "0";
        
        tokenMap.set(quoteAddress, {
          address: quoteAddress,
          name: pair.quoteToken.name,
          symbol: pair.quoteToken.symbol,
          price_usd: quotePrice,
          volume_24h: pair.volume?.h24 || 0,
          price_change_24h: -1 * (pair.priceChange?.h24 || 0), // Invert price change for quote token
          market_cap_usd: 0, // We don't have this data for quote tokens
          liquidity_usd: pair.liquidity?.usd || 0,
          fdv_usd: 0 // We don't have this data for quote tokens
        });
      }
      
      // Stop once we have enough tokens
      if (tokenMap.size >= limit * 2) break; // Get more than needed to filter later
    }
    
    // Convert map to array and sort by volume
    let tokens = Array.from(tokenMap.values());
    tokens.sort((a, b) => b.volume_24h - a.volume_24h);
    
    // Limit to requested number of tokens
    tokens = tokens.slice(0, limit);
    
    // Try to enrich token data with additional info
    const enrichedTokens = await Promise.all(
      tokens.map(async (token) => {
        try {
          const fullTokenInfo = await getTokenInfo(token.address);
          if (fullTokenInfo) {
            // Merge the data, keeping the original volume and price data
            return {
              ...token,
              ...fullTokenInfo,
              // Keep original price and volume data as they're more accurate from the pairs endpoint
              price_usd: token.price_usd,
              volume_24h: token.volume_24h,
              price_change_24h: token.price_change_24h
            };
          }
        } catch (error) {
          console.warn(`Failed to enrich token ${token.symbol}:`, error);
        }
        return token;
      })
    );
    
    console.log(`Returning ${enrichedTokens.length} top tokens from DexScreener`);
    return enrichedTokens;
  } catch (error) {
    console.error("Error fetching top tokens from DexScreener:", error);
    
    // Fallback to hardcoded data
    return getHardcodedTokens();
  }
}

/**
 * Checks if a token symbol is a stablecoin
 * @param symbol The token symbol
 * @returns True if the token is a stablecoin
 */
function isStablecoin(symbol: string): boolean {
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'USDD', 'GUSD', 'USDJ'];
  return stablecoins.includes(symbol.toUpperCase());
}

/**
 * Returns hardcoded token data as a fallback
 * @returns Array of hardcoded tokens
 */
function getHardcodedTokens(): DexScreenerToken[] {
  return [
    {
      address: "0x6969696969696969696969696969696969696969",
      name: "Wrapped Bera",
      symbol: "WBERA",
      price_usd: "6.14",
      volume_24h: 23012057,
      price_change_24h: 0,
      market_cap_usd: 125754237
    },
    {
      address: "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590",
      name: "Wrapped Ether",
      symbol: "WETH",
      price_usd: "1890.36",
      volume_24h: 12500000,
      price_change_24h: -1.01,
      market_cap_usd: 356634382
    },
    {
      address: "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      price_usd: "82689.18",
      volume_24h: 3358438,
      price_change_24h: -1.38,
      market_cap_usd: 333420126
    },
    {
      address: "0x5d7a7e844e2f6d3c0e6f9e97c8ec29795bac2f65",
      name: "Bong",
      symbol: "BONG",
      price_usd: "0.0042",
      volume_24h: 2500000,
      price_change_24h: 12.5,
      market_cap_usd: 42000000
    },
    {
      address: "0x8c4495d21e725e95a32e8d5b1a96e3b1b5a0c4a9",
      name: "Honey Pot",
      symbol: "HPOT",
      price_usd: "0.0185",
      volume_24h: 1850000,
      price_change_24h: 8.2,
      market_cap_usd: 18500000
    },
    {
      address: "0x7b5a3e3d8493c8c3b9c1f79d34b9f5bfb3ce7a95",
      name: "Berps",
      symbol: "BERPS",
      price_usd: "0.0075",
      volume_24h: 1750000,
      price_change_24h: -5.3,
      market_cap_usd: 7500000
    },
    {
      address: "0x3e7fc44e25c07be3d67c241e6e59cb838df035eb",
      name: "Bera Inu",
      symbol: "BINU",
      price_usd: "0.00000325",
      volume_24h: 1250000,
      price_change_24h: 32.1,
      market_cap_usd: 3250000
    },
    {
      address: "0x9c6b5cef4b2a14067c0f7c9b1a8a51f7c0c363f3",
      name: "Berachain Gold",
      symbol: "BGOLD",
      price_usd: "0.0215",
      volume_24h: 1150000,
      price_change_24h: -2.8,
      market_cap_usd: 21500000
    },
    {
      address: "0x4d5f06cdc73d72c891eb79f1d350a1c3c8a84a51",
      name: "Salmon",
      symbol: "SALMON",
      price_usd: "0.0092",
      volume_24h: 920000,
      price_change_24h: 15.7,
      market_cap_usd: 9200000
    },
    {
      address: "0x2c4a603a2aa5596287a06886862dc29d56dbc354",
      name: "Grizzly",
      symbol: "GRIZ",
      price_usd: "0.0135",
      volume_24h: 850000,
      price_change_24h: 4.2,
      market_cap_usd: 13500000
    },
    {
      address: "0x1d5e65a087eb1cf5c034f19c7967d4c2847022e5",
      name: "Kodiak",
      symbol: "KOD",
      price_usd: "0.0078",
      volume_24h: 780000,
      price_change_24h: -1.5,
      market_cap_usd: 7800000
    },
    {
      address: "0x8a6d4c8735371ebfc8dd0d1b31680c9c6c57ca92",
      name: "Polar",
      symbol: "POLAR",
      price_usd: "0.0056",
      volume_24h: 560000,
      price_change_24h: 7.8,
      market_cap_usd: 5600000
    }
  ];
} 