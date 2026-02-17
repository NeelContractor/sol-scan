import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Linking,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ConnectButton } from "@/components/ConnectButton";
import { useWallet } from "@/hooks/useWallet";

export default function ExplorerScreen() {
    const router = useRouter();
    const wallet = useWallet();

    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const handleSend = async () => {
        // Validate
        if (!toAddress.trim()) return Alert.alert("Enter a recipient address");
        if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
            return Alert.alert("Enter a valid amount");
        }

        try {
            const sig = await wallet.sendSOL(toAddress.trim(), Number(amount));
            setTxSignature(sig);
            Alert.alert(
                "Transaction Sent! ✅",
                `Sent ${amount} SOL\nSignature: ${sig.slice(0, 20)}...`,
                [
                    { text: "View on Solscan", onPress: () => Linking.openURL(`https://solscan.io/tx/${sig}`) },
                    { text: "Done", onPress: () => router.back() },
                ]
            );
        } catch (error: any) {
            Alert.alert("Transaction Failed", error.message || "Something went wrong");
        }
    };

    if (!wallet.connected) {
        return (
            <View style={styles.center}>
                <Ionicons name="compass" size={64} color="#333" />
                <Text style={styles.emptyTitle}>Wallet Not Connected</Text>
                <Text style={styles.emptyText}>
                    Connect your wallet from the Explorer tab first.
                </Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={styles.container}>
            {/* Header with Connect Button */}
            <View style={styles.header}>
                <Text style={styles.title}>◎ SolScan</Text>
                <ConnectButton
                    connected={wallet.connected}
                    connecting={wallet.connecting}
                    publicKey={wallet.publicKey?.toBase58() ?? null}
                    onConnect={wallet.connect}
                    onDisconnect={wallet.disconnect}
                />
            </View>

            {/* When connected, show quick balance */}
            {wallet.connected && (
                <TouchableOpacity
                    style={styles.sendNav}
                    onPress={() => router.push("/send")}
                >
                    <Ionicons name="paper-plane" size={20} color="#0a0a1a" />
                    <Text style={styles.sendNavText}>Send SOL</Text>
                </TouchableOpacity>
            )}

            {/* ...rest of explorer... */}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#0a0a1a", 
        padding: 16, 
        paddingTop: 60 
    },
    center: {
        flex: 1, 
        backgroundColor: "#0a0a1a",
        justifyContent: "center", 
        alignItems: "center", 
        padding: 40,
    },
    emptyTitle: { 
        color: "#fff", 
        fontSize: 20, 
        fontWeight: "bold", 
        marginTop: 16 
    },
    emptyText: { 
        color: "#666", 
        fontSize: 14, 
        textAlign: "center", 
        marginTop: 8 
    },
    header: {
        flexDirection: "row", 
        alignItems: "center",
        justifyContent: "space-between", 
        marginBottom: 24,
    },
    title: { 
        color: "#fff", 
        fontSize: 20, 
        fontWeight: "bold" 
    },
    card: {
        backgroundColor: "#1a1a2e", 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 20,
    },
    cardLabel: { 
        color: "#888", 
        fontSize: 12, 
        textTransform: "uppercase", 
        marginBottom: 4 
    },
    cardAddress: { 
        color: "#9945FF", 
        fontSize: 14, 
        fontFamily: "monospace" 
    },
    inputGroup: { 
        marginBottom: 16 
    },
    inputLabel: { 
        color: "#888", 
        fontSize: 12, 
        textTransform: "uppercase", 
        marginBottom: 8 
    },
    input: {
        backgroundColor: "#1a1a2e", 
        color: "#fff", 
        padding: 16,
        borderRadius: 12, 
        fontSize: 16, 
        borderWidth: 1, 
        borderColor: "#2a2a3e",
    },
    sendButton: {
        backgroundColor: "#14F195", 
        padding: 16, 
        borderRadius: 12,
        alignItems: "center", 
        marginTop: 8,
    },
    sendNav: {
        backgroundColor: "#14F195", 
        padding: 16, 
        borderRadius: 12,
        alignItems: "center", 
        marginTop: 8,
    },
    sendNavText: {
        color: "#fff", 
        fontWeight: "bold" 
    },
    sendButtonDisabled: { 
        opacity: 0.5
    },
    sendButtonText: { 
        color: "#0a0a1a", 
        fontSize: 18, 
        fontWeight: "bold" 
    },
    feeText: { 
        color: "#555", 
        fontSize: 12, 
        textAlign: "center", 
        marginTop: 12 
    },
    backButton: {
        backgroundColor: "#9945FF", 
        paddingHorizontal: 24, 
        paddingVertical: 12,
        borderRadius: 10, 
        marginTop: 16,
    },
    backButtonText: { 
        color: "#fff", 
        fontWeight: "bold" 
    },
});