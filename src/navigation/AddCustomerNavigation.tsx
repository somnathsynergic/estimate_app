import { createNativeStackNavigator } from "@react-navigation/native-stack"
import navigationRoutes from "../routes/navigationRoutes"
import AddCustomerScreen from "../screens/AddCustomerScreen"

export default function AddCustomerNavigation() {
  const Stack = createNativeStackNavigator()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={navigationRoutes.addCustomerScreen} component={AddCustomerScreen} />
    </Stack.Navigator>
  )
}
