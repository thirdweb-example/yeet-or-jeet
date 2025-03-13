"use client";

import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./Loading";
import { useState } from "react";

const uniswapChainMap = {
  1: "ethereum",
  137: "polygon",
  42161: "arbitrum",
  10: "optimism",
  8453: "base",
  80094: "berachain",
  43114: "avalanche",
  56: "bsc",
  81457: "blast",
  42220: "celo",
  324: "zksync",
} as const;

type UniswapWidgetProps = {
  chainId: number;
  toTokenAddress: string | undefined;
  fromTokenAddress: string | undefined;
  className?: string;
};

export function UniswapWidget(props: UniswapWidgetProps) {
  const { theme: _theme } = useTheme();
  const theme = _theme === "dark" ? "dark" : "light";
  const [isLoaded, setIsLoaded] = useState(false);

  if (!(props.chainId in uniswapChainMap)) {
    console.error(`UniswapWidget: Unsupported chainId ${props.chainId}`);
    return null;
  }

  const chainId = props.chainId as keyof typeof uniswapChainMap;

  const queryParams = new URLSearchParams({
    theme,
    chain: uniswapChainMap[chainId],
    exactField: "input",
  });

  if (props.toTokenAddress) {
    queryParams.set("outputCurrency", props.toTokenAddress);
  }

  if (props.fromTokenAddress) {
    queryParams.set("inputCurrency", props.fromTokenAddress);
  }

  return (
    <div className="relative">
      {!isLoaded && <LoadingIframe className="absolute inset-0" />}
      <iframe
        onLoad={() => setIsLoaded(true)}
        title="Uniswap"
        src={`https://app.uniswap.org/#/swap?${queryParams.toString()}`}
        className={cn(
          "w-full h-[600px] block overflow-hidden border-none",
          props.className,
          !isLoaded && "invisible",
        )}
      />
    </div>
  );
}

function LoadingIframe(props: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-[600px] w-full flex items-center justify-center",
        props.className,
      )}
    >
      <LoadingSpinner className="size-10" />
    </div>
  );
}
