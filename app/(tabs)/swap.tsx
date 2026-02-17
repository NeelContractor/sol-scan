import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getSwapQuote, getSwapTransaction,
  TOKENS, TOKEN_INFO,
  toSmallestUnit, fromSmallestUnit,
} from "../../src/services/jupiter";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@/hooks/useWallet";

export default function SwapScreen() {
    const wallet = useWallet();

    // Token selection
    const [inputToken, setInputToken] = useState(TOKENS.SOL);
    const [outputToken, setOutputToken] = useState(TOKENS.USDC);

    // Amounts
    const [inputAmount, setInputAmount] = useState("");
    const [outputAmount, setOutputAmount] = useState("");

    // State
    const [quoteData, setQuoteData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [priceImpact, setPriceImpact] = useState<string | null>(null);

    const inputInfo = TOKEN_INFO[inputToken];
    const outputInfo = TOKEN_INFO[outputToken];

  // ============================================
  // Fetch quote when input amount changes
  // ============================================
    const fetchQuote = useCallback(async () => {
        if (!inputAmount || Number(inputAmount) <= 0) {
            setOutputAmount("");
            setQuoteData(null);
            return;
        }

        setLoading(true);
        try {
            const amountInSmallest = toSmallestUnit(
                Number(inputAmount),
                inputInfo.decimals
            );

            const quote = await getSwapQuote(
                inputToken,
                outputToken,
                amountInSmallest
            );

            setQuoteData(quote);
            setOutputAmount(
                fromSmallestUnit(quote.outAmount, outputInfo.decimals).toFixed(
                outputInfo.decimals > 6 ? 4 : 2
                )
            );
            setPriceImpact(quote.priceImpactPct);
        } catch (error: any) {
            console.error("Quote error:", error);
            setOutputAmount("Error");
            setQuoteData(null);
        } finally {
            setLoading(false);
        }
    }, [inputAmount, inputToken, outputToken]);

  // Debounce — wait 500ms after user stops typing before fetching quote
    useEffect(() => {
        const timer = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timer);
    }, [fetchQuote]);

  // ============================================
  // Swap tokens (flip input/output)
  // ============================================
    const flipTokens = () => {
        setInputToken(outputToken);
        setOutputToken(inputToken);
        setInputAmount(outputAmount);
        setOutputAmount("");
        setQuoteData(null);
    };

  // ============================================
  // Execute the swap
  // ============================================
    const executeSwap = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            return Alert.alert("Connect your wallet first");
        }
        if (!quoteData) {
            return Alert.alert("Get a quote first");
        }

        setSwapping(true);
        try {
            // Get the swap transaction from Jupiter
            const swapTxBase64 = await getSwapTransaction(
                quoteData,
                wallet.publicKey.toBase58()
            );

            // Decode the transaction
            const swapTxBuf = Buffer.from(swapTxBase64, "base64");
            const transaction = VersionedTransaction.deserialize(swapTxBuf);

            // Send to Phantom for signing
            const signature = await transact(
                async (mobileWallet: Web3MobileWallet) => {
                    await mobileWallet.authorize({
                        chain: "solana:mainnet-beta",
                        identity: {
                            name: "SolScan",
                            uri: "https://solscan.io",
                            icon: "favicon.ico",
                        },
                    });

                    const signatures = await mobileWallet.signAndSendTransactions({
                        transactions: [transaction],
                    });

                    return signatures[0];
                }
            );

            Alert.alert(
                "Swap Successful! ✅",
                `Swapped ${inputAmount} ${inputInfo.symbol} → ${outputAmount} ${outputInfo.symbol}`
            );

            // Reset form
            setInputAmount("");
            setOutputAmount("");
            setQuoteData(null);
        } catch (error: any) {
            Alert.alert("Swap Failed", error.message || "Something went wrong");
        } finally {
            setSwapping(false);
        }
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>🔄 Swap</Text>

        {/* Input Token Card */}
        <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>You Pay</Text>
            <View style={styles.tokenRow}>
            <TextInput
                style={styles.amountInput}
                placeholder="0.0"
                placeholderTextColor="#555"
                value={inputAmount}
                onChangeText={setInputAmount}
                keyboardType="decimal-pad"
            />
            <View style={styles.tokenBadge}>
                <Text style={styles.tokenSymbol}>{inputInfo.symbol}</Text>
            </View>
            </View>
        </View>

        {/* Flip Button */}
        <TouchableOpacity style={styles.flipButton} onPress={flipTokens}>
            <Ionicons name="swap-vertical" size={24} color="#14F195" />
        </TouchableOpacity>

        {/* Output Token Card */}
        <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>You Receive</Text>
            <View style={styles.tokenRow}>
            <View style={styles.outputAmount}>
                {loading ? (
                <ActivityIndicator color="#14F195" />
                ) : (
                <Text style={styles.outputText}>
                    {outputAmount || "0.0"}
                </Text>
                )}
            </View>
            <View style={styles.tokenBadge}>
                <Text style={styles.tokenSymbol}>{outputInfo.symbol}</Text>
            </View>
            </View>
        </View>

        {/* Quote Details */}
        {quoteData && (
            <View style={styles.details}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={styles.detailValue}>
                1 {inputInfo.symbol} ≈{" "}
                {(Number(outputAmount) / Number(inputAmount)).toFixed(4)}{" "}
                {outputInfo.symbol}
                </Text>
            </View>
            {priceImpact && (
                <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price Impact</Text>
                <Text style={[
                    styles.detailValue,
                    Number(priceImpact) > 1 && { color: "#FF4545" }
                ]}>
                    {Number(priceImpact).toFixed(2)}%
                </Text>
                </View>
            )}
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Slippage</Text>
                <Text style={styles.detailValue}>0.5%</Text>
            </View>
            </View>
        )}

        {/* Swap Button */}
        {wallet.connected ? (
            <TouchableOpacity
            style={[
                styles.swapButton,
                (!quoteData || swapping) && styles.swapButtonDisabled,
            ]}
            onPress={executeSwap}
            disabled={!quoteData || swapping}
            >
            {swapping ? (
                <ActivityIndicator color="#0a0a1a" />
            ) : (
                <Text style={styles.swapButtonText}>
                {quoteData ? "Swap" : "Enter an amount"}
                </Text>
            )}
            </TouchableOpacity>
        ) : (
            <TouchableOpacity
            style={styles.connectButton}
            onPress={wallet.connect}
            >
            <Text style={styles.connectButtonText}>Connect Wallet to Swap</Text>
            </TouchableOpacity>
        )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0a0a1a", padding: 16, paddingTop: 60 },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    tokenCard: {
        backgroundColor: "#1a1a2e", borderRadius: 16, padding: 16, marginBottom: 4,
    },
    tokenLabel: { color: "#888", fontSize: 12, textTransform: "uppercase", marginBottom: 8 },
    tokenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    amountInput: { flex: 1, color: "#fff", fontSize: 28, fontWeight: "bold" },
    outputAmount: { flex: 1, minHeight: 40, justifyContent: "center" },
    outputText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
    tokenBadge: {
        backgroundColor: "#2a2a3e", paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 20,
    },
    tokenSymbol: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    flipButton: {
        alignSelf: "center", backgroundColor: "#1a1a2e",
        padding: 10, borderRadius: 20, marginVertical: 4,
        borderWidth: 3, borderColor: "#0a0a1a",
        zIndex: 1, marginTop: -12, marginBottom: -12,
    },
    details: {
        backgroundColor: "#1a1a2e", borderRadius: 12, padding: 14, marginTop: 16,
    },
    detailRow: {
        flexDirection: "row", justifyContent: "space-between",
        paddingVertical: 6,
    },
    detailLabel: { color: "#888", fontSize: 13 },
    detailValue: { color: "#fff", fontSize: 13, fontWeight: "500" },
    swapButton: {
        backgroundColor: "#14F195", padding: 18, borderRadius: 14,
        alignItems: "center", marginTop: 20,
    },
    swapButtonDisabled: { opacity: 0.4 },
    swapButtonText: { color: "#0a0a1a", fontSize: 18, fontWeight: "bold" },
    connectButton: {
        backgroundColor: "#9945FF", padding: 18, borderRadius: 14,
        alignItems: "center", marginTop: 20,
    },
    connectButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});