import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useOfflineListings } from "../hooks/useOfflineListings";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "PropertyDetail">;

export function PropertyDetailScreen({ route }: Props) {
  const { drafts } = useOfflineListings();
  const listing = drafts.find((item) => item.id === route.params.listingId) ?? drafts[0];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{listing?.title ?? "Offline draft"}</Text>
      <Text style={styles.subtitle}>{listing?.locality ?? "Unknown locality"}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Draft state</Text>
        <Text style={styles.body}>Status: {listing?.status ?? "Draft"}</Text>
        <Text style={styles.body}>Last edited: {listing?.updatedAt ?? "Recently"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next validation checks</Text>
        <Text style={styles.body}>Add ownership documents and confirm map pin.</Text>
        <Text style={styles.body}>Review photo order before publishing to ops.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#18261F",
  },
  subtitle: {
    color: "#627067",
    fontSize: 15,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DED1",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18261F",
  },
  body: {
    color: "#627067",
    lineHeight: 22,
  },
});
