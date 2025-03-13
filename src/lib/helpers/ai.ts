import Anthropic from "@anthropic-ai/sdk";
import type { StartingData } from "./info";
import { getWalletStats, getTokenPnL } from "./cielo";

const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
if (!perplexityApiKey) {
  throw new Error("Missing PERPLEXITY_API_KEY");
}
if (!anthropicApiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY");
}
if (!thirdwebSecretKey) {
  throw new Error("Missing THIRDWEB_SECRET_KEY");
}
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export async function askClaude(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4096,
      system: systemPrompt || "",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return "";
  } catch (error) {
    console.error("Error calling Claude:", error);
    throw error;
  }
}

export async function formatQuestionsWithClaude(userInput: string): Promise<
  | {
      nebulaQuestion: string;
      perplexityQuestion: string;
    }
  | undefined
> {
  const systemPrompt = `You are a question formatter for a multi-AI system. Your task is to take a user's input and create two specialized questions:
1. One for Nebula AI (specialized in blockchain and web3)
2. One for Perplexity AI (specialized in general knowledge and current information)

Return a JSON object with two fields, keeping the questions concise and focused:
{
  "nebulaQuestion": "blockchain-focused question",
  "perplexityQuestion": "general knowledge question"
}

Keep each question between 200-1000 characters and focused on the core query.

Notes for Nebula:
- Ask as much as possible about the contract, holders, transactions, etc.
- Use specific terms like "address", "block", "transaction", etc.
- Make sure to ask about the user's wallet and if they hold the token in question.

Notes for Perplexity:
- Ask for testimonials from notable figures and quote them. What are influencers, KOLs, and thought leaders saying about it if anything? Search X, Reddit, etc.
- Have it skip stuff that's obvious to focus on important alpha information.
- How has this traded since it's launch until now?
- What does it actually do or represent?
- How old is it? Who else owns it? What's the current price?
- Is it worth buying?
- Are there any other tokens or coins with the same name that might be alternatives to this one?
- What coins is it similar to? 
`;

  try {
    const response = await askClaude(
      `Format this user question into specialized questions for Nebula and Perplexity: "${userInput}"`,
      systemPrompt,
    );

    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;

    try {
      // Handle potential newlines in the JSON string values
      const cleanJsonStr = jsonStr.replace(/\\n/g, " ").replace(/\n/g, " ");
      const parsed = JSON.parse(cleanJsonStr);

      // Validate the response structure
      if (!parsed.nebulaQuestion || !parsed.perplexityQuestion) {
        throw new Error("Invalid response structure from Claude");
      }

      // Clean up the questions - remove extra spaces and normalize formatting
      return {
        nebulaQuestion: parsed.nebulaQuestion.replace(/\s+/g, " ").trim(),
        perplexityQuestion: parsed.perplexityQuestion
          .replace(/\s+/g, " ")
          .trim(),
      };
    } catch (parseError) {
      console.error(
        "Failed to parse Claude response:",
        response,
        "Error:",
        parseError,
      );
      return;
    }
  } catch (error) {
    console.error("Error in formatQuestionsWithClaude:", error);
    return;
  }
}

export async function askPerplexity(
  question: string,
): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro", // Using sonar-pro for larger context window (200k)
        messages: [
          {
            role: "system",
            content:
              "Be precise and concise. Format your response in a clear, structured way.",
          },
          {
            role: "user",
            content: question,
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
        top_p: 0.9,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      console.error("Perplexity API error:", errorData);
      return;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Perplexity:", error);
    return;
  }
}

export async function askNebula(
  message: string,
  chainId: number,
  tokenAddress: string,
  userWalletAddress: string,
): Promise<string | undefined> {
  let sessionId: string | undefined;
  try {
    const response = await fetch("https://nebula-api.thirdweb.com/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": thirdwebSecretKey || "",
      },
      body: JSON.stringify({
        execute_config: {
          mode: "client",
          signer_wallet_address: userWalletAddress,
        },
        title: "Chat Session",
        context_filter: {
          chain_ids: [chainId.toString()],
          contract_addresses: [tokenAddress],
          wallet_addresses: [userWalletAddress],
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Nebula API error:", data);
      return;
    }
    sessionId = data.result.id;
  } catch (error) {
    console.error("Error creating Nebula session:", error);
    return;
  }

  try {
    const response = await fetch("https://nebula-api.thirdweb.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": thirdwebSecretKey || "",
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        stream: false,
        execute_config: {
          mode: "client",
          signer_wallet_address: userWalletAddress,
        },
        context_filter: {
          chain_ids: [chainId.toString()],
          contract_addresses: [tokenAddress],
          wallet_addresses: [userWalletAddress],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Nebula API error");
    }

    return data.response || data.result?.response || data;
  } catch (error) {
    console.error("Error in askNebula:", error);
    return;
  }
}

export async function synthesizeResponses(
  startingData: StartingData,
  nebulaResponse: string,
  perplexityResponse: string,
): Promise<string | undefined> {
  const walletStats = await getWalletStats(
    startingData.userWalletAddress,
    getChainName(startingData.chainId),
  );
  const tokenPnL = await getTokenPnL(
    startingData.userWalletAddress,
    startingData.tokenAddress,
    getChainName(startingData.chainId),
  );

  let walletContext = "";
  if (walletStats) {
    walletContext = `
Wallet Performance:
- Overall win rate: ${walletStats.winrate}%
- Total PnL: $${walletStats.combined_pnl_usd.toFixed(2)}
- Tokens traded: ${walletStats.tokens_traded}
- Average holding time: ${walletStats.average_holding_time.toFixed(1)} days
`;
  }

  let tokenContext = "";
  if (tokenPnL) {
    const hasPosition = tokenPnL.total_buy_usd > tokenPnL.total_sell_usd;
    const currentPosition = tokenPnL.total_buy_usd - tokenPnL.total_sell_usd;
    tokenContext = `
Token-Specific Performance:
- Current Position: ${hasPosition ? `ACTIVE - $${currentPosition.toFixed(2)}` : "NO POSITION"}
- Number of trades: ${tokenPnL.num_swaps}
- Total bought: $${tokenPnL.total_buy_usd.toFixed(2)}
- Total sold: $${tokenPnL.total_sell_usd.toFixed(2)}
- Token PnL: $${tokenPnL.total_pnl_usd.toFixed(2)} (${tokenPnL.roi_percentage.toFixed(2)}% ROI)
- Average buy price: $${tokenPnL.average_buy_price.toFixed(6)}
- Average sell price: $${tokenPnL.average_sell_price.toFixed(6)}
- First trade: ${new Date(tokenPnL.first_trade * 1000).toLocaleDateString()}
- Last trade: ${new Date(tokenPnL.last_trade * 1000).toLocaleDateString()}
- Is Honeypot: ${tokenPnL.is_honeypot ? "⚠️ YES" : "No"}
`;
  }

  const userContext = `${walletContext}\n${tokenContext}`.trim();

  const claudeSystemPrompt = `You are YeetorJeet's lead analyst focused on making immediate Yeet (buy), Jeet (sell), or Hodl (hold) decisions. Your primary goal is to provide personalized recommendations based on the user's current position and trading history with this token.

IMPORTANT - User's Current Position:
${tokenContext || "No position data available"}

${walletContext ? `Overall Trading Performance:\n${walletContext}` : ""}

Analysis Requirements:
1. User's Position and History (HIGHEST PRIORITY)
   - If user holds a position, evaluate whether to hold/add or take profits
   - If no position, evaluate if this is a good entry point
   - Consider user's trading history with this token
2. Price momentum and volatility
3. On-chain activity and whale movements
4. Market sentiment and news impact
5. Risk factors and potential catalysts
6. Suggested position size (% of portfolio)

Remember:
- If user has a position, focus on whether to hold/add or take profits
- If user has no position, focus on whether this is a good entry point
- Always consider the user's trading history with this token
- Be specific about position sizes relative to their current holdings

Available Data:
${
  startingData.hourlyTransferCounts
    ? `Onchain transfers of the token in the last 24 hours by hour:
${JSON.stringify(startingData.hourlyTransferCounts)}

Calculated growth score based on on chain transfers (0-100):
${startingData.growthScore}`
    : "No on-chain transfer data available."
}

${
  startingData.contractABI
    ? `Token contract ABI:
${JSON.stringify(startingData.contractABI)}`
    : "Contract is unverified"
}

Onchain/Web3 Perspective (Nebula):
${nebulaResponse || "No Nebula response available"}

Online Search Engine Perspective (Perplexity):
${perplexityResponse || "No Perplexity response available"}

${
  startingData.geckoTerminalData
    ? `Market Data (GeckoTerminal):
- Current Price: $${startingData.geckoTerminalData?.included?.[0]?.attributes?.base_token_price_usd || "N/A"}
- Blockchain ID: ${startingData.chainId}
- Name: ${startingData.geckoTerminalData?.data?.attributes?.name || "N/A"}
- Symbol: ${startingData.geckoTerminalData?.data?.attributes?.symbol || "N/A"}
- Top Pools: ${
        startingData.geckoTerminalData?.included
          ?.map(
            (p) =>
              `\n  * ${p.attributes.name} (24h Volume: $${p.attributes.volume_usd.h24}, Liquidity: $${p.attributes.reserve_in_usd})`,
          )
          .join("") || "N/A"
      }`
    : "No market data available from GeckoTerminal"
}

User Context:
${userContext}

Analysis Requirements:
1. Price momentum and volatility
2. On-chain activity and whale movements
3. Market sentiment and news impact
4. Risk factors and potential catalysts
5. User's current holdings and portfolio impact
6. Suggested position size (% of portfolio)

Response Format:
You must respond with a JSON object using this exact structure:
{
  "sections": [
    {
      "section": "inputs", // get this section from 
      "tokenInfo": {
        "address": "string",
        "name": "${startingData.geckoTerminalData?.data?.attributes?.name || "N/A"}",
        "symbol": "${startingData.geckoTerminalData?.data?.attributes?.symbol || "N/A"}",
        "price": "string",
        "marketCap": "string",
        "chainid": "${startingData.chainId}",
      },
      "walletInfo": {
        "address": "string",
        "balance": "string",
        "holdings": "string"
      }
    },
    {
      "section": "verdict",
      "type": ${
        tokenPnL && tokenPnL.total_buy_usd > tokenPnL.total_sell_usd
          ? '"buy" | "sell" | "hold"'
          : '"buy" | "hold"'
      }, // Only suggest sell if user has a position
      "title": "string", // e.g. "Yeet $3.2k into VVV", be specific with your amount if possible and make sure if it's a sell it's less than the user has. Can also be in a hold/sell position "Don't buy VVV". Max 24 chars
      "description": "string", // e.g. "Buy ~$3.2k at $62.3m MC", a more straightforward and informed way to say the same thing as title. Max 30 chars
      "summary": "string", // e.g. "Yeet (buy) 20% of your portfolio into VVV"
      "actions": [
        {
          "label": "string",
          "description": "string",
          "subtext": "string",
          "recommendedPercentage": number,
          "txData": {
            "chainId": number,
            "data": "string",
            "to": "string",
            "value": "string"
          }
        }
      ]
    },
    {
      "section": "details",
      "content": "string" // Detailed analysis in markdown format including market conditions, technical analysis, and risk factors. This should include a ton of stuff from above and previous data you've pulled. Focus on the token itself. You don't need a title for this section. Use emojis sparcely where appropriate. Make sure to space out your markdown so that it becomes multiple sections and comes out clean in markdown. Mention quotes if relevant. Be concise, dense, and note-taking in your structure, no need for complete sentences. Between 1000-3000 characters. 
    }
  ]
}

Make sure to:
1. Use actual values from the provided data where available
2. Format the details section in proper markdown, with spacing and line breaks correctly so it comes out correctly when inputted into a markdown renderer
3. Include specific transaction data in the actions
4. Be decisive in the verdict section
5. Provide clear reasoning in the details section, contextualize it to other tokens the user has traded
6. Focus on insights, things a trader wouldn't already know, specific to the token and current market conditions
7. Use accurate values and proper JSON format`;

  return await askClaude(
    "Based on the provided information, generate a complete trading analysis and recommendation in the specified JSON format. Ensure all required fields are included and properly formatted.",
    claudeSystemPrompt,
  );
}

function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    80094: "berachain",
  };
  return chainMap[chainId] || "berachain";
}
