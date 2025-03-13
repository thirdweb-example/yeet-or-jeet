import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const CIELO_API_KEY = process.env.CIELO_API_KEY;
const CIELO_API_BASE = "https://feed-api.cielo.finance/api/v1";

async function getWalletStats(walletAddress, chain) {
  if (!CIELO_API_KEY) {
    console.warn("CIELO_API_KEY is not set. Skipping wallet stats fetch.");
    return null;
  }

  try {
    const params = new URLSearchParams({
      timeframe: 'max',
      ...(chain && { chains: chain }),
    });

    const url = `${CIELO_API_BASE}/${walletAddress}/pnl/total-stats?${params}`;
    console.log("Attempting to fetch wallet stats with:", {
      url,
      apiKey: CIELO_API_KEY ? "Present" : "Missing",
      walletAddress,
      chain,
    });

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-KEY": CIELO_API_KEY,
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

    const data = await response.json();
    console.log("Wallet stats response:", data);
    return data.data;
  } catch (error) {
    console.error("Error fetching wallet stats:", error);
    return null;
  }
}

// Test with a sample wallet
const testWallet = '0x77CAacb4d8D84C68FB8e33baDADFde8a26AA6d25'; // Test wallet
getWalletStats(testWallet, 'berachain')
  .then(stats => {
    if (stats) {
      console.log('Success! Wallet stats:', stats);
    } else {
      console.log('No stats found or error occurred');
    }
  })
  .catch(error => console.error('Test failed:', error)); 