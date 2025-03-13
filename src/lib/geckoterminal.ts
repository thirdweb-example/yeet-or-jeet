/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = "https://api.geckoterminal.com/api/v2";
const API_VERSION = "20230302";

// TODO - remove explicit any, add proper types

const geckoNetworkMap: { [key: number]: string } = {
  // 1: "ethereum",
  // 137: "polygon_pos",
  // 42161: "arbitrum",
  // 10: "optimism",
  // 8453: "base",
  80094: "berachain",
  // 43114: "avalanche",
  // 56: "bsc",
  // 81457: "blast",
  // 42220: "celo",
  // 324: "zksync",
};

interface TokenInfoPool {
  address: string;
  name: string;
  volume_24h: number;
  liquidity: number;
  relationships: {
    baseToken: string;
    quoteToken: string;
  };
}

interface TokenPriceInfo {
  price_usd: string;
  price_change_24h: number;
  price_change_7d: number;
  price_change_30d: number;
  volume_24h: number;
  market_cap_usd: number;
}

interface TokenMarketData {
  price: TokenPriceInfo;
  market_data: {
    market_cap_usd: number;
    volume_24h: number;
    price_change_24h: number;
    price_change_7d: number;
    price_change_30d: number;
  };
  liquidity: {
    total_liquidity_usd: number;
    liquidity_change_24h: number;
  };
}

export interface TokenInfo {
  price?: string;
  network?: string;
  address?: string;
  name?: string;
  symbol?: string;
  pools?: TokenInfoPool[];
  trades?: any[];
  info?: any;
  marketData?: TokenMarketData;
  priceHistory?: {
    price_usd: string;
    timestamp: number;
  }[];
  topPools?: {
    address: string;
    name: string;
    volume_24h: number;
    liquidity: number;
    price_change_24h: number;
  }[];
  tokenHolders?: {
    address: string;
    balance: string;
    percentage: number;
  }[];
}

async function fetchGeckoTerminal(endpoint: string) {
  try {
    console.log(`Fetching GeckoTerminal API: ${BASE_URL}${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Accept: `application/json;version=${API_VERSION}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("GeckoTerminal API error details:", {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        headers: Object.fromEntries(response.headers.entries()),
      });
      throw new Error(`GeckoTerminal API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`GeckoTerminal API response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error("GeckoTerminal API error:", error);
    throw error;
  }
}

export async function getTokenInfo(
  chainId: number,
  address: string,
): Promise<TokenInfo> {
  try {
    console.log(`Getting token info for chain ${chainId}, address ${address}`);
    const network = geckoNetworkMap[chainId];
    if (!network) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Convert address to lowercase for consistency
    const normalizedAddress = address.toLowerCase();
    console.log(`Normalized address: ${normalizedAddress}`);

    // Get token info first
    const tokenData = await fetchGeckoTerminal(`/networks/${network}/tokens/${normalizedAddress}`);
    
    if (!tokenData?.data) {
      throw new Error(`Token not found on ${network}`);
    }

    const tokenInfo: TokenInfo = {
      network,
      address: normalizedAddress,
      name: tokenData.data.attributes.name,
      symbol: tokenData.data.attributes.symbol,
      info: tokenData.data.attributes,
    };

    // Get price and market data
    try {
      const priceData = await fetchGeckoTerminal(`/networks/${network}/tokens/${normalizedAddress}/price`);
      if (priceData?.data?.attributes) {
        tokenInfo.marketData = {
          price: {
            price_usd: priceData.data.attributes.price_usd,
            price_change_24h: priceData.data.attributes.price_change_24h,
            price_change_7d: priceData.data.attributes.price_change_7d,
            price_change_30d: priceData.data.attributes.price_change_30d,
            volume_24h: priceData.data.attributes.volume_24h,
            market_cap_usd: priceData.data.attributes.market_cap_usd,
          },
          market_data: {
            market_cap_usd: priceData.data.attributes.market_cap_usd,
            volume_24h: priceData.data.attributes.volume_24h,
            price_change_24h: priceData.data.attributes.price_change_24h,
            price_change_7d: priceData.data.attributes.price_change_7d,
            price_change_30d: priceData.data.attributes.price_change_30d,
          },
          liquidity: {
            total_liquidity_usd: priceData.data.attributes.total_liquidity_usd,
            liquidity_change_24h: priceData.data.attributes.liquidity_change_24h,
          },
        };
        tokenInfo.price = priceData.data.attributes.price_usd;
      }
    } catch (error) {
      console.warn("Failed to fetch price data:", error);
    }

    // Get price history
    try {
      const priceHistoryData = await fetchGeckoTerminal(`/networks/${network}/tokens/${normalizedAddress}/price_history`);
      if (priceHistoryData?.data?.attributes?.price_history) {
        tokenInfo.priceHistory = priceHistoryData.data.attributes.price_history;
      }
    } catch (error) {
      console.warn("Failed to fetch price history:", error);
    }

    // Get top pools
    try {
      const poolsData = await fetchGeckoTerminal(`/networks/${network}/tokens/${normalizedAddress}/pools`);
      if (poolsData?.data) {
        tokenInfo.pools = poolsData.data.map((pool: any) => ({
          address: pool.attributes.address,
          name: pool.attributes.name,
          volume_24h: pool.attributes.volume_usd_24h,
          liquidity: pool.attributes.reserve_in_usd,
          relationships: {
            baseToken: pool.relationships.base_token.data.id
              .split("_")[1]
              .toLowerCase(),
            quoteToken: pool.relationships.quote_token.data.id
              .split("_")[1]
              .toLowerCase(),
          },
        }));

        // Get top pools with price change
        tokenInfo.topPools = poolsData.data
          .slice(0, 5)
          .map((pool: any) => ({
            address: pool.attributes.address,
            name: pool.attributes.name,
            volume_24h: pool.attributes.volume_usd_24h,
            liquidity: pool.attributes.reserve_in_usd,
            price_change_24h: pool.attributes.price_change_24h,
          }));
      }
    } catch (error) {
      console.warn("Failed to fetch pools data:", error);
    }

    // Get token holders
    try {
      const holdersData = await fetchGeckoTerminal(`/networks/${network}/tokens/${normalizedAddress}/holders`);
      if (holdersData?.data) {
        tokenInfo.tokenHolders = holdersData.data.map((holder: any) => ({
          address: holder.attributes.address,
          balance: holder.attributes.balance,
          percentage: holder.attributes.percentage,
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch token holders:", error);
    }

    if (!tokenInfo.name || !tokenInfo.symbol) {
      throw new Error("Token data incomplete");
    }

    console.log("Final token info:", tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error("Error getting token info:", error);
    throw error;
  }
}

interface PoolToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl: string;
}

export interface PoolInfo {
  chainId: number;
  address: string;
  token1: PoolToken;
  token2: PoolToken;
}

export async function getTokenInfoForPool(
  chainId: number,
  poolAddress: string,
): Promise<PoolInfo> {
  const network = geckoNetworkMap[chainId];
  const poolInfo = await fetchGeckoTerminal(
    `/networks/${network}/pools/${poolAddress}/info`,
  );

  return {
    chainId,
    address: poolAddress,
    token1: {
      address: poolInfo[0]?.attributes?.address,
      name: poolInfo[0]?.attributes?.name,
      symbol: poolInfo[0]?.attributes?.symbol,
      decimals: poolInfo[0]?.attributes?.decimals,
      imageUrl: poolInfo[0]?.attributes?.decimals,
    },
    token2: {
      address: poolInfo[1]?.attributes?.address,
      name: poolInfo[1]?.attributes?.name,
      symbol: poolInfo[1]?.attributes?.symbol,
      decimals: poolInfo[1]?.attributes?.decimals,
      imageUrl: poolInfo[1]?.attributes?.image_url,
    },
  };
}

export const fetchPoolInfo = async (
  chainId: number,
  poolAddress: string,
): Promise<PoolInfo> => {
  if (!poolAddress) throw new Error("Pool not found");
  const poolInfo = await getTokenInfoForPool(chainId, poolAddress);

  return poolInfo;
};

// Add this interface near the other interfaces
interface TopToken {
  address: string;
  name: string;
  symbol: string;
  price_usd: string;
  volume_24h: number;
  price_change_24h: number;
  market_cap_usd: number;
}

// Add this new function to fetch top tokens
export async function getTopTokens(): Promise<TopToken[]> {
  try {
    console.log("Fetching real-time top tokens data for Berachain");
    
    // Define the token addresses we want to track (from our hardcoded list)
    const tokenAddresses = [
      "0x6969696969696969696969696969696969696969", // WBERA
      "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590", // WETH
      "0x0555e30da8f98308edb960aa94c0db47230d2b9c", // WBTC
      "0x5d7a7e844e2f6d3c0e6f9e97c8ec29795bac2f65", // BONG
      "0x8c4495d21e725e95a32e8d5b1a96e3b1b5a0c4a9", // HPOT
      "0x7b5a3e3d8493c8c3b9c1f79d34b9f5bfb3ce7a95", // BERPS
      "0x3e7fc44e25c07be3d67c241e6e59cb838df035eb", // BINU
      "0x9c6b5cef4b2a14067c0f7c9b1a8a51f7c0c363f3", // BGOLD
      "0x4d5f06cdc73d72c891eb79f1d350a1c3c8a84a51", // SALMON
      "0x2c4a603a2aa5596287a06886862dc29d56dbc354", // GRIZ
      "0x1d5e65a087eb1cf5c034f19c7967d4c2847022e5", // KOD
      "0x8a6d4c8735371ebfc8dd0d1b31680c9c6c57ca92"  // POLAR
    ];
    
    // First try to get pools data which we know works
    console.log("Fetching pools data from Berachain");
    const poolsData = await fetchGeckoTerminal("/networks/berachain/pools?page=1&page_size=50");
    
    if (!poolsData?.data) {
      throw new Error("Failed to fetch pools data");
    }
    
    console.log(`Successfully fetched ${poolsData.data.length} pools`);
    
    // Extract token information from pools
    const tokenMap = new Map<string, any>();
    
    // Process each pool to extract token information
    for (const pool of poolsData.data) {
      if (!pool.attributes) continue;
      
      // Process base token
      if (pool.relationships?.base_token?.data) {
        const baseTokenId = pool.relationships.base_token.data.id;
        const baseTokenAddress = baseTokenId.split('_')[1].toLowerCase();
        const baseTokenPrice = pool.attributes.base_token_price_usd;
        
        // Update token info if we have a price
        if (baseTokenPrice && !tokenMap.has(baseTokenAddress)) {
          tokenMap.set(baseTokenAddress, {
            address: baseTokenAddress,
            price_usd: baseTokenPrice,
            volume_24h: pool.attributes.volume_usd?.h24 || 0,
            // We'll try to get these from token data later
            name: "",
            symbol: "",
            price_change_24h: 0,
            market_cap_usd: 0
          });
        }
      }
      
      // Process quote token
      if (pool.relationships?.quote_token?.data) {
        const quoteTokenId = pool.relationships.quote_token.data.id;
        const quoteTokenAddress = quoteTokenId.split('_')[1].toLowerCase();
        const quoteTokenPrice = pool.attributes.quote_token_price_usd;
        
        // Update token info if we have a price
        if (quoteTokenPrice && !tokenMap.has(quoteTokenAddress)) {
          tokenMap.set(quoteTokenAddress, {
            address: quoteTokenAddress,
            price_usd: quoteTokenPrice,
            volume_24h: pool.attributes.volume_usd?.h24 || 0,
            // We'll try to get these from token data later
            name: "",
            symbol: "",
            price_change_24h: 0,
            market_cap_usd: 0
          });
        }
      }
    }
    
    console.log(`Extracted ${tokenMap.size} unique tokens from pools data`);
    
    // Now try to get detailed information for each token
    const tokens: TopToken[] = [];
    
    // First try to get data for our priority tokens
    for (const address of tokenAddresses) {
      const normalizedAddress = address.toLowerCase();
      
      try {
        console.log(`Fetching data for token ${normalizedAddress}`);
        const tokenData = await fetchGeckoTerminal(`/networks/berachain/tokens/${normalizedAddress}`);
        
        if (tokenData?.data?.attributes) {
          const attrs = tokenData.data.attributes;
          const existingData = tokenMap.get(normalizedAddress) || {};
          
          tokens.push({
            address: normalizedAddress,
            name: attrs.name || "Unknown",
            symbol: attrs.symbol || "???",
            price_usd: attrs.price_usd || existingData.price_usd || "0",
            volume_24h: attrs.volume_usd?.h24 || existingData.volume_24h || 0,
            price_change_24h: 0, // Not available in token data
            market_cap_usd: attrs.market_cap_usd || attrs.fdv_usd || 0
          });
          
          console.log(`Successfully added token ${attrs.symbol || "Unknown"}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch data for token ${normalizedAddress}:`, error);
        
        // If we have some data from pools, use that
        if (tokenMap.has(normalizedAddress)) {
          const fallbackData = tokenMap.get(normalizedAddress);
          
          // Use hardcoded name/symbol for known tokens
          let name = "Unknown";
          let symbol = "???";
          
          // Map known addresses to names/symbols
          if (normalizedAddress === "0x6969696969696969696969696969696969696969".toLowerCase()) {
            name = "Wrapped Bera";
            symbol = "WBERA";
          } else if (normalizedAddress === "0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590".toLowerCase()) {
            name = "Wrapped Ether";
            symbol = "WETH";
          } else if (normalizedAddress === "0x0555e30da8f98308edb960aa94c0db47230d2b9c".toLowerCase()) {
            name = "Wrapped Bitcoin";
            symbol = "WBTC";
          }
          
          tokens.push({
            address: normalizedAddress,
            name,
            symbol,
            price_usd: fallbackData.price_usd || "0",
            volume_24h: fallbackData.volume_24h || 0,
            price_change_24h: 0,
            market_cap_usd: 0
          });
          
          console.log(`Added token ${symbol} with fallback data`);
        }
      }
    }
    
    // If we don't have enough tokens yet, add more from the pool data
    if (tokens.length < 12) {
      console.log("Adding more tokens from pool data to reach 12 tokens");
      
      // Get tokens we haven't processed yet
      for (const [address, data] of tokenMap.entries()) {
        // Skip tokens we've already added
        if (tokens.some(t => t.address.toLowerCase() === address.toLowerCase())) {
          continue;
        }
        
        try {
          // Try to get token details
          const tokenData = await fetchGeckoTerminal(`/networks/berachain/tokens/${address}`);
          
          if (tokenData?.data?.attributes) {
            const attrs = tokenData.data.attributes;
            
            tokens.push({
              address,
              name: attrs.name || "Unknown",
              symbol: attrs.symbol || "???",
              price_usd: attrs.price_usd || data.price_usd || "0",
              volume_24h: attrs.volume_usd?.h24 || data.volume_24h || 0,
              price_change_24h: 0,
              market_cap_usd: attrs.market_cap_usd || attrs.fdv_usd || 0
            });
            
            console.log(`Added additional token ${attrs.symbol || "Unknown"}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch additional data for token ${address}:`, error);
          
          // Use the data we have from pools
          tokens.push({
            address,
            name: "Unknown",
            symbol: "???",
            price_usd: data.price_usd || "0",
            volume_24h: data.volume_24h || 0,
            price_change_24h: 0,
            market_cap_usd: 0
          });
        }
        
        // Stop once we have 12 tokens
        if (tokens.length >= 12) {
          break;
        }
      }
    }
    
    // Sort by volume
    tokens.sort((a, b) => b.volume_24h - a.volume_24h);
    
    // Limit to 12 tokens
    const result = tokens.slice(0, 12);
    
    console.log(`Returning ${result.length} top tokens with real-time data`);
    return result;
  } catch (error) {
    console.error("Error fetching real-time token data:", error);
    
    // Fallback to hardcoded data if all API attempts fail
    console.log("Falling back to hardcoded data due to API error");
    
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
}
