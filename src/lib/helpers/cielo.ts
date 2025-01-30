interface TotalStats {
  wallet: string;
  realized_pnl_usd: number;
  realized_roi_percentage: number;
  tokens_traded: number;
  unrealized_pnl_usd: number;
  unrealized_roi_percentage: number;
  winrate: number;
  average_holding_time: number;
  combined_pnl_usd: number;
  combined_roi_percentage: number;
}

interface TokenPnL {
  num_swaps: number;
  total_buy_usd: number;
  total_buy_amount: number;
  total_sell_usd: number;
  total_sell_amount: number;
  average_buy_price: number;
  average_sell_price: number;
  total_pnl_usd: number;
  roi_percentage: number;
  unrealized_pnl_usd: number;
  unrealized_roi_percentage: number;
  token_price: number;
  token_address: string;
  token_symbol: string;
  token_name: string;
  chain: string;
  is_honeypot: boolean;
  first_trade: number;
  last_trade: number;
}

interface TokenPnLResponse {
  status: string;
  data: {
    items: TokenPnL[];
    paging: {
      total_rows_in_page: number;
      has_next_page: boolean;
      next_object: string;
    };
  };
}

interface TotalStatsResponse {
  status: string;
  data: TotalStats;
}

const CIELO_API_KEY = process.env.CIELO_API_KEY;
const CIELO_API_BASE = "https://feed-api.cielo.finance/api/v1";

export async function getWalletStats(
  walletAddress: string,
  chain?: string,
  timeframe: "1d" | "7d" | "30d" | "max" = "max",
): Promise<TotalStats | null> {
  try {
    const params = new URLSearchParams({
      timeframe,
      ...(chain && { chains: chain }),
    });

    const url = `${CIELO_API_BASE}/${walletAddress}/pnl/total-stats?${params}`;
    console.log("Attempting to fetch wallet stats with:", {
      url,
      apiKey: CIELO_API_KEY ? "Present" : "Missing",
      walletAddress,
      chain,
      timeframe,
    });

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-KEY": CIELO_API_KEY!,
      },
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error("Failed to fetch wallet stats:", {
        status: response.status,
        statusText: response.statusText,
        url,
        errorResponse,
      });
      return null;
    }

    const data: TotalStatsResponse = await response.json();
    console.log("Wallet stats response:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    return null;
  }
}

export async function getTokenPnL(
  walletAddress: string,
  tokenAddress: string,
  chain?: string,
  timeframe: "1d" | "7d" | "30d" | "max" = "max",
): Promise<TokenPnL | null> {
  try {
    const params = new URLSearchParams({
      timeframe,
      token: tokenAddress,
      ...(chain && { chains: chain }),
    });

    const url = `${CIELO_API_BASE}/${walletAddress}/pnl/tokens?${params}`;
    console.log("Fetching token PnL:", url);

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-KEY": CIELO_API_KEY!,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch token PnL:", {
        status: response.status,
        statusText: response.statusText,
        url,
        responseText: await response.text(),
      });
      return null;
    }

    const data: TokenPnLResponse = await response.json();
    console.log("Token PnL response:", data);
    return data.data.items[0] || null;
  } catch (error) {
    console.error("Error fetching token PnL:", error);
    return null;
  }
}
