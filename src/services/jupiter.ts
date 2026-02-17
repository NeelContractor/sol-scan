const JUPITER_API = "https://quote-api.jup.ag/v6";

// Well-known token mints (you'll need these constantly)
export const TOKENS = {
    SOL: "So11111111111111111111111111111111111111112",  // Wrapped SOL
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
};

// Token names for display
export const TOKEN_INFO: Record<string, { symbol: string; name: string; decimals: number }> = {
    [TOKENS.SOL]: { symbol: "SOL", name: "Solana", decimals: 9 },
    [TOKENS.USDC]: { symbol: "USDC", name: "USD Coin", decimals: 6 },
    [TOKENS.USDT]: { symbol: "USDT", name: "Tether", decimals: 6 },
    [TOKENS.BONK]: { symbol: "BONK", name: "Bonk", decimals: 5 },
    [TOKENS.JUP]: { symbol: "JUP", name: "Jupiter", decimals: 6 },
    [TOKENS.WIF]: { symbol: "WIF", name: "dogwifhat", decimals: 6 },
};

// ============================================
// GET QUOTE — How much will I receive?
// ============================================
export async function getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: number,        // in raw lamports/smallest unit
    slippageBps: number = 50  // 0.5% default slippage
) {
    const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
    });

    const response = await fetch(`${JUPITER_API}/quote?${params}`);

    if (!response.ok) {
        throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    const quote = await response.json();
    return quote;
}

// ============================================
// GET SWAP TRANSACTION — Ready to sign
// ============================================
export async function getSwapTransaction(
    quoteResponse: any,
    userPublicKey: string
) {
    const response = await fetch(`${JUPITER_API}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
        }),
    });

    if (!response.ok) {
        throw new Error(`Jupiter swap failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.swapTransaction; // This is a base64-encoded transaction
}

// ============================================
// GET TOKEN PRICE — Current USD price
// ============================================
export async function getTokenPrice(mintAddress: string): Promise<number> {
    const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${mintAddress}`
    );
    const data = await response.json();
    return data.data?.[mintAddress]?.price || 0;
}

// ============================================
// CONVERT AMOUNTS
// ============================================
export function toSmallestUnit(amount: number, decimals: number): number {
    return Math.round(amount * Math.pow(10, decimals));
}

export function fromSmallestUnit(amount: number | string, decimals: number): number {
    return Number(amount) / Math.pow(10, decimals);
}