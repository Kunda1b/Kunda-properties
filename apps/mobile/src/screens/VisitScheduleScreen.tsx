import { ScrollView, StyleSheet, Text, View } from "react-native";

const visits = [
  { id: "visit-1", listing: "Kololi duplex", time: "Today at 15:00", guest: "Awa Ceesay" },
  { id: "visit-2", listing: "Brufut plots", time: "Tomorrow at 11:30", guest: "Mariama Bah" },
];

export function VisitScheduleScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Visit schedule</Text>
      {visits.map((visit) => (
        <View key={visit.id} style={styles.card}>
          <Text style={styles.cardTitle}>{visit.listing}</Text>
          <Text style={styles.body}>{visit.time}</Text>
          <Text style={styles.body}>Guest: {visit.guest}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 12,
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
    gap: 4,
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
