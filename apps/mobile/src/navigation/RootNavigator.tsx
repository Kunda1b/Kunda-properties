import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatScreen } from "../screens/ChatScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ListingCreateScreen } from "../screens/ListingCreateScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PropertyDetailScreen } from "../screens/PropertyDetailScreen";
import { VisitScheduleScreen } from "../screens/VisitScheduleScreen";

export type RootStackParamList = {
  Home: undefined;
  ListingCreate: undefined;
  PropertyDetail: { listingId: string };
  Chat: undefined;
  Profile: undefined;
  VisitSchedule: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: {
            backgroundColor: "#FAF9F5",
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Kunda Agent" }}
        />
        <Stack.Screen
          name="ListingCreate"
          component={ListingCreateScreen}
          options={{ title: "Create listing" }}
        />
        <Stack.Screen
          name="PropertyDetail"
          component={PropertyDetailScreen}
          options={{ title: "Property detail" }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Inbox" }} />
        <Stack.Screen
          name="VisitSchedule"
          component={VisitScheduleScreen}
          options={{ title: "Visit schedule" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
