# Yeet or Jeet

A DeFi trading assistant powered by AI that helps you make informed decisions about when to buy (Yeet) or sell (Jeet) tokens on Berachain.

## Features

- **Real-time Price Data**: Integrated with OogaBooga's Price API for accurate and up-to-date token information
  - Current price
  - 24h price changes
  - Trading volume
  - Market capitalization

- **Smart Swap Integration**: Leveraging OogaBooga's Swap API for efficient token swaps
  - Best price routing
  - Price impact calculation
  - Gas estimation
  - Slippage protection (0.5% default)

## Technical Integration

### OogaBooga APIs

The application integrates with two primary OogaBooga APIs:

1. **Price API**
   ```typescript
   GET https://api.oogabooga.io/v1/price/${chainId}/${tokenAddress}
   ```
   Provides real-time price data and market statistics for tokens on Berachain.

2. **Swap API**
   ```typescript
   POST https://api.oogabooga.io/v1/swap/${chainId}
   ```
   Handles token swaps with the following features:
   - Optimal routing through OBRouter
   - Path definition generation
   - Executor contract interaction

### Smart Contract Interaction

The application interacts with OogaBooga's smart contracts using:
- OBRouter for swap execution
- Dynamic executor contracts for optimal routing
- Wagmi v2 for blockchain interactions

## Supported Networks

Currently supporting:
- Berachain (Chain ID: 80094)

Please note that this application is a conceptual prototype and not a fully operational product. The application provided is for educational purposes only and should not be considered financial advice.
