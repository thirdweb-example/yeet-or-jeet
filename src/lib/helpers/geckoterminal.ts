// these can be fetched from their API, but we're just going to hardcode them for now
const chainIdToSlug: Record<number, string> = {
  8453: "base",
  1: "eth",
};

export type GeckoTxStats = {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
};

export type GeckoRelationship = {
  data:
    | {
        id: string;
        type: string;
      }
    | {
        id: string;
        type: string;
      }[];
};

export type GeckoPoolData = {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    token_price_usd: string;
    fdv_usd: string;
    market_cap_usd: string;
    price_change_percentage: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      m5: GeckoTxStats;
      m15: GeckoTxStats;
      m30: GeckoTxStats;
      h1: GeckoTxStats;
      h24: GeckoTxStats;
    };
    volume_usd: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: GeckoRelationship;
    quote_token: GeckoRelationship;
    dex: GeckoRelationship;
  };
};

export type GeckoTerminalData = {
  data: {
    id: string;
    type: string;
    attributes: {
      name: string;
      address: string;
      symbol: string;
      decimals: number;
      image_url: string;
      coingecko_coin_id: string;
      total_supply: string;
      price_usd: string;
      fdv_usd: string;
      total_reserve_in_usd: string;
      volume_usd: {
        h24: string;
      };
      market_cap_usd: string;
    };
    relationships: {
      top_pools: GeckoRelationship;
    };
  };
  included: GeckoPoolData[];
};

export const getGeckoTerminalData = async (
  chainId: number,
  tokenAddress: string,
): Promise<GeckoTerminalData | undefined> => {
  const chainSlug = chainIdToSlug[chainId];
  if (!chainSlug) return;
  const url = `https://api.geckoterminal.com/api/v2/networks/${chainSlug}/tokens/${tokenAddress}?include=top_pools`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json;version=20230302",
    },
  });
  if (!response.ok) return;
  return await response.json();
};
