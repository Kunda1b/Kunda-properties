import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Search, Heart, DollarSign, User } from "lucide-react-native";
import { useAuthStore } from "../store/auth.store";
import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SavedScreen } from "../screens/SavedScreen";
import { EscrowScreen } from "../screens/EscrowScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { ListingDetailScreen } from "../screens/ListingDetailScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1a5c3e", tabBarInactiveTintColor: "#9ca3af" }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({color,size}) => <Home color={color} size={size}/> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({color,size}) => <Search color={color} size={size}/> }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ tabBarIcon: ({color,size}) => <Heart color={color} size={size}/> }} />
      <Tab.Screen name="Escrow" component={EscrowScreen} options={{ tabBarIcon: ({color,size}) => <DollarSign color={color} size={size}/> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({color,size}) => <User color={color} size={size}/> }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ headerShown: true, title: "Property Details" }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
