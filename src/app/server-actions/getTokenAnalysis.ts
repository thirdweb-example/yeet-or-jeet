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
    You are a financial analyst. You are given the following information about a token:
      ${JSON.stringify(info)}
    My wallet address is ${params.walletAddress}.
    Should I buy or sell this token?
  `;
  const questions = await formatQuestionsWithClaude(initialQuestion);

  // console.log("Formatted questions:", questions);

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

  // console.log("Nebula answer:", nebulaAnswer);
  // console.log("Perplexity answer:", perplexityAnswer);

  if (!nebulaAnswer && !perplexityAnswer) {
    return {
      ok: false,
      error: "Failed to get answers from AI",
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
      error: "Failed to synthesize responses",
    };
  }

  // Clean the string before parsing
  const cleanedSynthesis = synthesis
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\\n/g, '\\n')  // Properly escape newlines
    .replace(/\\"/g, '\\"')  // Properly escape quotes
    .trim();

  try {
    const parsedSynthesis = JSON.parse(cleanedSynthesis);
    
    return {
      ok: true,
      data: parsedSynthesis,
    };
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Cleaned Synthesis:', cleanedSynthesis);
    return {
      ok: false,
      error: "Failed to parse analysis results",
    };
  }
}
