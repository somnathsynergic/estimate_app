import { createNativeStackNavigator } from "@react-navigation/native-stack"
import navigationRoutes from "../routes/navigationRoutes"
import SettingsScreen from "../screens/SettingsScreen"

import HeaderFooterScreen from "../screens/HeaderFooterScreen"
import ManageProductsScreen from "../screens/ManageProductsScreen"
// import ReceiptSettingsEditScreen from "../screens/ReceiptSettingsEditScreen"
import LogoUploadScreen from "../screens/LogoUploadScreen"
import ProfileScreen from "../screens/ProfileScreen"
// import ChangePinScreen from "../screens/ChangePinScreen"
import ManageUnitsScreen from "../screens/ManageUnitsScreen"
// import InventoryScreen from "../screens/InventoryScreen"
import DSDashboardScreen from "../screens/DSDashboardScreen"
import DSStockRequestScreen from "../screens/DSStockRequestScreen"
import DSStockReturnScreen from "../screens/DSStockReturnScreen"
import SettingsMasterScreen from "../screens/SettingsMasterScreen"
import GeneralSettingsScreen from "../screens/GeneralSettingsScreen"
import DiscountSettingsScreen from "../screens/DiscountSettingsScreen"
import GstSettingsScreen from "../screens/GstSettingsScreen"
import UPIGenerateScreen from "../screens/UPIGenerateScreen"
import PrintMain from "../screens/printer_connect_screens/PrintMain"
import ManageCategoriesScreen from "../screens/ManageCategoriesScreen"
import CategoryProductsScreen from "../screens/CategoryProductsScreen"

export default function SettingsNavigation() {
  const Stack = createNativeStackNavigator()

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
      />
      {/* <Stack.Screen
        name={navigationRoutes.masterChooseScreen}
        component={MasterChooseScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.itemMasterScreen}
        component={ItemMasterScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.headerFooterScreen}
        component={HeaderFooterScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.manageProductsScreen}
        component={ManageProductsScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.manageCategoriesScreen}
        component={ManageCategoriesScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.manageUnitsScreen}
        component={ManageUnitsScreen}
      /> */}
      <Stack.Screen
        name="DSDashboardScreen"
        component={DSDashboardScreen}
      />
      <Stack.Screen
        name="DSStockRequestScreen"
        component={DSStockRequestScreen}
      />
      <Stack.Screen
        name="DSStockReturnScreen"
        component={DSStockReturnScreen}
      />
      {/* <Stack.Screen
        name={navigationRoutes.receiptSettingsEditScreen}
        component={ReceiptSettingsEditScreen}
      /> */}
      <Stack.Screen
        name="SettingsMasterScreen"
        component={SettingsMasterScreen}
      />
      {/* <Stack.Screen
        name={navigationRoutes.logoUploadScreen}
        component={LogoUploadScreen}
      /> */}
      <Stack.Screen name="PrintMainScreen" component={PrintMain} />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="GeneralSettingsScreen"
        component={GeneralSettingsScreen}
      />
      {/* <Stack.Screen
        name={navigationRoutes.discountSettingsScreen}
        component={DiscountSettingsScreen}
      />
      <Stack.Screen
        name="GstSettingsScreen"
        component={GstSettingsScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.upiGenerateScreen}
        component={UPIGenerateScreen}
      /> */}
      {/* <Stack.Screen
        name={navigationRoutes.changePinScreen}
        component={ChangePinScreen}
      /> */}

      <Stack.Screen
        name="CategoryProductsScreen"
        component={CategoryProductsScreen}
        options={{ animation: "simple_push" }}
      />
    </Stack.Navigator>
  )
}
