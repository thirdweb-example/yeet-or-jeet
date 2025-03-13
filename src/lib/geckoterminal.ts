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

// Update the TopToken interface to include the additional metadata
export interface TopToken {
  address: string;
  name: string;
  symbol: string;
  price_usd: string;
  volume_24h: number;
  price_change_24h: number;
  market_cap_usd: number;
  // Additional metadata from the /info endpoint
  image_url?: string;
  description?: string;
  websites?: string[];
  discord_url?: string;
  telegram_handle?: string;
  twitter_handle?: string;
  categories?: string[];
  gt_score?: number;
  liquidity_usd?: number;
  trust_score?: number;
}

// Add this function to check if a token is a stablecoin
function isStablecoin(symbol: string): boolean {
  if (!symbol) return false;
  
  // Expanded list of stablecoins and their variations
  const stablecoins = [
    'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'USDD', 'GUSD', 'USDJ',
    'UST', 'USDB', 'USDK', 'USDX', 'SUSD', 'CUSD', 'MUSD', 'DUSD', 'HUSD', 'OUSD',
    'USDN', 'USDH', 'USDL', 'USDR', 'USDV', 'USDW', 'USDY', 'USDZ',
    'EURT', 'EURS', 'EUROC', 'EURU', 'JEUR', 'SEUR',
    'CADC', 'XSGD', 'XIDR', 'NZDS', 'TRYB', 'BIDR', 'BRLC', 'CNHT', 'IDRT', 'KRWB',
    'MIM', 'USDM', 'USDS', 'USDE', 'USDEX', 'USDFL', 'USDQ', 'USDG', 'USDTG'
  ];
  
  // Check if the symbol contains any of the stablecoin identifiers
  const upperSymbol = symbol.toUpperCase();
  
  // Direct match
  if (stablecoins.includes(upperSymbol)) return true;
  
  // Check for common patterns in stablecoin names
  if (upperSymbol.startsWith('USD') || 
      upperSymbol.endsWith('USD') || 
      upperSymbol.includes('USD') ||
      upperSymbol.startsWith('EUR') ||
      upperSymbol.endsWith('EUR') ||
      upperSymbol.includes('STABLE') ||
      upperSymbol.includes('PEG')) {
    return true;
  }
  
  return false;
}

// Add this new function to fetch top tokens
export async function getTopTokens(): Promise<TopToken[]> {
  try {
    console.log("Fetching real-time top tokens data for Berachain");
    
    // First try to get pools data which we know works
    console.log("Fetching pools data from Berachain");
    const poolsData = await fetchGeckoTerminal("/networks/berachain/pools?page=1&page_size=100");
    
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
        const baseTokenSymbol = pool.attributes.base_token_symbol;
        
        // Skip stablecoins
        if (isStablecoin(baseTokenSymbol)) {
          console.log(`Skipping stablecoin: ${baseTokenSymbol}`);
          continue;
        }
        
        // Update token info if we have a price
        if (baseTokenPrice && !tokenMap.has(baseTokenAddress)) {
          tokenMap.set(baseTokenAddress, {
            address: baseTokenAddress,
            price_usd: baseTokenPrice,
            volume_24h: pool.attributes.volume_usd?.h24 || 0,
            name: pool.attributes.base_token_name || "",
            symbol: baseTokenSymbol || "",
            price_change_24h: pool.attributes.price_change_percentage?.h24 || 0,
            market_cap_usd: 0
          });
        }
      }
      
      // Process quote token
      if (pool.relationships?.quote_token?.data) {
        const quoteTokenId = pool.relationships.quote_token.data.id;
        const quoteTokenAddress = quoteTokenId.split('_')[1].toLowerCase();
        const quoteTokenPrice = pool.attributes.quote_token_price_usd;
        const quoteTokenSymbol = pool.attributes.quote_token_symbol;
        
        // Skip stablecoins
        if (isStablecoin(quoteTokenSymbol)) {
          console.log(`Skipping stablecoin: ${quoteTokenSymbol}`);
          continue;
        }
        
        // Update token info if we have a price
        if (quoteTokenPrice && !tokenMap.has(quoteTokenAddress)) {
          tokenMap.set(quoteTokenAddress, {
            address: quoteTokenAddress,
            price_usd: quoteTokenPrice,
            volume_24h: pool.attributes.volume_usd?.h24 || 0,
            name: pool.attributes.quote_token_name || "",
            symbol: quoteTokenSymbol || "",
            price_change_24h: -1 * (pool.attributes.price_change_percentage?.h24 || 0), // Invert for quote token
            market_cap_usd: 0
          });
        }
      }
    }
    
    console.log(`Extracted ${tokenMap.size} unique non-stablecoin tokens from pools data`);
    
    // Now try to get detailed information for each token
    const tokens: TopToken[] = [];
    
    // Convert map to array and sort by volume
    const tokenArray = Array.from(tokenMap.values());
    tokenArray.sort((a, b) => b.volume_24h - a.volume_24h);
    
    // Take top 20 tokens by volume to enrich with additional data
    const topTokensByVolume = tokenArray.slice(0, 20);
    
    // Try to get detailed information for each token
    for (const tokenData of topTokensByVolume) {
      const address = tokenData.address;
      
      try {
        console.log(`Fetching data for token ${address}`);
        const tokenResponse = await fetchGeckoTerminal(`/networks/berachain/tokens/${address}`);
        
        if (tokenResponse?.data?.attributes) {
          const attrs = tokenResponse.data.attributes;
          
          // Skip stablecoins (double check)
          if (isStablecoin(attrs.symbol)) {
            console.log(`Skipping stablecoin: ${attrs.symbol}`);
            continue;
          }
          
          // Create base token data
          const tokenInfo: TopToken = {
            address: address,
            name: attrs.name || tokenData.name || "Unknown",
            symbol: attrs.symbol || tokenData.symbol || "???",
            price_usd: attrs.price_usd || tokenData.price_usd || "0",
            volume_24h: attrs.volume_usd?.h24 || tokenData.volume_24h || 0,
            price_change_24h: tokenData.price_change_24h || 0,
            market_cap_usd: attrs.market_cap_usd || attrs.fdv_usd || 0
          };
          
          // Try to get additional info from the /info endpoint
          try {
            console.log(`Fetching additional info for token ${address}`);
            const infoData = await fetchGeckoTerminal(`/networks/berachain/tokens/${address}/info`);
            
            if (infoData?.data?.attributes) {
              const infoAttrs = infoData.data.attributes;
              
              // Enrich token data with additional metadata
              tokenInfo.image_url = infoAttrs.image_url;
              tokenInfo.description = infoAttrs.description;
              tokenInfo.websites = infoAttrs.websites;
              tokenInfo.discord_url = infoAttrs.discord_url;
              tokenInfo.telegram_handle = infoAttrs.telegram_handle;
              tokenInfo.twitter_handle = infoAttrs.twitter_handle;
              tokenInfo.categories = infoAttrs.categories;
              tokenInfo.gt_score = infoAttrs.gt_score;
              
              console.log(`Successfully enriched token ${attrs.symbol || "Unknown"} with additional metadata`);
            }
          } catch (infoError) {
            console.warn(`Failed to fetch additional info for token ${address}:`, infoError);
            // Continue with the basic token data we have
          }
          
          tokens.push(tokenInfo);
          console.log(`Successfully added token ${attrs.symbol || "Unknown"}`);
        } else {
          // Use the data we already have from pools
          tokens.push({
            address: address,
            name: tokenData.name || "Unknown",
            symbol: tokenData.symbol || "???",
            price_usd: tokenData.price_usd || "0",
            volume_24h: tokenData.volume_24h || 0,
            price_change_24h: tokenData.price_change_24h || 0,
            market_cap_usd: tokenData.market_cap_usd || 0
          });
          
          console.log(`Added token ${tokenData.symbol || "Unknown"} with pool data`);
        }
      } catch (error) {
        console.warn(`Failed to fetch data for token ${address}:`, error);
        
        // Use the data we have from pools
        tokens.push({
          address: address,
          name: tokenData.name || "Unknown",
          symbol: tokenData.symbol || "???",
          price_usd: tokenData.price_usd || "0",
          volume_24h: tokenData.volume_24h || 0,
          price_change_24h: tokenData.price_change_24h || 0,
          market_cap_usd: tokenData.market_cap_usd || 0
        });
        
        console.log(`Added token ${tokenData.symbol || "Unknown"} with fallback pool data`);
      }
    }
    
    // Sort by volume
    tokens.sort((a, b) => b.volume_24h - a.volume_24h);
    
    // Limit to 12 tokens
    const result = tokens.slice(0, 12);
    
    console.log(`Returning ${result.length} top non-stablecoin tokens with real-time data`);
    return result;
  } catch (error) {
    console.error("Error fetching real-time token data:", error);
    
    // Return empty array instead of hardcoded data
    console.warn("Returning empty array due to API error");
    return [];
  }
}
