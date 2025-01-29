import {
  askNebula,
  askPerplexity,
  formatQuestionsWithClaude,
  synthesizeResponses,
} from "@/lib/helpers/ai";
import { gatherStartingData } from "@/lib/helpers/info";
import { type NextRequest, NextResponse } from "next/server";

const isValidEvmAddress = (address: string) =>
  /^0x[a-fA-F0-9]{40}$/.test(address);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenAddress = requestUrl.searchParams.get("token");
  const walletAddress = requestUrl.searchParams.get("wallet");
  const chainId = Number(requestUrl.searchParams.get("chain")) || 8453;

  if (!tokenAddress) {
    return NextResponse.json(
      { success: false, error: "Missing token address" },
      { status: 400 },
    );
  }
  if (!isValidEvmAddress(tokenAddress)) {
    return NextResponse.json(
      { success: false, error: "Invalid token address" },
      { status: 400 },
    );
  }
  if (!walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing wallet address" },
      { status: 400 },
    );
  }
  if (!isValidEvmAddress(walletAddress)) {
    return NextResponse.json(
      { success: false, error: "Invalid wallet address" },
      { status: 400 },
    );
  }

  const info = await gatherStartingData(chainId, tokenAddress, walletAddress);
  if (!info) {
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 },
    );
  }
  const initialQuestion = `
    You are a financial analyst. You are given the following information about a token:
      ${JSON.stringify(info)}
    My wallet address is ${walletAddress}.
    Should I buy or sell this token?
  `;
  const questions = await formatQuestionsWithClaude(initialQuestion);
  console.log("Formatted questions:", questions);
  if (!questions) {
    return NextResponse.json(
      { error: "Failed to analyze token" },
      { status: 500 },
    );
  }
  const [nebulaAnswer, perplexityAnswer] = await Promise.all([
    askNebula(questions.nebulaQuestion, chainId, tokenAddress, walletAddress),
    askPerplexity(questions.perplexityQuestion),
  ]);
  console.log("Nebula answer:", nebulaAnswer);
  console.log("Perplexity answer:", perplexityAnswer);
  if (!nebulaAnswer && !perplexityAnswer) {
    return NextResponse.json(
      { error: "Failed to get answers from AI" },
      { status: 500 },
    );
  }

  const synthesis = await synthesizeResponses(
    info,
    nebulaAnswer || "",
    perplexityAnswer || "",
  );
  if (!synthesis) {
    return NextResponse.json(
      { error: "Failed to synthesize responses" },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true, synthesis });
}
