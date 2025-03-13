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
    const network = "berachain";
    console.log(`Starting to fetch top tokens on ${network}`);
    
    // First, let's just try to get the network info to verify the network ID
    try {
      console.log(`Checking if network ${network} exists`);
      const networkInfo = await fetchGeckoTerminal(`/networks/${network}`);
      console.log(`Network info response:`, networkInfo);
    } catch (error) {
      console.error(`Failed to fetch network info for ${network}:`, error);
      // Continue anyway, as we know the pools endpoint works
    }
    
    // Get top pools directly - we know this works from our testing
    console.log(`Fetching top pools for ${network}`);
    const poolsResponse = await fetchGeckoTerminal(
      `/networks/${network}/pools?page=1&page_size=12`
    );

    if (!poolsResponse?.data) {
      throw new Error("No pools found");
    }
    
    console.log(`Found ${poolsResponse.data.length} pools`);
    
    // Extract tokens directly from the pools data without making additional API calls
    const tokens: TopToken[] = [];
    const uniqueTokens = new Map<string, any>(); // Use a Map to store token data
    
    // Process pools to extract token information
    for (const pool of poolsResponse.data) {
      if (!pool.attributes) continue;
      
      // Extract base token info if available
      if (pool.relationships?.base_token?.data) {
        const baseTokenId = pool.relationships.base_token.data.id;
        const baseTokenAddress = baseTokenId.split('_')[1];
        
        // Get price from pool data if available
        const baseTokenPrice = pool.attributes.base_token_price_usd;
        
        if (!uniqueTokens.has(baseTokenAddress)) {
          uniqueTokens.set(baseTokenAddress, {
            id: baseTokenId,
            address: baseTokenAddress,
            price_usd: baseTokenPrice || "0",
            volume_24h: pool.attributes.volume_usd?.h24 || 0
          });
        }
      }
      
      // Extract quote token info if available
      if (pool.relationships?.quote_token?.data) {
        const quoteTokenId = pool.relationships.quote_token.data.id;
        const quoteTokenAddress = quoteTokenId.split('_')[1];
        
        // Get price from pool data if available
        const quoteTokenPrice = pool.attributes.quote_token_price_usd;
        
        if (!uniqueTokens.has(quoteTokenAddress)) {
          uniqueTokens.set(quoteTokenAddress, {
            id: quoteTokenId,
            address: quoteTokenAddress,
            price_usd: quoteTokenPrice || "0",
            volume_24h: pool.attributes.volume_usd?.h24 || 0
          });
        }
      }
    }
    
    console.log(`Found ${uniqueTokens.size} unique tokens from pools`);
    
    // Now fetch details for each token one by one
    for (const [address, tokenInfo] of uniqueTokens.entries()) {
      try {
        console.log(`Fetching details for token ${address}`);
        const tokenData = await fetchGeckoTerminal(`/networks/${network}/tokens/${address}`);
        
        if (tokenData?.data?.attributes) {
          const attrs = tokenData.data.attributes;
          tokens.push({
            address: address,
            name: attrs.name || "Unknown",
            symbol: attrs.symbol || "???",
            price_usd: attrs.price_usd || tokenInfo.price_usd || "0",
            volume_24h: attrs.volume_usd?.h24 || tokenInfo.volume_24h || 0,
            price_change_24h: 0, // Not available
            market_cap_usd: attrs.market_cap_usd || attrs.fdv_usd || 0
          });
          console.log(`Successfully added token ${attrs.symbol || "Unknown"}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch data for token ${address}:`, error);
        // Add token with minimal info we have from the pool
        tokens.push({
          address: address,
          name: "Unknown",
          symbol: "???",
          price_usd: tokenInfo.price_usd || "0",
          volume_24h: tokenInfo.volume_24h || 0,
          price_change_24h: 0,
          market_cap_usd: 0
        });
      }
      
      // Limit to 12 tokens
      if (tokens.length >= 12) break;
    }
    
    // Sort by volume
    tokens.sort((a, b) => b.volume_24h - a.volume_24h);
    
    console.log(`Returning ${tokens.length} top tokens`);
    return tokens;
  } catch (error) {
    console.error("Error in getTopTokens:", error);
    throw error;
  }
}
