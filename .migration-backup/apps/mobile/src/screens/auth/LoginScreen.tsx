import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../services/api";
import { useAuthStore } from "../../store/auth.store";

export function LoginScreen() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  const submit = async () => {
    setLoading(true);
    try { const res = await authApi.login({ email, password }); const { user, accessToken, refreshToken } = res.data.data; loginSuccess(user, accessToken, refreshToken); }
    catch (e: any) { Alert.alert("Login Failed", e?.response?.data?.error || "Check your credentials"); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.logoArea}><Text style={s.logo}>Kunda<Text style={s.logoDot}>.</Text></Text><Text style={s.logoSub}>🇬🇲 Gambia's Diaspora Property Platform</Text></View>
      <View style={s.card}>
        <Text style={s.heading}>Welcome back</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry/>
        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnText}>Sign In</Text>}</TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#1a5c3e"}, logoArea:{alignItems:"center",paddingVertical:60}, logo:{fontSize:42,fontWeight:"800",color:"#fff"}, logoDot:{color:"#d4831f"}, logoSub:{color:"rgba(255,255,255,0.7)",marginTop:6,fontSize:14},
  card:{backgroundColor:"#fff",borderRadius:20,padding:24,margin:20}, heading:{fontSize:24,fontWeight:"700",color:"#111827",marginBottom:20},
  input:{borderWidth:1,borderColor:"#e5e7eb",borderRadius:10,paddingHorizontal:14,paddingVertical:12,fontSize:15,marginBottom:12},
  btn:{backgroundColor:"#1a5c3e",borderRadius:10,paddingVertical:14,alignItems:"center",marginTop:8}, btnText:{color:"#fff",fontWeight:"700",fontSize:16},
});
