import { StyleSheet, Text, View } from "react-native";
import { useCameraAccess } from "../hooks/useCameraAccess";

export function CameraPicker() {
  const access = useCameraAccess();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Camera capture</Text>
      <Text style={styles.body}>{access.label}</Text>
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
