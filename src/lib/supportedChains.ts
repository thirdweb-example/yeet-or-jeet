import type { Chain } from "thirdweb";
import { ethereum } from "thirdweb/chains";

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

export const supportedChains: Chain[] = [berachain, ethereum];
export const defaultSelectedChain = berachain;
