/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = "https://api.geckoterminal.com/api/v2";
const API_VERSION = "20230302";

// TODO - remove explicit any, add proper types

const geckoNetworkMap: { [key: number]: string } = {
  137: "polygon_pos",
  8453: "base",
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

export interface TokenInfo {
  price?: string;
  network?: string;
  address?: string;
  name?: string;
  symbol?: string;
  pools?: TokenInfoPool[];
  trades?: any[];
  info?: any;
}

async function fetchGeckoTerminal(endpoint: string) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Accept: `application/json;version=${API_VERSION}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    return await response.json();
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
    const network = geckoNetworkMap[chainId];
    const [priceData, tokenData, poolsData] = await Promise.all([
      // Get token price
      fetchGeckoTerminal(`/simple/networks/${network}/token_price/${address}`),
      // Get token info
      fetchGeckoTerminal(`/networks/${network}/tokens/${address}/info`),
      // Get top pools
      fetchGeckoTerminal(`/networks/${network}/tokens/${address}/pools`),
    ]);

    const tokenInfo: TokenInfo = {
      price: priceData?.data?.attributes?.token_prices?.[address.toLowerCase()],
      network,
      address,
    };

    // Add token data
    if (tokenData?.data?.attributes) {
      const attrs = tokenData.data.attributes;
      tokenInfo.name = attrs.name;
      tokenInfo.symbol = attrs.symbol;
      tokenInfo.info = attrs;
    }

    // Add pools data
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
    }

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
