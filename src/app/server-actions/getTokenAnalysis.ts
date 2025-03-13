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

    const info = await gatherStartingData(
      params.chainId,
      params.tokenAddress,
      params.walletAddress,
    );

    if (!info) {
      return {
        ok: false,
        error: "Failed to gather token data",
      };
    }

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

    const questions = await formatQuestionsWithClaude(initialQuestion);

    if (!questions) {
      return {
        ok: false,
        error: "Failed to analyze token",
      };
    }

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
      return {
        ok: false,
        error: "Failed to get answers from AI services",
      };
    }

    const synthesis = await synthesizeResponses(
      info,
      nebulaAnswer || "",
      perplexityAnswer || "",
    );

    if (!synthesis) {
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
      const parsedSynthesis = JSON.parse(cleanedSynthesis) as TokenAnalysis;

      // Validate the response structure
      if (!parsedSynthesis.sections || !Array.isArray(parsedSynthesis.sections)) {
        throw new Error("Invalid synthesis structure");
      }

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
    return {
      ok: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
