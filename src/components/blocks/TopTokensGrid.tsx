import { useQuery } from "@tanstack/react-query";
import { getTopTokens } from "@/lib/geckoterminal";
import { TokenIcon, TokenProvider } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { supportedChains } from "@/lib/supportedChains";

const berachain = supportedChains.find((chain) => chain.id === 80094)!;

export function TopTokensGrid({ onTokenSelect }: { onTokenSelect: (address: string) => void }) {
  const topTokensQuery = useQuery({
    queryKey: ["topTokens"],
    queryFn: getTopTokens,
  });

  if (topTokensQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (topTokensQuery.isError) {
    return (
      <div className="text-destructive">
        Error loading top tokens: {topTokensQuery.error instanceof Error ? topTokensQuery.error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topTokensQuery.data?.map((token) => (
        <TokenProvider
          key={token.address}
          address={token.address}
          client={thirdwebClient}
          chain={berachain}
        >
          <button
            onClick={() => onTokenSelect(token.address)}
            className="w-full text-left bg-card border rounded-xl p-6 hover:border-active-border transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <TokenIcon
                className="size-12 rounded-full ring-2 ring-background"
                fallbackComponent={
                  <div className="size-12 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br ring-2 ring-background" />
                }
                loadingComponent={<Skeleton className="size-12 rounded-full" />}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{token.name}</h3>
                  <span className="font-medium">${Number(token.price_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">{token.symbol}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {token.price_change_24h >= 0 ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )}
                    {Math.abs(token.price_change_24h).toFixed(2)}%
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Vol: ${token.volume_24h.toLocaleString()}</span>
                  <span>MC: ${token.market_cap_usd.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </button>
        </TokenProvider>
      ))}
    </div>
  );
} 