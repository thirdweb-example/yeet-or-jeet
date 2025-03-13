"use client";

import { useEffect } from "react";
import { useReadContract } from "thirdweb/react";
import type { Chain } from "thirdweb";
import { getContract } from "thirdweb";
import { thirdwebClient } from "../../lib/thirdweb-client";

type WalletBalancesProps = {
  walletAddress: string;
  tokenAddress: string;
  chain: Chain;
  onBalancesChange: (nativeBalance: string, tokenBalance: string) => void;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Simple utility to format wei to ether
function formatUnits(value: bigint | string, decimals: number | unknown): string {
  const valueStr = value.toString();
  const decimalCount = typeof decimals === 'number' ? decimals : 18;
  if (decimalCount === 0) return valueStr;
  const padding = "0".repeat(decimalCount);
  const paddedValue = valueStr + padding;
  const len = paddedValue.length;
  return (
    paddedValue.slice(0, len - decimalCount) +
    "." +
    paddedValue.slice(len - decimalCount)
  );
}

export function WalletBalances({ walletAddress, tokenAddress, chain, onBalancesChange }: WalletBalancesProps) {
  // Get native balance using zero address contract
  const { data: nativeBalance } = useReadContract({
    contract: getContract({
      client: thirdwebClient,
      address: ZERO_ADDRESS,
      chain,
    }),
    method: "eth_getBalance",
    params: [walletAddress],
  });

  // Get token balance and decimals using ERC20 contract
  const tokenContract = getContract({
    client: thirdwebClient,
    address: tokenAddress,
    chain,
  });

  const { data: tokenBalance } = useReadContract({
    contract: tokenContract,
    method: "balanceOf",
    params: [walletAddress],
  });

  const { data: tokenDecimals } = useReadContract({
    contract: tokenContract,
    method: "decimals",
    params: [],
  });

  // Update parent when balances change
  useEffect(() => {
    if (nativeBalance && tokenBalance && tokenDecimals) {
      // Format balances to human readable form
      const formattedNativeBalance = formatUnits(nativeBalance.toString(), 18); // Native tokens always have 18 decimals
      const formattedTokenBalance = formatUnits(tokenBalance.toString(), tokenDecimals);

      onBalancesChange(
        parseFloat(formattedNativeBalance).toFixed(4),
        parseFloat(formattedTokenBalance).toFixed(4)
      );
    }
  }, [nativeBalance, tokenBalance, tokenDecimals, onBalancesChange]);

  return null; // This is a data-only component
} 