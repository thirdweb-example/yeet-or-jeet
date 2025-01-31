"use client";

import thumbsDownGif from "./assets/thumbsdown.gif";
import thumbsUpGif from "./assets/thumbsup.gif";
import thumbsMidGif from "./assets/thumbsmid.gif";
import Image from "next/image";
import { cn } from "../../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UniswapWidget } from "../UniswapWidget";
import { Button } from "../../ui/button";

const variantImageMap = {
  buy: thumbsUpGif,
  sell: thumbsDownGif,
  hold: thumbsMidGif,
};

export function TradeSummarySection(props: {
  variant: "sell" | "buy" | "hold";
  title: string;
  description: string;
  chainId: number;
  tokenAddress: string;
}) {
  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold tracking-tight mb-3">Answer</h3>
      <div className="flex gap-4">
        <Image
          src={variantImageMap[props.variant]}
          className="size-20 lg:size-24 aspect-square rounded-lg border"
          alt=""
        />
        <div className={cn("flex flex-col gap-3 grow")}>
          <h3
            className={cn(
              "text-2xl lg:text-4xl font-bold px-2 lg:px-4 rounded-lg py-1 lg:py-2 tracking-tight inline-flex w-fit",
              props.variant === "sell" &&
                "bg-red-100 dark:bg-red-950 text-red-950 dark:text-red-200",
              props.variant === "buy" &&
                "bg-green-100 dark:bg-green-950 text-green-950 dark:text-green-200",
              props.variant === "hold" &&
                "bg-yellow-100 dark:bg-yellow-950 text-yellow-950 dark:text-yellow-200",
            )}
          >
            {props.title}
          </h3>
          <div className="flex items-center gap-4">
            <p className="text-xl lg:text-2xl">{props.description}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-lg">
                  Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="!p-0 max-w-[420px] overflow-hidden gap-0">
                <DialogHeader className="border-b">
                  <DialogTitle className="px-6 py-4">Trade</DialogTitle>
                </DialogHeader>
                {props.variant === "buy" || props.variant === "sell" ? (
                  <UniswapWidget
                    chainId={props.chainId}
                    toTokenAddress={
                      props.variant === "buy" ? props.tokenAddress : undefined
                    }
                    fromTokenAddress={
                      props.variant === "sell" ? props.tokenAddress : undefined
                    }
                  />
                ) : (
                  // If AI doesn't have a clear verdict - prefill the token for "buying"
                  <UniswapWidget
                    chainId={props.chainId}
                    toTokenAddress="0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf"
                    fromTokenAddress={props.tokenAddress}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
