import type { Chain } from "thirdweb";
import { Img } from "../ui/Img";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";
import { getWalletStats } from "../../lib/helpers/cielo";

type TokenInfo = {
  name: string;
  address: string;
  priceUSD: string;
  marketCapUSD: string;
  volumeUSD: string;
  tokenIcon: string;
  chain: Chain;
};

type WalletInfo = {
  name: string | undefined;
  address: string;
  balanceUSD: string;
  winRate: string;
  realizedPnL: string;
  ensImage: string;
  chain: Chain;
};

export function TokenInfoCard(props: TokenInfo) {
  const explorer = props.chain.blockExplorers?.[0].url;
  const explorerLink = explorer
    ? `${explorer}/token/${props.address}`
    : undefined;
  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 flex gap-4 items-center relative",
        explorerLink && "hover:border-active-border",
      )}
    >
      {/* Left */}
      <Img
        src={props.tokenIcon}
        className="size-10 rounded-full"
        fallback={
          <div className="size-10 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br" />
        }
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
                {props.name}
              </Link>
            ) : (
              props.name
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
  );
}

export function WalletInfoCard(props: WalletInfo) {
  const [walletStats, setWalletStats] = useState<{
    winrate: number;
    combined_pnl_usd: number;
  } | null>(null);

  useEffect(() => {
    async function fetchWalletStats() {
      if (!props.address) return;

      // Convert chain ID to chain name
      const chainMap: Record<number, string> = {
        1: "ethereum",
        137: "polygon",
        56: "bsc",
        42161: "arbitrum",
        10: "optimism",
        8453: "base",
      };

      console.log("Chain conversion:", {
        chainId: props.chain.id,
        chainName: chainMap[props.chain.id || 1] || "ethereum",
      });

      const stats = await getWalletStats(
        props.address,
        chainMap[props.chain.id || 1] || "ethereum",
      );
      if (stats) {
        setWalletStats({
          winrate: stats.winrate,
          combined_pnl_usd: stats.combined_pnl_usd,
        });
      }
    }

    fetchWalletStats();
  }, [props.address, props.chain.id]);

  const explorer = props.chain.blockExplorers?.[0].url;
  const explorerLink = explorer
    ? `${explorer}/address/${props.address}`
    : undefined;

  const displayName = props.name || props.address;
  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 flex gap-4 items-center relative",
        explorerLink && "hover:border-active-border",
      )}
    >
      {/* Left */}
      <Img
        src={props.ensImage}
        className="size-10 rounded-full"
        fallback={
          <div className="size-10 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br" />
        }
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
            {props.name && <>({shortenAddress(props.address)})</>}
          </h3>
          <p>{props.balanceUSD}</p>
        </div>

        {/* Row 2 */}
        <div className="gap-3 flex items-center text-xs text-muted-foreground">
          <p>
            Win rate: {walletStats ? `${walletStats.winrate}%` : props.winRate}
          </p>
          <p>
            P&L:{" "}
            {walletStats
              ? `$${walletStats.combined_pnl_usd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : props.realizedPnL}
          </p>
        </div>
      </div>
    </div>
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
