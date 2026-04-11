import { ScrollView, StyleSheet, Text, View } from "react-native";

export function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Agent profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification</Text>
        <Text style={styles.body}>KYC status: Pending manual approval</Text>
        <Text style={styles.body}>Listings live: 12</Text>
        <Text style={styles.body}>Enquiries waiting: 4</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Field readiness</Text>
        <Text style={styles.body}>Offline storage initialized</Text>
        <Text style={styles.body}>Cloudinary helper configured for media uploads</Text>
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
