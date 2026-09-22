import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native"
import React, { useEffect, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text } from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import ButtonPaper from "../components/ButtonPaper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Card } from "react-native-paper";
import { Dialog, Button } from "react-native-paper";

import useDSInventory from "../hooks/api/useDSInventory"
import { useNavigation, useIsFocused } from "@react-navigation/native"
import navigationRoutes from "../routes/navigationRoutes"
import { loginStorage } from "../storage/appStorage"

export default function DSDashboardScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation<any>()
  const isFocused = useIsFocused()
  const { fetchDashboard } = useDSInventory()
  const [inventory, setInventory] = useState<any>([])
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  const openReturnDialog = () => setShowReturnDialog(true);
  const closeReturnDialog = () => setShowReturnDialog(false);

  const navigateToReturn = (type) => {
    closeReturnDialog();
    navigation.navigate(navigationRoutes.dsStockReturnScreen, { claimType: type });
  };

  const loginData = loginStorage.getString("login-data")
  if (!loginData) return
  const loginStore = JSON.parse(loginData)
  useEffect(() => {
    const loadData = async () => {
      setLoadingDashboard(true);
      try {
        const res = await fetchDashboard();
        if (res.status === 1) {
          setInventory(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDashboard(false);
        setRefreshing(false);
      }
    };
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard().then(res => {
      if (res.status === 1) {
        setInventory(res.data);
      }
    }).catch(console.error).finally(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={{ padding: 20 }}>
          <Text variant="headlineMedium" style={{ color: "#FFFFFF", marginBottom: 20 }}>Inventory Dashboard</Text>

          {loadingDashboard ? (
            <ActivityIndicator animating={true} size="large" color="#FFFFFF" />
          ) : (

            <View style={{ flexDirection: "column", marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 20 }}>
                <Card style={{ width: '45%', height: '45%', margin: 5 }} onPress={() => navigation.navigate(navigationRoutes.dsLiveInventoryScreen)}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="warehouse" size={16} color={theme.colors.primary} />
                      <Text style={{ textAlign: 'center', color: theme.colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>Live Inventory</Text>
                    </View>
                  </Card.Content>
                </Card>
                <Card style={{ width: '45%', margin: 5 }} onPress={() => navigation.navigate(navigationRoutes.dsStockRequestScreen)}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="plus-box" size={16} color={theme.colors.primary} />
                      <Text style={{ textAlign: 'center', color: theme.colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>Request Stock</Text>
                    </View>
                  </Card.Content>
                </Card>
                <Card style={{ width: '45%', margin: 5 }} onPress={openReturnDialog}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="trash-can" size={16} color={theme.colors.primary} />
                      <Text style={{ textAlign: 'center', color: theme.colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>Return</Text>
                    </View>
                  </Card.Content>
                </Card>
                {loginStore?.stock_push_do_flag == 'Y' && (
                  <Card style={{ width: '45%', margin: 5 }} onPress={() => navigation.navigate(navigationRoutes.upushStockScreen)}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
                        <Text style={{ textAlign: 'center', color: theme.colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 }}>Add</Text>
                      </View>
                    </Card.Content>
                  </Card>
                )}
              </View>


            </View>
          )
          }
        </View>
      </ScrollView>

      <Dialog visible={showReturnDialog} onDismiss={closeReturnDialog}>
        <Dialog.Title>Select Return Type</Dialog.Title>
        <Dialog.Content>
          <Button onPress={() => navigateToReturn('DAMAGE')}>Damage</Button>
          <Button onPress={() => navigateToReturn('THEFT')}>Theft</Button>
          <Button onPress={() => navigateToReturn('RETURN')}>Return</Button>
        </Dialog.Content>
      </Dialog>
    </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8
  }
})
