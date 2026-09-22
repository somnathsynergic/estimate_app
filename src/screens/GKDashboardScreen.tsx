import { View, ScrollView, StyleSheet, Alert } from "react-native"
import React, { useState, useEffect, useContext } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text, Avatar, TouchableRipple, Portal, Dialog, Button, RadioButton, Badge } from "react-native-paper"
import { useIsFocused } from "@react-navigation/native"
import useGKInventory from "../hooks/api/useGKInventory"
import { usePaperColorScheme } from "../theme/theme"
import { useNavigation } from "@react-navigation/native"
import navigationRoutes from "../routes/navigationRoutes"
import GKHeader from "../components/GKHeader"
import { loginStorage } from "../storage/appStorage"
import { LoginDataMessage } from "../models/api_types"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"

export default function GKDashboardScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation<any>()
  const isFocused = useIsFocused()
  const { fetchPendingRequests } = useGKInventory()
  const { handleLogout } = useContext<AppStoreContext>(AppStore)

  const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}') as LoginDataMessage

  const [requestTypeVisible, setRequestTypeVisible] = useState(false)
  const [selectedRequestType, setSelectedRequestType] = useState('issue')
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingRequests, setPendingRequests] = useState([])


  useEffect(() => {
    if (isFocused) {
      if (loginStore?.stock_flag === 'N') {
        Alert.alert(
          "Permission Denied",
          "Stock permission is not allowed at the moment.",
          [
            {
              text: "Logout",
              onPress: () => handleLogout()
            }
          ],
          { cancelable: false }
        )
        return
      }

      fetchPendingRequests().then(res => {
        if (res?.status === 1 && res?.data) {
          setPendingCount(res.data.length)
          setPendingRequests(res.data)
        } else {
          setPendingCount(0)
          setPendingRequests([])
        }
      }).catch(console.error)
    }
  }, [isFocused])

  const showRequestTypeDialog = () => setRequestTypeVisible(true)
  const hideRequestTypeDialog = () => setRequestTypeVisible(false)

  const handleNavigatePendingRequests = (type: string) => {
    hideRequestTypeDialog()
    navigation.navigate(navigationRoutes.gkPendingRequestsScreen, { type })
  }

  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.primary, height: "100%" }]}>
      <GKHeader title="Godown Keeper Dashboard" notificationCount={pendingCount} pendingRequests={pendingRequests} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          <TouchableRipple
            style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}
            onPress={showRequestTypeDialog}
            rippleColor="rgba(0, 0, 0, .2)"
            borderless
          >
            <View style={styles.cardContent}>
              <View>
                <Avatar.Icon size={64} icon="clipboard-text-outline" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
                {pendingCount > 0 && (
                  <Badge style={{ position: 'absolute', bottom: -4, right: -4 }}>
                    {pendingCount}
                  </Badge>
                )}
              </View>
              <Text variant="titleMedium" style={[styles.cardText, { color: theme.colors.onSurface }]}>View Pending Requests</Text>
            </View>
          </TouchableRipple>

          <TouchableRipple
            style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}
            onPress={() => navigation.navigate(navigationRoutes.gkPurchaseStockScreen)}
            rippleColor="rgba(0, 0, 0, .2)"
            borderless
          >
            <View style={styles.cardContent}>
              <Avatar.Icon size={64} icon="package-variant-closed" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
              <Text variant="titleMedium" style={[styles.cardText, { color: theme.colors.onSurface }]}>Push Stock</Text>
            </View>
          </TouchableRipple>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={requestTypeVisible} onDismiss={hideRequestTypeDialog}>
          <Dialog.Title>Select Request Type</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={newValue => setSelectedRequestType(newValue)} value={selectedRequestType}>
              <RadioButton.Item label="Issue" value="issue" mode="android" />
              <RadioButton.Item label="Return" value="return" mode="android" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideRequestTypeDialog}>CANCEL</Button>
            <Button onPress={() => handleNavigatePendingRequests(selectedRequestType)} mode="text">PROCEED</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    textAlign: 'center',
    fontWeight: '600',
  }
})
