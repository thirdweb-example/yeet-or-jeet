import type { Chain } from "thirdweb";
import { berachain, ethereum } from "thirdweb/chains";

export const supportedChains: Chain[] = [berachain, ethereum];
export const defaultSelectedChain = berachain;
