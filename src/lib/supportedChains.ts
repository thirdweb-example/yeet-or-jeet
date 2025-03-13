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
  icon: {
    url: "https://raw.githubusercontent.com/berachain/assets/main/brand/bera-logo-dark.svg",
    width: 128,
    height: 128,
    format: "svg",
  },
  blockExplorers: [
    {
      name: "Berascan",
      url: "https://berascan.com"
    },
  ],
};

/* 
const ethereum: Chain = {
  id: 1,
  rpc: "https://eth.llamarpc.com",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Ethereum",
  blockExplorers: [
    {
      name: "Etherscan",
      url: "https://etherscan.io"
    },
  ],
};

const polygon: Chain = {
  id: 137,
  rpc: "https://polygon-rpc.com",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  name: "Polygon",
  blockExplorers: [
    {
      name: "PolygonScan",
      url: "https://polygonscan.com"
    },
  ],
};

const arbitrum: Chain = {
  id: 42161,
  rpc: "https://arb1.arbitrum.io/rpc",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Arbitrum",
  blockExplorers: [
    {
      name: "Arbiscan",
      url: "https://arbiscan.io"
    },
  ],
};

const optimism: Chain = {
  id: 10,
  rpc: "https://mainnet.optimism.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Optimism",
  blockExplorers: [
    {
      name: "Optimistic Etherscan",
      url: "https://optimistic.etherscan.io"
    },
  ],
};

const base: Chain = {
  id: 8453,
  rpc: "https://mainnet.base.org",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Base",
  blockExplorers: [
    {
      name: "BaseScan",
      url: "https://basescan.org"
    },
  ],
};

const avalanche: Chain = {
  id: 43114,
  rpc: "https://api.avax.network/ext/bc/C/rpc",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  name: "Avalanche",
  blockExplorers: [
    {
      name: "Snowtrace",
      url: "https://snowtrace.io"
    },
  ],
};

const bnb: Chain = {
  id: 56,
  rpc: "https://bsc-dataseed.binance.org",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  name: "BNB Smart Chain",
  blockExplorers: [
    {
      name: "BscScan",
      url: "https://bscscan.com"
    },
  ],
};

const blast: Chain = {
  id: 81457,
  rpc: "https://blast.blockpi.network/v1/rpc/public",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Blast",
  blockExplorers: [
    {
      name: "Blastscan",
      url: "https://blastscan.io"
    },
  ],
};

const celo: Chain = {
  id: 42220,
  rpc: "https://forno.celo.org",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  name: "Celo",
  blockExplorers: [
    {
      name: "CeloScan",
      url: "https://celoscan.io"
    },
  ],
};

const zksync: Chain = {
  id: 324,
  rpc: "https://mainnet.era.zksync.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  name: "zkSync",
  blockExplorers: [
    {
      name: "zkScan",
      url: "https://explorer.zksync.io"
    },
  ],
};
*/

export const supportedChains: Chain[] = [
  berachain,
  /* ethereum,
  polygon,
  arbitrum,
  optimism,
  base,
  avalanche,
  bnb,
  blast,
  celo,
  zksync, */
];
export const defaultSelectedChain = berachain;
