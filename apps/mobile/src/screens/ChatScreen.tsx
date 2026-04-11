import { ScrollView, StyleSheet, Text, View } from "react-native";

const messages = [
  {
    id: "msg-1",
    author: "Buyer",
    text: "Can the seller share a fresh video walkthrough before I travel?",
  },
  {
    id: "msg-2",
    author: "You",
    text: "Yes, I have queued that request and will upload once I am back online.",
  },
];

export function ChatScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Agent inbox</Text>
      {messages.map((message) => (
        <View key={message.id} style={styles.card}>
          <Text style={styles.author}>{message.author}</Text>
          <Text style={styles.body}>{message.text}</Text>
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
    gap: 6,
  },
  author: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#0F6E56",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#18261F",
  },
});
