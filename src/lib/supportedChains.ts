import type { Chain } from "thirdweb";

const berachain: Chain = {
  id: 80094,
  rpc: "https://80094.rpc.thirdweb.com/",
  nativeCurrency: {
    name: "BERA",
    symbol: "BERA",
    decimals: 18,
  },
  name: "Berachain",
  blockExplorers: [
    {
      name: "Berascan",
      url: "https://berascan.com"
    },
  ],
};

export const supportedChains: Chain[] = [berachain];
export const defaultSelectedChain = berachain;
