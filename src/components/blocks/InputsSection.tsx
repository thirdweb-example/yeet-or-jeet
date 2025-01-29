import type { Chain } from "thirdweb";
import { Img } from "../ui/Img";
import Link from "next/link";
import { cn } from "../../lib/utils";

type TokenInfo = {
  name: string;
  address: string;
  priceUSD: string;
  marketCapUSD: string;
  volumeUSD: string;
  tokenIcon: string;
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
            )}{" "}
            ({shortenAddress(props.address)})
          </h3>
          <p> {props.priceUSD}</p>
        </div>

        {/* Row 2 */}
        <div className="gap-3 flex items-center text-xs text-muted-foreground">
          <p> MC: {props.marketCapUSD}</p>
          <p> Vol: {props.volumeUSD}</p>
        </div>
      </div>
    </div>
  );
}

type WalletInfo = {
  name: string | undefined;
  address: string;
  balanceUSD: string;
  winRate: string;
  realizedPnL: string;
  ensImage: string;
  chain: Chain;
};

export function WalletInfoCard(props: WalletInfo) {
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
          <p> {props.balanceUSD}</p>
        </div>

        {/* Row 2 */}
        <div className="gap-3 flex items-center text-xs text-muted-foreground">
          <p> Win rate: {props.winRate}</p>
          <p> Realized P&L: {props.realizedPnL}</p>
        </div>
      </div>
    </div>
  );
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...`;
}

export function InputsSection(props: {
  tokenInfo: TokenInfo;
  walletInfo: WalletInfo;
}) {
  return (
    <section>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-3">Inputs</h2>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 lg:[&>*]:min-w-[400px]">
        <TokenInfoCard {...props.tokenInfo} />
        <WalletInfoCard {...props.walletInfo} />
      </div>
    </section>
  );
}
