"use client";

import thumbsDownGif from "./assets/thumbsdown.gif";
import thumbsUpGif from "./assets/thumbsup.gif";
import thumbsMidGif from "./assets/thumbsmid.gif";
import Image from "next/image";
import { cn } from "../../../lib/utils";
import { ExecuteTransaction } from "../ExecuteTransaction";

const variantImageMap = {
  buy: thumbsUpGif,
  sell: thumbsDownGif,
  hold: thumbsMidGif,
};

export type NebulaTxData = {
  chainId: number;
  data: `0x${string}`;
  to: string;
  value: string;
};

export function TradeSummarySection(props: {
  variant: "sell" | "buy" | "hold";
  title: string;
  description: string;
  actions: Array<{
    label: string;
    txData: NebulaTxData;
  }>;
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
          <div
          className={cn(
            "flex flex-col gap-2 grow",
            props.actions && props.actions.length > 0 && "gap-3",
          )}
        >
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
          <div className="flex items-center gap-5">
            <p className="text-xl lg:text-2xl">{props.description}</p>
            {props.actions && props.actions.length > 0 && (
              <div className="flex items-center gap-2">
                {props.actions.map((action) => {
                  return (
                    <ExecuteTransaction
                      label={action.label}
                      key={action.label}
                      txData={action.txData}
                      className="!px-3.5 w-fit !min-w-0 !py-2.5 !rounded-lg font-semibold"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
  );
}
