"use client";

import { useTheme } from "next-themes";
import { ClientOnly } from "./ClientOnly/ClientOnly";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";

const uniswapChainMap = {
  1: "ethereum",
  8453: "base",
} as const;

type UniswapWidgetProps = {
  chainId: number;
  toTokenAddress: string | undefined;
  fromTokenAddress: string | undefined;
  className?: string;
};

export function UniswapWidgetInner(props: UniswapWidgetProps) {
  const { theme: _theme } = useTheme();
  const theme = _theme === "dark" ? "dark" : "light";

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
    <iframe
      title="Uniswap"
      src={`https://app.uniswap.org/#/swap?${queryParams.toString()}`}
      className={cn(
        "rounded-lg w-full sm:max-w-[450px] h-[600px] mx-auto block border overflow-hidden",
        props.className,
      )}
    />
  );
}

export function UniswapWidget(props: UniswapWidgetProps) {
  return (
    <ClientOnly
      ssr={<Skeleton className="h-[600px] w-full sm:max-w-[450px] mx-auto" />}
    >
      <UniswapWidgetInner {...props} />
    </ClientOnly>
  );
}
