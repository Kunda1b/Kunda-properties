import { StyleSheet, Text, View } from "react-native";
import { useSyncStatus } from "../hooks/useSyncStatus";

type Props = { message?: string };

export function SyncStatusBar({ message }: Props) {
  const sync = useSyncStatus();

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>{message ?? sync.label}</Text>
      <Text style={styles.subtext}>{sync.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#E1F5EE",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#5DCAA5",
  },
  text: {
    fontSize: 12,
    color: "#085041",
    fontWeight: "600",
  },
  subtext: {
    marginTop: 2,
    fontSize: 11,
    color: "#0B4F3F",
  },
});
