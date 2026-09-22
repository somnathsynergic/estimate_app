import { PropsWithChildren, useContext, useEffect, useState } from "react"
import {
  useColorScheme,
  StyleSheet,
  View, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback,
} from "react-native"
import LinearGradient from "react-native-linear-gradient"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import { IconButton, Text, Searchbar } from "react-native-paper"

import { usePaperColorScheme } from "../theme/theme"
import { CommonActions, useNavigation, useIsFocused } from "@react-navigation/native"

import ButtonPaper from "./ButtonPaper"
import navigationRoutes from "../routes/navigationRoutes"
import CustomerSelector from "./CustomerSelector"
import { AppStore } from "../context/AppContext"
import { AppStoreContext } from "../models/custom_types"
import useCustomerList from "../hooks/api/useCustomerList"
import { loginStorage } from "../storage/appStorage"

type HeaderImageProps = {
  imgLight: { uri: string }
  imgDark?: { uri: string }
  borderRadius?: number
  blur?: number
  isBackEnabled?: boolean
  isBackCustom?: boolean
  backPressed?: () => void
  categoryName?: string
  showProductSearch?: boolean
  showCustomerSelector?: boolean
}

export default function HeaderImage({
  imgLight,
  imgDark,
  borderRadius,
  blur,
  children,
  isBackEnabled,
  isBackCustom = false,
  backPressed,
  categoryName = "",
  showProductSearch = true,
  showCustomerSelector = true,
}: PropsWithChildren<HeaderImageProps>) {
  const colorScheme = useColorScheme()
  const theme = usePaperColorScheme()
  const navigation = useNavigation()

  const { customer, setCustomer } = useContext<AppStoreContext>(AppStore)
  const { fetchCustomerList } = useCustomerList()
  const [custData, setCustData] = useState<any[]>([])
  const [selectedCustId, setSelectedCustId] = useState<number | null>(
    () => customer?.value || null,
  )
  const [modalVisible, setModalVisible] = useState(false)
  const [customerSearch, setCustomerSearch] = useState<string>('')


  useEffect(() => {
    setSelectedCustId(customer?.value || null)
  }, [customer])

  const isFocused = useIsFocused()

  useEffect(() => {
    if (!showCustomerSelector || !isFocused) return
    const loginData = loginStorage.getString("login-data")
    if (!loginData) return
    const loginStore = JSON.parse(loginData)
    const creds = {
      comp_id: loginStore?.comp_id,
      user_id: loginStore?.user_id,
    }
    fetchCustomerList(creds)
      .then(res => {
        const list = (res?.data || []) as any[]
        setCustData(
          list.map(item => ({
            label: `${item?.cust_name} (ID: ${item?.cust_id})`,
            value: item?.cust_id,
            name: item?.cust_name,
            phone: item?.phone_no,
          })),
        )
      })
      .catch(err => console.log("HeaderImage: Error fetching customers", err))
  }, [showCustomerSelector, isFocused])

  return (
    <>
      {/* Product Search Button */}
      {showProductSearch && (
        <View style={{ alignSelf: "center", width: "85%", marginBottom: normalize(10), paddingTop: normalize(10) }}>
          <ButtonPaper
            icon="magnify-scan"
            mode="contained"
            buttonColor={theme.colors.purpleContainer}
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoryProductsScreen,
                  params: { category_id: 0, category_name: "All Items", category_photo: "" },
                }),
              )
            }
            textColor={theme.colors.onPurpleContainer}
          >
            SEARCH PRODUCTS
          </ButtonPaper>
        </View>
      )}

      {/* Back Button */}
      {isBackEnabled && (
        <View>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onPrimary}
            size={20}
            onPress={
              !isBackCustom
                ? () => navigation.dispatch(CommonActions.goBack())
                : () => backPressed?.()
            }
            style={{ position: "absolute", top: SCREEN_HEIGHT / 40, right: SCREEN_WIDTH / 3.2, zIndex: 10 }}
          />
        </View>
      )}

      {/* Header Container */}
      <View
        style={[
          styles.surface,
          showCustomerSelector && styles.surfaceWithSelector,
          { marginVertical: 15, backgroundColor: '#090446', elevation: 4 },
        ]}
      >
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text variant="headlineMedium" style={[styles.titleText, { color: '#FFFFFF', fontFamily: 'ProductSans-Bold' }]}>{children}</Text>
          {categoryName ? (
            <Text variant="bodySmall" style={[styles.categoryText, { color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'ProductSans-Medium', fontSize: 15, marginVertical: 20 }]}>Category: {categoryName}</Text>
          ) : null}
        </View>

        {/* Customer Selector */}
        {showCustomerSelector && (
          <>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selectorWrapper}>
              <Text style={{ color: theme.colors.primary, backgroundColor: 'white', padding: 10, marginVertical: -10 }}>{selectedCustId ? custData.find(c => c.value === selectedCustId)?.label : "Select Customer"}</Text>
            </TouchableOpacity>
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
              <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View style={styles.modalOverlay} />
              </TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Customer</Text>
                  <IconButton icon="close" size={20} onPress={() => setModalVisible(false)} />
                </View>

                <View style={styles.searchWrapper}>
                  <Searchbar
                    placeholder="Search Customer"
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                </View>

                <FlatList
                  data={custData.filter(item => {
                    const q = customerSearch.trim().toLowerCase()
                    if (!q) return true
                    const label = (item?.label ?? '').toString().toLowerCase()
                    const value = (item?.value ?? '').toString().toLowerCase()
                    return label.includes(q) || value.includes(q)
                  })}
                  keyExtractor={item => item.value?.toString() ?? ''}
                  renderItem={({ item }) => (

                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedCustId(item.value)
                        setCustomer(item)
                        setModalVisible(false)
                      }}
                    >
                      <Text>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </Modal>
          </>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  surface: {
    margin: normalize(20),
    padding: normalize(20),
    // borderRadius: normalize(30),
    width: SCREEN_WIDTH / 1.13,
    alignItems: "center",
    justifyContent: "center",
  },
  surfaceWithSelector: {
    height: SCREEN_HEIGHT / 8,
    justifyContent: "space-between",
    paddingVertical: normalize(20),
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titleText: {
    fontFamily: "ProductSans-Medium",
    textAlign: "center",
  },
  categoryText: {
    fontStyle: "italic",
    textDecorationLine: "underline",
    marginTop: normalize(4),
  },
  selectorWrapper: {
    width: "100%",
    paddingHorizontal: normalize(4),
    paddingVertical: normalize(4),
    marginBottom: normalize(4),
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: SCREEN_WIDTH,
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchWrapper: {
    marginVertical: 8,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
})

