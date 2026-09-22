import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import navigationRoutes from "../routes/navigationRoutes"
import { usePaperColorScheme } from "../theme/theme"
import SettingsNavigation from "./SettingsNavigation";
import DSDashboardScreen from "../screens/DSDashboardScreen";
import HomeNavigation from "./HomeNavigation"
import ReportsNavigation from "./ReportsNavigation"
import MoreNavigation from "./MoreNavigation"
import CalculateNavigation from "./CalculateModeNavigation"
import AddCustomerNavigation from "./AddCustomerNavigation"
import LeagueNavigation from "./LeagueNavigation"
import useCurrentRouteName from "../hooks/useCurrentRoute"
import { loginStorage } from "../storage/appStorage"
import { LoginDataMessage } from "../models/api_types"
import CategoriesScreen from "../screens/CategoriesScreen"

const Tab = createMaterialBottomTabNavigator()


function BottomNavigationPaper() {
  const theme = usePaperColorScheme()
  const currentRoute = useCurrentRouteName()
  const loginStore = JSON.parse(loginStorage.getString("login-data")) as LoginDataMessage

  console.log(loginStore, "CURRNT ROUTE: ", currentRoute)

  const shouldHideTabBar = ["BottomNavigationPaper", "Home", "HomeScreen", "More", "MoreScreen", "Reports", "ReportsScreen", "Settings", "SettingsScreen", "CalculateMode", "CalculateModeScreen", "AddCustomer", "AddCustomerScreen", "League", "LeagueScreen"].includes(currentRoute)


  return (
    <Tab.Navigator
      theme={theme}
      initialRouteName="Home"
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurface}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 0.4,
        borderColor: theme.colors.secondaryContainer,
        display: "flex"
      }}
      shifting
      compact
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigation}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons
                name="home-outline"
                color={color}
                size={26}
              />
            ) : (
              <MaterialCommunityIcons name="home" color={color} size={26} />
            ),
        }}
      />


      <Tab.Screen
        name="AddCustomer"
        component={AddCustomerNavigation}
        options={{
          tabBarLabel: "Customers",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons
                name="account-plus-outline"
                color={color}
                size={26}
              />
            ) : (
              <MaterialCommunityIcons name="account-plus" color={color} size={26} />
            ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: "Categories",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons name="tag-outline" color={color} size={26} />
            ) : (
              <MaterialCommunityIcons name="tag" color={color} size={26} />
            ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsNavigation}
        options={{
          tabBarLabel: "Reports",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons name="chart-bar-stacked" color={color} size={26} />
            ) : (
              <MaterialCommunityIcons name="chart-bar" color={color} size={26} />
            ),
        }}
      />
      {loginStore?.stock_flag !== 'N' && (
        <Tab.Screen
          name="Inventory"
          component={DSDashboardScreen}
          options={{
            tabBarLabel: "Inventory",
            tabBarIcon: ({ color, focused }) =>
              !focused ? (
                <MaterialCommunityIcons name="warehouse" color={color} size={26} />
              ) : (
                <MaterialCommunityIcons name="warehouse" color={color} size={26} />
              ),
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsNavigation}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons name="cog-outline" color={color} size={26} />
            ) : (
              <MaterialCommunityIcons name="cog" color={color} size={26} />
            ),
        }}
      />


      {/* <Tab.Screen
        name="More"
        component={MoreNavigation}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons name="dots-horizontal" color={color} size={26} />
            ) : (
              <MaterialCommunityIcons name="dots-horizontal" color={color} size={26} />
            ),
        }}
      /> */}
      {/* <Tab.Screen
        name="Calculate"
        component={CalculateNavigation}
        options={{
          tabBarLabel: "Calculate",
          tabBarIcon: ({ color, focused }) =>
            !focused ? (
              <MaterialCommunityIcons name="calculator-outline" color={color} size={26} />
            ) : (
              <MaterialCommunityIcons name="calculator" color={color} size={26} />
            ),
        }}
      /> */}


    </Tab.Navigator>
  )
}

export default BottomNavigationPaper
