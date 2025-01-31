"use client";

import { useTheme } from "next-themes";
import { ClientOnly } from "./ClientOnly/ClientOnly";
import { Skeleton } from "../ui/skeleton";

const uniswapChainMap = {
  1: "ethereum",
  8453: "base",
} as const;

type UniswapWidgetProps = {
  chainId: number;
  toTokenAddress: string;
};

export function UniswapWidgetInner(props: UniswapWidgetProps) {
  const { theme: _theme } = useTheme();
  const theme = _theme === "dark" ? "dark" : "light";

  if (!(props.chainId in uniswapChainMap)) {
    console.error(`UniswapWidget: Unsupported chainId ${props.chainId}`);
    return null;
  }

  const chainId = props.chainId as keyof typeof uniswapChainMap;

  return (
    <iframe
      title="Uniswap"
      src={`https://app.uniswap.org/#/swap?theme=${theme}&chain=${uniswapChainMap[chainId]}&exactField=input&outputCurrency=${props.toTokenAddress}`}
      height="660px"
      className="rounded-lg w-full lg:max-w-[450px] mx-auto border-none block shadow border"
    />
  );
}

export function UniswapWidget(props: UniswapWidgetProps) {
  return (
    <ClientOnly
      ssr={<Skeleton className="h-[660px] w-full lg:max-w-[450px] mx-auto" />}
    >
      <UniswapWidgetInner {...props} />
    </ClientOnly>
  );
}
