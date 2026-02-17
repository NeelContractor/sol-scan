import { useWalletStore } from "@/stores/wallet-store";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

interface Props {
    address: string;
}

export function FavoriteButton({ address }: Props) {
    const addFavorite = useWalletStore((s) => s.addFavorite);
    const removeFavorites = useWalletStore((s) => s.removeFavorite);
    const favorites = useWalletStore((s) => s.favorites);
    const favorited = favorites.includes(address);

    return (
        <TouchableOpacity
            onPress={() => {
                if (favorited) {
                    removeFavorites(address)
                } else {
                    addFavorite(address);
                }
            }}
            style={styles.button}
        >
            <Ionicons 
                name={favorited ? "heart" : "heart-outline"}
                size={24}
                color={favorited ? "#FF4545" : "#666"}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        padding: 8,
    }
})