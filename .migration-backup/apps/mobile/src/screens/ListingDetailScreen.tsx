import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export function ListingDetailScreen() {
  return (<SafeAreaView style={s.safe}><View style={s.center}><Text style={s.title}>ListingDetailScreen</Text></View></SafeAreaView>);
}
const s = StyleSheet.create({ safe:{flex:1,backgroundColor:"#f9fafb"}, center:{flex:1,alignItems:"center",justifyContent:"center"}, title:{fontSize:18,fontWeight:"700",color:"#111827"} });
