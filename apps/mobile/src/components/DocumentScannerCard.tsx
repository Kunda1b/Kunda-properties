import { StyleSheet, Text, View } from "react-native";

export function DocumentScannerCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Document scan</Text>
      <Text style={styles.body}>
        Store title pages, seller ID, and signed forms locally before upload.
      </Text>
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
});
