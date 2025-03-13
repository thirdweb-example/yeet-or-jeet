import type { Chain } from "thirdweb";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getWalletStatsAction } from "../../app/server-actions/getWalletStatsAction";
import {
  AccountAvatar,
  AccountName,
  AccountProvider,
  TokenIcon,
  TokenName,
  TokenProvider,
} from "thirdweb/react";
import { thirdwebClient } from "../../lib/thirdweb-client";
import { Skeleton } from "../ui/skeleton";

type TokenInfo = {
  address: string;
  priceUSD: string;
  marketCapUSD: string;
  volumeUSD: string;
  chain: Chain;
};

type WalletInfo = {
  address: string;
  balanceUSD: string;
  chain: Chain;
};

export function TokenInfoCard(props: TokenInfo) {
  const explorer = props.chain.blockExplorers?.[0].url;
  const explorerLink = explorer
    ? `${explorer}/token/${props.address}`
    : undefined;

  const tokenName = (
    <TokenName loadingComponent={<Skeleton className="h-4 w-[100px]" />} />
  );

  return (
    <TokenProvider
      address={props.address}
      client={thirdwebClient}
      chain={props.chain}
    >
      <div
        className={cn(
          "bg-card border rounded-xl p-6 flex gap-6 items-center relative hover:border-active-border transition-all duration-200 hover:shadow-md",
          explorerLink && "cursor-pointer",
        )}
      >
        {/* Left */}
        <TokenIcon
          className="size-16 rounded-full ring-2 ring-background shadow-lg"
          fallbackComponent={
            <div className="size-16 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br ring-2 ring-background shadow-lg" />
          }
          loadingComponent={<Skeleton className="size-16 rounded-full" />}
        />

        {/* right */}
        <div className="flex flex-col gap-3 grow">
          {/* Row 1 - Token Name and Price */}
          <div className="flex items-center justify-between">
            <h3 className="truncate font-semibold text-lg">
              {explorerLink ? (
                <Link
                  href={explorerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="before:absolute before:inset-0 hover:text-primary transition-colors"
                >
                  {tokenName}
                </Link>
              ) : (
                tokenName
              )}
            </h3>
            <p className="font-bold text-xl text-primary">${props.priceUSD}</p>
          </div>

          {/* Row 2 - Market Cap and Volume */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">${props.marketCapUSD}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">24h Volume</p>
              <p className="text-sm font-semibold">${props.volumeUSD}</p>
            </div>
          </div>
        </div>
      </div>
    </TokenProvider>
  );
}

const chainMap: Record<number, string> = {
  // 1: "ethereum",
  // 137: "polygon",
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

export function WalletInfoCard(props: WalletInfo) {
  const walletStatsQuery = useQuery({
    queryKey: ["walletStats", props.address, props.chain.id],
    queryFn: async () => {
      return getWalletStatsAction(
        props.address,
        chainMap[props.chain.id || 1] || "ethereum",
      );
    },
    retry: false,
  });

  const explorer = props.chain.blockExplorers?.[0].url;
  const explorerLink = explorer
    ? `${explorer}/address/${props.address}`
    : undefined;

  const displayName = (
    <AccountName
      fallbackComponent={<span>{shortenAddress(props.address)}</span>}
      loadingComponent={<Skeleton className="h-4 w-[100px]" />}
    />
  );

  return (
    <AccountProvider address={props.address} client={thirdwebClient}>
      <div
        className={cn(
          "bg-card border rounded-lg p-4 flex gap-4 items-center relative hover:border-active-border transition-colors",
          explorerLink && "cursor-pointer",
        )}
      >
        {/* Left */}
        <AccountAvatar
          className="size-12 rounded-full ring-2 ring-background"
          fallbackComponent={
            <div className="size-12 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br ring-2 ring-background" />
          }
          loadingComponent={<Skeleton className="size-12 rounded-full" />}
        />

        {/* right */}
        <div className="flex flex-col gap-2 grow text-sm">
          {/* Row 1 */}
          <div className="flex items-center justify-between">
            <h3 className="truncate font-semibold text-base">
              {explorerLink ? (
                <Link
                  href={explorerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="before:absolute before:inset-0 hover:text-primary transition-colors"
                >
                  {displayName}
                </Link>
              ) : (
                displayName
              )}
            </h3>
            <p className="font-medium text-base">{props.balanceUSD}</p>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">Win Rate:</span>
              {walletStatsQuery.data ? (
                <span className={walletStatsQuery.data.winrate >= 50 ? "text-green-500" : "text-red-500"}>
                  {walletStatsQuery.data.winrate}%
                </span>
              ) : (
                <Skeleton className="h-3 w-10 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">P&L:</span>
              {walletStatsQuery.data ? (
                <span className={walletStatsQuery.data.combined_pnl_usd >= 0 ? "text-green-500" : "text-red-500"}>
                  {walletStatsQuery.data.combined_pnl_usd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <Skeleton className="h-3 w-10 inline-block" />
              )}
            </div>
          </div>
        </div>
      </div>
    </AccountProvider>
  );
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function InputsSection(props: {
  tokenInfo: TokenInfo;
  walletInfo: WalletInfo;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Inputs</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TokenInfoCard {...props.tokenInfo} />
        <WalletInfoCard {...props.walletInfo} />
      </div>
    </section>
  );
}
