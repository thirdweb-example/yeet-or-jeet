"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supportedChains } from "@/lib/supportedChains";
import { Network } from "lucide-react";

interface ChainSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
}

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  const selectedChain = supportedChains.find((chain) => chain.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-[50px] rounded-lg px-3 w-auto bg-card flex items-center gap-2"
        >
          <Network className="size-5" />
          {selectedChain ? (
            <span className="text-sm font-medium">{selectedChain.name}</span>
          ) : (
            <span className="sr-only">Select chain</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedChains.map((chain) => (
          <DropdownMenuItem key={chain.id} onClick={() => onChange?.(chain.id)}>
            {chain.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
