import type { Chain } from "thirdweb";
import { base, ethereum } from "thirdweb/chains";

export const supportedChains: Chain[] = [base, ethereum];
export const defaultSelectedChain = base;
