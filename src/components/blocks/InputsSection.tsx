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
          "bg-card border rounded-lg p-4 flex gap-4 items-center relative",
          explorerLink && "hover:border-active-border",
        )}
      >
        {/* Left */}
        <TokenIcon
          className="size-10 rounded-full"
          fallbackComponent={
            <div className="size-10 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br" />
          }
          loadingComponent={<Skeleton className="size-10 rounded-full" />}
        />

        {/* right */}
        <div className="flex flex-col gap-1 grow text-sm">
          {/* Row 1 */}
          <div
            className={cn(
              "gap-2 flex items-center justify-between font-semibold",
            )}
          >
            <h3 className="truncate">
              {explorerLink ? (
                <Link
                  href={explorerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="before:absolute before:inset-0"
                >
                  {tokenName}
                </Link>
              ) : (
                tokenName
              )}
            </h3>
            <p>${props.priceUSD}</p>
          </div>

          {/* Row 2 */}
          <div className="gap-3 flex items-center text-xs text-muted-foreground">
            <p>Market Cap: ${props.marketCapUSD}</p>
            <p>Volume: ${props.volumeUSD}</p>
          </div>
        </div>
      </div>
    </TokenProvider>
  );
}

const chainMap: Record<number, string> = {
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  42161: "arbitrum",
  10: "optimism",
  8453: "base",
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
          "bg-card border rounded-lg p-4 flex gap-4 items-center relative",
          explorerLink && "hover:border-active-border",
        )}
      >
        {/* Left */}
        <AccountAvatar
          className="size-10 rounded-full"
          fallbackComponent={
            <div className="size-10 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br" />
          }
          loadingComponent={<Skeleton className="size-10 rounded-full" />}
        />

        {/* right */}
        <div className="flex flex-col gap-1 grow text-sm">
          {/* Row 1 */}
          <div
            className={cn(
              "gap-2 flex items-center justify-between font-semibold",
            )}
          >
            <h3 className="truncate">
              {explorerLink ? (
                <Link
                  href={explorerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="before:absolute before:inset-0"
                >
                  {displayName}
                </Link>
              ) : (
                displayName
              )}{" "}
            </h3>
            <p>{props.balanceUSD}</p>
          </div>

          {/* Row 2 */}
          <div className="gap-3 flex items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              Win rate:{" "}
              {walletStatsQuery.data ? (
                `${walletStatsQuery.data.winrate}%`
              ) : (
                <Skeleton className="h-3 w-10 inline-block" />
              )}
            </div>
            <div className="flex items-center gap-2">
              P&L:{" "}
              {walletStatsQuery.data ? (
                `${walletStatsQuery.data.combined_pnl_usd.toLocaleString(
                  "en-US",
                  {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}`
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
    <section>
      <h3 className="text-lg font-semibold tracking-tight mb-3">Inputs</h3>
      <div className="flex flex-col ">
        <div className="flex flex-col lg:flex-row gap-4 lg:[&>*]:min-w-[400px]">
          <TokenInfoCard {...props.tokenInfo} />
          <WalletInfoCard {...props.walletInfo} />
        </div>
      </div>
    </section>
  );
}
