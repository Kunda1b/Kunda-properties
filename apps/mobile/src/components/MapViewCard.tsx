import { StyleSheet, Text, View } from "react-native";

export function MapViewCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Map pin and boundary</Text>
      <Text style={styles.body}>
        Capture the plot or property position and keep it with the draft while
        offline.
      </Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>Map preview scaffold</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DED1",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18261F",
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#627067",
  },
  mapPlaceholder: {
    marginTop: 12,
    height: 140,
    borderRadius: 16,
    backgroundColor: "#DCEEE8",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#0B4F3F",
    fontWeight: "600",
  },
});
