import React, { useContext, useState, useMemo, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { Text, IconButton, Badge, Portal, Dialog, Button } from "react-native-paper"
import { usePaperColorScheme } from "../theme/theme"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"
import { loginStorage } from "../storage/appStorage"
import DialogBox from "./DialogBox"
import normalize from "react-native-normalize"

interface GKHeaderProps {
  title?: string;
  notificationCount?: number;
  pendingRequests?: any[];
}

export default function GKHeader({ title = "GK Dashboard", notificationCount = 0, pendingRequests = [] }: GKHeaderProps) {
  const theme = usePaperColorScheme()
  const { handleLogout } = useContext<AppStoreContext>(AppStore)
  const [logoutVisible, setLogoutVisible] = useState(() => false)
  const [popoverVisible, setPopoverVisible] = useState(false)

  const showLogoutDialog = () => setLogoutVisible(true)
  const hideLogoutDialog = () => setLogoutVisible(false)
  const togglePopover = () => setPopoverVisible(!popoverVisible)

  const hidePopover = () => setPopoverVisible(false)

  const loggingOut = () => {
    handleLogout()
    hideLogoutDialog()
  }
  const loginData = loginStorage.getString("login-data")
  if (!loginData) return
  const loginStore = JSON.parse(loginData)
  // useEffect(()=>{},[])
  useEffect(() => {

    console.log('GKHeader pendingRequests length:', pendingRequests.length);
  }, [pendingRequests]);

  return (
    <>
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level2 }]}>
        <View style={styles.headerTextContainer}>
          <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {loginStore?.user_name || 'User'} • {loginStore?.branch_name || 'Branch'}
          </Text>
        </View>
        <View style={styles.iconGroup}>
          {notificationCount > 0 && (
            <View style={styles.bellWrapper}>
              <IconButton
                icon="bell-outline"
                mode="contained-tonal"
                containerColor={theme.colors.secondaryContainer}
                iconColor={theme.colors.onSecondaryContainer}
                size={24}
                onPress={togglePopover}
              />
              <Badge style={styles.badge}>{notificationCount}</Badge>
            </View>
          )}
          <IconButton
            icon="logout"
            mode="contained-tonal"
            containerColor={theme.colors.errorContainer}
            iconColor={theme.colors.error}
            size={24}
            onPress={showLogoutDialog}
          />
        </View>
      </View>
      <DialogBox
        visible={logoutVisible}
        hide={hideLogoutDialog}
        onFailure={hideLogoutDialog}
        onSuccess={loggingOut}
        title="Logging Out"
        btnSuccess="YES">
        <Text variant="bodyMedium">Are you sure you want to log out?</Text>
      </DialogBox>
      {pendingRequests.length > 0 && (
        <Portal>
          <Dialog visible={popoverVisible} onDismiss={hidePopover} style={styles.dialog}>
            <Dialog.Title>Pending Requests</Dialog.Title>
            <Dialog.ScrollArea style={{ maxHeight: 'auto' }}>
              <View style={styles.dialogContent}>
                {pendingRequests.map((req, idx) => (
                  <View key={idx} style={styles.requestRow}>
                    <Text variant="bodySmall">
                      {req.user_name || req.user_id} – {new Date(req.request_date).toLocaleDateString()} – {req.request_type}
                    </Text>
                    <View style={{ height: 1, opacity: 0.3, backgroundColor: 'gray', marginVertical: normalize(8) }}></View>
                  </View>
                ))}
              </View>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={hidePopover}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellWrapper: {
    position: 'relative',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  dialog: {
    maxWidth: '90%',
  },
  dialogContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  requestRow: {
    marginBottom: 6,
  },
})


