import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CameraPicker } from "../components/CameraPicker";
import { DocumentScannerCard } from "../components/DocumentScannerCard";
import { MapViewCard } from "../components/MapViewCard";
import { useSyncQueue } from "../hooks/useSyncQueue";

export function ListingCreateScreen() {
  const { lastSyncLabel, pending } = useSyncQueue();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create listing</Text>
      <Text style={styles.body}>
        The intake flow is scaffolded for property details, location capture,
        media upload, and local queueing.
      </Text>

      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>Offline sync queue</Text>
        <Text style={styles.calloutBody}>
          {pending.length} actions prepared. {lastSyncLabel}
        </Text>
      </View>

      <CameraPicker />
      <MapViewCard />
      <DocumentScannerCard />
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
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: "#627067",
  },
  callout: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#DCEEE8",
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B4F3F",
  },
  calloutBody: {
    marginTop: 4,
    color: "#0B4F3F",
    lineHeight: 20,
  },
});
