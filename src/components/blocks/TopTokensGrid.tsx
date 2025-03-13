import { useQuery } from "@tanstack/react-query";
import { getTopTokens, TopToken } from "@/lib/geckoterminal";
import { TokenIcon, TokenProvider } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  CopyIcon, 
  CheckIcon,
  TwitterIcon,
  GlobeIcon,
  MessageCircleIcon,
  DropletIcon,
  AlertCircleIcon
} from "lucide-react";
import { supportedChains } from "@/lib/supportedChains";
import { useState } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const berachain = supportedChains.find((chain) => chain.id === 80094)!;

export function TopTokensGrid({ onTokenSelect }: { onTokenSelect: (address: string) => void }) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const topTokensQuery = useQuery({
    queryKey: ["topTokens"],
    queryFn: async () => getTopTokens(),
    retry: 3, // Retry 3 times if the API call fails
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
  });

  const handleCopy = async (address: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent token selection when copying
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleSocialLink = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation(); // Prevent token selection when clicking social links
    if (!url) return;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleImageError = (address: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(address);
      return newSet;
    });
  };

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
      <div className="text-destructive p-8 border border-destructive/20 bg-destructive/10 rounded-xl flex flex-col items-center justify-center text-center">
        <AlertCircleIcon className="size-12 mb-4 opacity-80" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Tokens</h3>
        <p className="mb-4">
          {topTokensQuery.error instanceof Error 
            ? topTokensQuery.error.message 
            : "Failed to load token data from the API"}
        </p>
        <Button 
          variant="outline" 
          onClick={() => topTokensQuery.refetch()}
          className="border-destructive/30 hover:border-destructive/50"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Handle case where no tokens are found
  if (!topTokensQuery.data || topTokensQuery.data.length === 0) {
    return (
      <div className="text-muted-foreground p-8 border border-border bg-card/50 rounded-xl flex flex-col items-center justify-center text-center">
        <AlertCircleIcon className="size-12 mb-4 opacity-60" />
        <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
        <p className="mb-4">
          We couldn&apos;t find any non-stablecoin tokens with trading volume above $100K.
          <br />
          This could be due to API limitations or network issues.
        </p>
        <Button 
          variant="outline" 
          onClick={() => topTokensQuery.refetch()}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topTokensQuery.data.map((token: TopToken) => (
        <TokenProvider
          key={token.address}
          address={token.address}
          client={thirdwebClient}
          chain={berachain}
        >
          <div className="relative group">
            <button
              onClick={() => onTokenSelect(token.address)}
              className="w-full text-left bg-card border rounded-xl p-6 hover:border-active-border transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {token.image_url && !failedImages.has(token.address) ? (
                  <div className="relative size-12 rounded-full overflow-hidden ring-2 ring-background">
                    <Image 
                      src={token.image_url} 
                      alt={token.name} 
                      fill 
                      className="object-cover"
                      onError={() => handleImageError(token.address)}
                      unoptimized // Skip Next.js image optimization for external URLs
                    />
                  </div>
                ) : (
                  <TokenIcon
                    className="size-12 rounded-full ring-2 ring-background"
                    fallbackComponent={
                      <div className="size-12 rounded-full from-blue-800 to-blue-500 bg-gradient-to-br ring-2 ring-background flex items-center justify-center text-white font-bold">
                        {token.symbol?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                    }
                    loadingComponent={<Skeleton className="size-12 rounded-full" />}
                  />
                )}
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
                    <span>Vol: ${Math.round(token.volume_24h).toLocaleString()}</span>
                    <span>MC: ${Math.round(token.market_cap_usd).toLocaleString()}</span>
                  </div>
                  
                  {/* Additional DexScreener data - Liquidity */}
                  {token.liquidity_usd && (
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <DropletIcon className="size-3 mr-1" />
                      <span>Liquidity: ${Math.round(token.liquidity_usd).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Social links */}
                  {(token.twitter_handle || token.websites?.length || token.telegram_handle || token.trust_score) && (
                    <div className="flex items-center mt-3 pt-2 border-t border-border">
                      <div className="flex gap-2 flex-1">
                        {token.twitter_handle && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-7 rounded-full" 
                                  onClick={(e) => handleSocialLink(e, `https://twitter.com/${token.twitter_handle}`)}
                                >
                                  <TwitterIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Twitter</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {token.websites && token.websites.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-7 rounded-full" 
                                  onClick={(e) => handleSocialLink(e, token.websites?.[0])}
                                >
                                  <GlobeIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Website</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {token.telegram_handle && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-7 rounded-full" 
                                  onClick={(e) => handleSocialLink(e, `https://t.me/${token.telegram_handle}`)}
                                >
                                  <MessageCircleIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Telegram</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      
                      {token.trust_score !== undefined && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                token.trust_score >= 70 ? "bg-green-100 text-green-800" :
                                token.trust_score >= 40 ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              )}>
                                Trust: {token.trust_score}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Trust Score</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Token description tooltip */}
              {token.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-3 text-xs text-muted-foreground line-clamp-2 cursor-help">
                        {token.description}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{token.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleCopy(token.address, e)}
            >
              {copiedAddress === token.address ? (
                <CheckIcon className="size-4 text-green-500" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </Button>
          </div>
        </TokenProvider>
      ))}
    </div>
  );
} 