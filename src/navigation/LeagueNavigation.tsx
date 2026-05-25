import { createNativeStackNavigator } from "@react-navigation/native-stack"
import navigationRoutes from "../routes/navigationRoutes"
import LeagueScreen from "../screens/LeagueScreen"

export default function LeagueNavigation() {
  const Stack = createNativeStackNavigator()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={navigationRoutes.leagueScreen} component={LeagueScreen} />
    </Stack.Navigator>
  )
}
