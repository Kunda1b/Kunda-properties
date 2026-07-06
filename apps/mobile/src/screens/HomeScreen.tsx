import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "../services/api";
import { useAuthStore } from "../store/auth.store";

export function HomeScreen() {
  const nav = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({ queryKey: ["featured"], queryFn: () => listingsApi.featured().then((r) => r.data.data) });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <View style={s.header}><Text style={s.greeting}>Hey, {user?.profile?.firstName || ""} 👋</Text><Text style={s.sub}>Find your home in The Gambia 🇬🇲</Text></View>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Featured Properties</Text>
          {isLoading ? <ActivityIndicator color="#1a5c3e"/> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data?.map((l: any) => (
                <TouchableOpacity key={l.id} style={s.card} onPress={() => nav.navigate("ListingDetail", { id: l.id })}>
                  {l.images?.[0] ? <Image source={{uri:l.images[0].thumbnailUrl}} style={s.cardImg}/> : <View style={[s.cardImg,s.cardImgPh]}><Text style={{fontSize:28}}>🏠</Text></View>}
                  <View style={s.cardBody}><Text style={s.cardPrice}>{l.currency} {Number(l.price).toLocaleString()}</Text><Text style={s.cardTitle} numberOfLines={2}>{l.title}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f9fafb"}, header:{padding:16}, greeting:{fontSize:22,fontWeight:"700",color:"#111827"}, sub:{fontSize:14,color:"#6b7280",marginTop:2},
  section:{marginTop:12,paddingHorizontal:16}, sectionTitle:{fontSize:18,fontWeight:"700",color:"#111827",marginBottom:12},
  card:{width:220,backgroundColor:"#fff",borderRadius:16,marginRight:12,overflow:"hidden"}, cardImg:{width:"100%",height:140}, cardImgPh:{backgroundColor:"#f0f9f4",alignItems:"center",justifyContent:"center"},
  cardBody:{padding:12}, cardPrice:{fontSize:16,fontWeight:"700",color:"#1a5c3e"}, cardTitle:{fontSize:13,color:"#111827",marginTop:3},
});
