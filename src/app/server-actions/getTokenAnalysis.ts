"use server";

import {
  askNebula,
  askPerplexity,
  formatQuestionsWithClaude,
  synthesizeResponses,
} from "@/lib/helpers/ai";
import { gatherStartingData } from "@/lib/helpers/info";
import { isAddress } from "thirdweb";
import { supportedChains } from "../../lib/supportedChains";

export type TokenAnalysis = {
  summary: string;
  sections: Array<object>;
};

export type TokenAnalysisResponse =
  | {
      ok: true;
      data: TokenAnalysis;
    }
  | {
      ok: false;
      error: string;
    };

export async function getTokenAnalysis(params: {
  tokenAddress: string;
  walletAddress: string;
  chainId: number;
}): Promise<TokenAnalysisResponse> {
  try {
    // input validations ----------------------------
    if (!isAddress(params.tokenAddress)) {
      return {
        ok: false,
        error: "Invalid token address",
      };
    }

    if (!isAddress(params.walletAddress)) {
      return {
        ok: false,
        error: "Invalid wallet address",
      };
    }

    const isSupportedChain = supportedChains.find((c) => c.id === params.chainId);

    if (!isSupportedChain) {
      return {
        ok: false,
        error: "Unsupported chain",
      };
    }

    console.log("Starting data gathering for token:", params.tokenAddress);
    const info = await gatherStartingData(
      params.chainId,
      params.tokenAddress,
      params.walletAddress,
    );

    if (!info) {
      console.error("Failed to gather starting data");
      return {
        ok: false,
        error: "Failed to gather token data",
      };
    }

    console.log("Starting data gathered successfully");

    const initialQuestion = `
      You are a financial analyst with access to on-chain data. Analyze this token and the user's wallet:
      
      Token Data:
      ${JSON.stringify(info)}
      
      Wallet Address: ${params.walletAddress}
      
      Please analyze:
      1. The user's current position and trading history with this token
      2. The token's on-chain metrics and smart contract
      3. Recent whale movements and significant transactions
      4. Any red flags or security concerns
      
      Based on the user's current position (if any), should they buy more, hold, or sell? 
      If they don't have a position, is this a good entry point?
    `;

    console.log("Formatting questions with Claude");
    const questions = await formatQuestionsWithClaude(initialQuestion);

    if (!questions) {
      console.error("Failed to format questions with Claude");
      return {
        ok: false,
        error: "Failed to analyze token",
      };
    }

    console.log("Questions formatted successfully, calling AI services");
    const [nebulaAnswer, perplexityAnswer] = await Promise.all([
      askNebula(
        questions.nebulaQuestion,
        params.chainId,
        params.tokenAddress,
        params.walletAddress,
      ),
      askPerplexity(questions.perplexityQuestion),
    ]);

    if (!nebulaAnswer && !perplexityAnswer) {
      console.error("Both AI services failed to respond");
      return {
        ok: false,
        error: "Failed to get answers from AI services",
      };
    }

    console.log("AI responses received, synthesizing");
    const synthesis = await synthesizeResponses(
      info,
      nebulaAnswer || "",
      perplexityAnswer || "",
    );

    if (!synthesis) {
      console.error("Failed to synthesize responses");
      return {
        ok: false,
        error: "Failed to synthesize AI responses",
      };
    }

    // Clean the string before parsing
    const cleanedSynthesis = synthesis
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/\\n/g, "\\n") // Properly escape newlines
      .replace(/\\"/g, '\\"') // Properly escape quotes
      .trim();

    try {
      console.log("Parsing synthesis");
      const parsedSynthesis = JSON.parse(cleanedSynthesis) as TokenAnalysis;

      // Validate the response structure
      if (!parsedSynthesis.sections || !Array.isArray(parsedSynthesis.sections)) {
        console.error("Invalid synthesis structure:", parsedSynthesis);
        throw new Error("Invalid synthesis structure");
      }

      console.log("Analysis completed successfully");
      return {
        ok: true,
        data: parsedSynthesis,
      };
    } catch (error) {
      console.error("JSON Parse Error:", error);
      console.error("Cleaned Synthesis:", cleanedSynthesis);
      return {
        ok: false,
        error: "Failed to parse analysis results",
      };
    }
  } catch (error) {
    console.error("Error in getTokenAnalysis:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      return {
        ok: false,
        error: error.message,
      };
    }
    return {
      ok: false,
      error: "An unexpected error occurred",
    };
  }
}
