// Main navigation handling with conditional landing for GKDashboardScreen based on user_type
import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { useNetInfo } from "@react-native-community/netinfo";
import navigationRoutes from "../routes/navigationRoutes";
import { AppStore } from "../context/AppContext";
import { AppStoreContext } from "../models/custom_types";
import BottomNavigationPaper from "./BottomNavigationPaper";
import NoInternetScreen from "../screens/NoInternetScreen";
import GKDashboardScreen from "../screens/GKDashboardScreen";
import GKPendingRequestsScreen from "../screens/GKPendingRequestsScreen";
import GKPurchaseStockScreen from "../screens/GKPurchaseStockScreen";
import DSLiveInventoryScreen from "../screens/DSLiveInventoryScreen";
import DSStockRequestScreen from "../screens/DSStockRequestScreen";
import LeagueScreen from "../screens/LeagueScreen";
import DSStockReturnScreen from "../screens/DSStockReturnScreen";
import LoginScreen from "../screens/LoginScreen";
import { loginStorage } from "../storage/appStorage";
const Stack = createNativeStackNavigator();

const MainNavigation = () => {
  const { isLogin } = useContext<AppStoreContext>(AppStore);
  const isConnected = useNetInfo().isConnected;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "simple_push" }}>
          {isLogin ? (
            isConnected ? (
              <>
                {/* Determine user type from stored login data */}
                {(() => {
                  const loginDataStr = loginStorage.getString("login-data") || "{}";
                  const loginData = JSON.parse(loginDataStr);
                  const userType = (loginData?.user_type ?? "").toUpperCase();
                           // Render GK screens only for user type G
                           if (userType === 'G') {
                             return (
                               <>
                                 <Stack.Screen
                                   name={navigationRoutes.gkDashboardScreen}
                                   component={GKDashboardScreen}
                                 />
                                 <Stack.Screen
                                   name={navigationRoutes.gkPendingRequestsScreen}
                                   component={GKPendingRequestsScreen}
                                 />
                                 <Stack.Screen
                                   name={navigationRoutes.gkPurchaseStockScreen}
                                   component={GKPurchaseStockScreen}
                                 />
                               </>
                             );
                           }
                           // Default authenticated flow for other users (e.g., U)
                           return (
                             <Stack.Screen
                               name={navigationRoutes.bottomNavigationPaper}
                               component={BottomNavigationPaper}
                             />
                           );
                })()}
              </>
            ) : (
              <Stack.Screen name={navigationRoutes.noInternetScreen} component={NoInternetScreen} />
            )
          ) : isConnected ? (
            <>
              <Stack.Screen name={navigationRoutes.login} component={LoginScreen} />
            </>
          ) : (
            <Stack.Screen name={navigationRoutes.noInternetScreen} component={NoInternetScreen} />
          )}
                  <Stack.Screen name={navigationRoutes.dsLiveInventoryScreen} component={DSLiveInventoryScreen} />
          <Stack.Screen name={navigationRoutes.dsStockRequestScreen} component={DSStockRequestScreen} />
          <Stack.Screen name={navigationRoutes.dsStockReturnScreen} component={DSStockReturnScreen} />
          </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default MainNavigation;
