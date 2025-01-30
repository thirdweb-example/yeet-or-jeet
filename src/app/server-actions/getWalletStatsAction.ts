"use server";

import { getWalletStats } from "../../lib/helpers/cielo";

export async function getWalletStatsAction(
  walletAddress: string,
  chain: string,
  timeFrame: "1d" | "7d" | "30d" | "max" = "max",
) {
  return getWalletStats(walletAddress, chain, timeFrame);
}
