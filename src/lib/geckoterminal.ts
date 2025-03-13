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
function isStablecoin(symbol: string, address?: string): boolean {
  if (!symbol && !address) return false;
  
  // Specific stablecoin addresses to exclude from the homepage
  const stablecoinAddresses = [
    '0x1ce0a25d13ce4d52071ae7e02cf1f6606f4c79d3', // NECT
    '0x211cc4dd073734da055fbf44a2b4667d5e5fe5d2', // sUSD.e
    '0x2840f9d9f96321435ab0f977e7fdbf32ea8b304f', // sUSDa
  ];
  
  // Check if the address matches any known stablecoin address
  if (address && stablecoinAddresses.includes(address.toLowerCase())) {
    return true;
  }
  
  // Expanded list of stablecoins and their variations
  const stablecoins = [
    'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'LUSD', 'USDD', 'GUSD', 'USDJ',
    'UST', 'USDB', 'USDK', 'USDX', 'SUSD', 'CUSD', 'MUSD', 'DUSD', 'HUSD', 'OUSD',
    'USDN', 'USDH', 'USDL', 'USDR', 'USDV', 'USDW', 'USDY', 'USDZ',
    'EURT', 'EURS', 'EUROC', 'EURU', 'JEUR', 'SEUR',
    'CADC', 'XSGD', 'XIDR', 'NZDS', 'TRYB', 'BIDR', 'BRLC', 'CNHT', 'IDRT', 'KRWB',
    'MIM', 'USDM', 'USDS', 'USDE', 'USDEX', 'USDFL', 'USDQ', 'USDG', 'USDTG',
    'NECT', 'SUSD.E', 'SUSDA' // Add the specific stablecoins
  ];
  
  // Check if the symbol contains any of the stablecoin identifiers
  if (symbol) {
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
        if (isStablecoin(baseTokenSymbol, baseTokenAddress)) {
          console.log(`Skipping stablecoin: ${baseTokenSymbol}`);
          continue;
        }
        
        // Get volume for base token
        const baseTokenVolume = pool.attributes.volume_usd?.h24 || 0;
        
        // Skip tokens with volume below $100K
        if (baseTokenVolume < 100000) {
          console.log(`Skipping low volume token: ${baseTokenSymbol} (volume: $${baseTokenVolume.toLocaleString()})`);
          continue;
        }
        
        // Update token info if we have a price
        if (baseTokenPrice && !tokenMap.has(baseTokenAddress)) {
          tokenMap.set(baseTokenAddress, {
            address: baseTokenAddress,
            price_usd: baseTokenPrice,
            volume_24h: baseTokenVolume,
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
        if (isStablecoin(quoteTokenSymbol, quoteTokenAddress)) {
          console.log(`Skipping stablecoin: ${quoteTokenSymbol}`);
          continue;
        }
        
        // Get volume for quote token
        const quoteTokenVolume = pool.attributes.volume_usd?.h24 || 0;
        
        // Skip tokens with volume below $100K
        if (quoteTokenVolume < 100000) {
          console.log(`Skipping low volume token: ${quoteTokenSymbol} (volume: $${quoteTokenVolume.toLocaleString()})`);
          continue;
        }
        
        // Update token info if we have a price
        if (quoteTokenPrice && !tokenMap.has(quoteTokenAddress)) {
          tokenMap.set(quoteTokenAddress, {
            address: quoteTokenAddress,
            price_usd: quoteTokenPrice,
            volume_24h: quoteTokenVolume,
            name: pool.attributes.quote_token_name || "",
            symbol: quoteTokenSymbol || "",
            price_change_24h: -1 * (pool.attributes.price_change_percentage?.h24 || 0), // Invert for quote token
            market_cap_usd: 0
          });
        }
      }
    }
    
    console.log(`Extracted ${tokenMap.size} unique non-stablecoin tokens with volume >= $100K from pools data`);
    
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
          if (isStablecoin(attrs.symbol, address)) {
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
    
    // Filter out tokens with volume below $100K
    const filteredTokens = tokens.filter(token => token.volume_24h >= 100000);
    
    // Limit to 12 tokens
    const result = filteredTokens.slice(0, 12);
    
    console.log(`Returning ${result.length} top non-stablecoin tokens with volume >= $100K`);
    return result;
  } catch (error) {
    console.error("Error fetching real-time token data:", error);
    
    // Return hardcoded tokens as a last resort fallback
    console.warn("Returning hardcoded tokens due to API error");
    return getHardcodedTokens();
  }
}

/**
 * Returns a list of hardcoded tokens as a fallback when APIs fail
 */
function getHardcodedTokens(): TopToken[] {
  // Only include hardcoded tokens with volume >= $100K
  return [
    {
      address: "0x6536cEAD649249cae42FC9bfb1F999429b3ec755",
      name: "Navigator",
      symbol: "NAV",
      price_usd: "0.42",
      volume_24h: 1250000,
      price_change_24h: 5.2,
      market_cap_usd: 4200000
    },
    {
      address: "0xB776608A6881FfD2152bDFE65BD04Cbe66697Dcf",
      name: "Bread",
      symbol: "BREAD",
      price_usd: "0.18",
      volume_24h: 980000,
      price_change_24h: 3.7,
      market_cap_usd: 1800000
    },
    {
      address: "0x047b41A14F0BeF681b94f570479AE7208E577a0C",
      name: "Him",
      symbol: "HIM",
      price_usd: "0.65",
      volume_24h: 1450000,
      price_change_24h: 8.9,
      market_cap_usd: 6500000
    },
    {
      address: "0x1F7210257FA157227D09449229a9266b0D581337",
      name: "Beramo",
      symbol: "BERAMO",
      price_usd: "0.31",
      volume_24h: 1120000,
      price_change_24h: -2.3,
      market_cap_usd: 3100000
    },
    {
      address: "0xb749584F9fC418Cf905d54f462fdbFdC7462011b",
      name: "Berachain Meme",
      symbol: "BM",
      price_usd: "0.0085",
      volume_24h: 750000,
      price_change_24h: 12.5,
      market_cap_usd: 850000
    },
    {
      address: "0xb8B1Af593Dc37B33a2c87C8Db1c9051FC32858B7",
      name: "Ramen",
      symbol: "RAMEN",
      price_usd: "0.22",
      volume_24h: 920000,
      price_change_24h: 4.8,
      market_cap_usd: 2200000
    },
    {
      address: "0x08A38Caa631DE329FF2DAD1656CE789F31AF3142",
      name: "Yeet",
      symbol: "YEET",
      price_usd: "0.0125",
      volume_24h: 680000,
      price_change_24h: 18.3,
      market_cap_usd: 1250000
    },
    {
      address: "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98",
      name: "Hold",
      symbol: "HOLD",
      price_usd: "0.0375",
      volume_24h: 580000,
      price_change_24h: -1.5,
      market_cap_usd: 3750000
    },
    {
      address: "0xb2F776e9c1C926C4b2e54182Fac058dA9Af0B6A5",
      name: "Henlo",
      symbol: "HENLO",
      price_usd: "0.0095",
      volume_24h: 520000,
      price_change_24h: 7.2,
      market_cap_usd: 950000
    },
    {
      address: "0x18878Df23e2a36f81e820e4b47b4A40576D3159C",
      name: "Olympus",
      symbol: "OHM",
      price_usd: "0.85",
      volume_24h: 1350000,
      price_change_24h: -3.8,
      market_cap_usd: 8500000
    }
  ];
}
