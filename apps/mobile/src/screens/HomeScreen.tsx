import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useOfflineListings } from "../hooks/useOfflineListings";
import { useSyncQueue } from "../hooks/useSyncQueue";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { drafts } = useOfflineListings();
  const { pending } = useSyncQueue();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Agent mobile app</Text>
        <Text style={styles.title}>Take listings from the field to review-ready.</Text>
        <Text style={styles.body}>
          Capture property details, keep progress offline, and push queued work
          once the device gets a stable connection.
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Offline drafts</Text>
          <Text style={styles.metricValue}>{drafts.length}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Queued actions</Text>
          <Text style={styles.metricValue}>{pending.length}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Pressable
          onPress={() => navigation.navigate("ListingCreate")}
          style={styles.actionCard}
        >
          <Text style={styles.actionTitle}>Create listing</Text>
          <Text style={styles.actionBody}>Open the multi-step intake scaffold.</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate("PropertyDetail", { listingId: drafts[0]?.id ?? "draft-kololi" })
          }
          style={styles.actionCard}
        >
          <Text style={styles.actionTitle}>Inspect a saved draft</Text>
          <Text style={styles.actionBody}>Review the field data before sync.</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Chat")} style={styles.actionCard}>
          <Text style={styles.actionTitle}>Agent inbox</Text>
          <Text style={styles.actionBody}>Check buyer questions and follow-ups.</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("VisitSchedule")}
          style={styles.actionCard}
        >
          <Text style={styles.actionTitle}>Visit schedule</Text>
          <Text style={styles.actionBody}>Keep appointments visible on the road.</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("Profile")}
          style={styles.actionCard}
        >
          <Text style={styles.actionTitle}>Agent profile</Text>
          <Text style={styles.actionBody}>Monitor KYC status and listing health.</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#0F6E56",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: "#18261F",
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "#627067",
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DED1",
  },
  metricLabel: {
    fontSize: 13,
    color: "#627067",
  },
  metricValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "700",
    color: "#18261F",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18261F",
  },
  actionCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DED1",
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18261F",
  },
  actionBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#627067",
  },
});
