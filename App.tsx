import { StatusBar } from 'expo-status-bar';
import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";

const RPC = "https://api.mainnet-beta.solana.com";

export default function App() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);


  const rpc = async (method: string, params: any[]) => {
    const res = await fetch(RPC, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result;
  }
  
  const getBalance = async (addr: string) => {
    const result = await rpc("getBalance", [addr]);
    return result.value / 1_000_000_000;
  };
  
  const getTokens = async (addr: string) => {
    const result = await rpc("getTokenAccountsByOwner", [
      addr,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" },
    ]);
    return (result.value || [])
      .map((a: any) => ({
        mint: a.account.data.parsed.info.mint,
        amount: a.account.data.parsed.info.tokenAmount.uiAmount,
      })).filter((t: any) => t.amount > 0);
  };
  
  const getTxns = async (addr: string) => {
    const sigs = await rpc("getSignaturesForAddress", [addr, { limit: 10 }]);
    return sigs.map((s: any) => ({
      sig: s.signature,
      time: s.blockTime,
      ok: !s.err,
    }));
  }
  
  const short = (s: string, n = 4) => `${s.slice(0, n)}...${s.slice(-n)}`;
  
  const timeAgo = (ts: number) => {
    const s = Math.floor(Date.now() / 1000 - ts);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
  
  const search = async () => {
    const addr = address.trim();
    if (!addr) return Alert.alert("Enter a wallet address");

    setLoading(true);
    try {
      const [bal, tok, tx] = await Promise.all([
        getBalance(addr),
        getTokens(addr),
        getTxns(addr),
      ]);
      setBalance(bal);
      setTokens(tok);
      setTxns(tx);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style='light' />
      <ScrollView style={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Sol Scan</Text>
          <Text style={s.subtitle}>Solana Wallet Explorer</Text>
        </View>

        <View style={s.searchContainer}>
          <TextInput 
            style={s.input}
            placeholder='Solana wallet address...'
            placeholderTextColor={"#555"}
            value={address}
            onChangeText={setAddress}
            autoCapitalize='none'
            autoCorrect={false}
          />

          <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={"#000"} />
            ) : (
              <Text style={s.btnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {balance !== null && (
          <View style={s.card}>
              <Text style={s.label}>SOL Balance</Text>
              <Text style={s.balance}>{balance.toFixed(4)}</Text>
              <Text style={s.sol}>SOL</Text>
              <Text style={s.addr}>{short(address.trim(), 6)}</Text>
          </View>
        )}

        {tokens.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Token Holdings</Text>
            <FlatList 
              data={tokens}
              keyExtractor={(t) => t.mint}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={s.row}>
                  <View style={s.tokenInfo}>
                    <Text style={s.tokenLabel}>Mint</Text>
                    <Text style={s.mint}>{short(item.mint, 6)}</Text>
                  </View>
                  <View style={s.tokenAmount}>
                    <Text style={s.amountLabel}>Amount</Text>
                    <Text style={s.amount}>{item.amount}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {txns.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Transactions</Text>
            <FlatList 
              data={txns}
              keyExtractor={(t) => t.sig}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.txRow} onPress={() => Linking.openURL(`https://solscan.io/tx/${item.sig}`)} >
                  <View style={s.txInfo}>
                    <Text style={s.txSig}>{short(item.sig, 8)}</Text>
                    <Text style={s.txTime}>{timeAgo(item.time)}</Text>
                  </View>
                  <View style={[s.statusBadge, item.ok ? s.statusSuccess : s.statusError]}>
                    <Text style={s.statusText}>{item.ok ? '✓' : '✗'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#0a0a1a' 
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#14F195',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#14F195',
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 54,
  },
  btnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balance: {
    color: '#14F195',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sol: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  addr: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  mint: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  tokenAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  amount: {
    color: '#14F195',
    fontSize: 18,
    fontWeight: '600',
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  txInfo: {
    flex: 1,
  },
  txSig: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  txTime: {
    color: '#666',
    fontSize: 14,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSuccess: {
    backgroundColor: '#14F19520',
  },
  statusError: {
    backgroundColor: '#ff444420',
  },
  statusText: {
    color: '#14F195',
    fontSize: 18,
    fontWeight: 'bold',
  },
});