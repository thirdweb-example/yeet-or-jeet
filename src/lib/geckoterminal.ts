/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = "https://api.geckoterminal.com/api/v2";
const API_VERSION = "20230302";

// TODO - remove explicit any, add proper types

export const defaultChainId = 8453;
export const defaultNetwork = "base";
export const defaultChainNameUniswap = "base";
export const defaultToken = {
  137: "0xeb51d9a39ad5eef215dc0bf39a8821ff804a0f01", // LGNS
  8453: "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf", // VVV
};

interface TokenInfo {
  price?: string;
  network?: string;
  address?: string;
  name?: string;
  symbol?: string;
  pools?: any[];
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
  network: string,
  address: string
): Promise<TokenInfo> {
  try {
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
      }));
    }

    return tokenInfo;
  } catch (error) {
    console.error("Error getting token info:", error);
    throw error;
  }
}

export async function getTokenInfoForPool(poolAddress: string) {
  return fetchGeckoTerminal(
    `/networks/${defaultNetwork}/pools/${poolAddress}/info`
  );
}
