import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  RefreshControl,
  Alert,
  Linking,
<<<<<<< Updated upstream
  Animated,
} from "react-native"
import React, { useCallback, useContext, useEffect, useState } from "react"
import SplashScreen from "react-native-splash-screen"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
=======
  Text as NativeText,
} from "react-native"
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react"
import SplashScreen from "react-native-splash-screen"
import AnimatedFABPaper from "../components/AnimatedFABPaper"

const MaterialCommunityIcons = ({
  name,
  size,
  color,
  style,
}: {
  name: string
  size: number
  color: string
  style?: any
}) => {
  const emojiMap: { [key: string]: string } = {
    "cash-multiple": "💰",
    receipt: "🧾",
    "receipt-text-outline": "🧾",
    trophy: "🏆",
    "chevron-right": "›",
    history: "🕐",
    basket: "🛒",
  }
  return (
    <NativeText style={[{ fontSize: size, color, textAlign: "center" }, style]}>
      {emojiMap[name] || "•"}
    </NativeText>
  )
}
>>>>>>> Stashed changes
import {
  Button,
  Dialog,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper"
<<<<<<< Updated upstream
=======
import CustomerSelector from "../components/CustomerSelector"
>>>>>>> Stashed changes
import { usePaperColorScheme } from "../theme/theme"
import HeaderImage from "../components/HeaderImage"
import { hills, hillsDark } from "../resources/images"
import navigationRoutes from "../routes/navigationRoutes"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native"
import DialogBox from "../components/DialogBox"
import normalize from "react-native-normalize"
import { loginStorage } from "../storage/appStorage"
import {
  CalculatorShowBillData,
  LoginDataMessage,
  RecentBillsData,
  ShowBillData,
} from "../models/api_types"
import { AppStore } from "../context/AppContext"
import useBillSummary from "../hooks/api/useBillSummary"
import useRecentBills from "../hooks/api/useRecentBills"
import useShowBill from "../hooks/api/useShowBill"
import useCalculatorShowBill from "../hooks/api/useCalculatorShowBill"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import useVersionCheck from "../hooks/api/useVersionCheck"
import DeviceInfo from "react-native-device-info"
import ButtonPaper from "../components/ButtonPaper"
import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import DialogForBillsInCalculatorMode from "../components/DialogForBillsInCalculatorMode"
import { AppStoreContext } from "../models/custom_types"

export default function HomeScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const rootNavigation = navigation as any
  const isFocused = useIsFocused()
  const { params } = useRoute<any>()

  let version = DeviceInfo.getVersion()

<<<<<<< Updated upstream
  const { handleGetReceiptSettings } = useContext<AppStoreContext>(AppStore)
=======
  const {
    handleGetReceiptSettings,
    customer,
    setCustomer,
    justLoggedIn,
    setJustLoggedIn,
    handleLogout,
    customerList,
    handleGetCustomerList,
  } = useContext<AppStoreContext>(AppStore)
>>>>>>> Stashed changes

  const { fetchBillSummary } = useBillSummary()
  const { fetchRecentBills } = useRecentBills()
  const { fetchBill } = useShowBill()
  const { fetchVersionInfo } = useVersionCheck()
  const { printDuplicateBillCalculateMode, rePrintT } = useBluetoothPrint()
  const { cancelBill } = useCancelBill()
  const { fetchCalcBill } = useCalculatorShowBill()
  const { grandTotalCalculate } = useCalculations()

  const loginStore = JSON.parse(
    loginStorage.getString("login-data"),
  ) as LoginDataMessage
  // let loginStore

  // try {
  //   const loginData = loginStorage.getString("login-data")

  //   loginStore = loginData ? JSON.parse(loginData) : {}
  // } catch (error) {
  //   console.error("Failed to parse login-data:", error)
  //   loginStore = {}
  // }

  const [isExtended, setIsExtended] = useState<boolean>(() => true)

  const [totalBills, setTotalBills] = useState<number | undefined>(
    () => undefined,
  )
  const [amountCollected, setAmountCollected] = useState<number | undefined>(
    () => undefined,
  )
  const [recentBills, setRecentBills] = useState<RecentBillsData[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])
  const [currentReceiptNo, setCurrentReceiptNo] = useState<string | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [refreshing, setRefreshing] = useState<boolean>(() => false)
  const [updateUrl, setUpdateUrl] = useState<string>()

  const [visible, setVisible] = useState<boolean>(() => false)
  const hideDialog = () => setVisible(() => false)

  const [visible2, setVisible2] = useState<boolean>(() => false)
  const hideDialog2 = () => setVisible2(() => false)

  const [visibleUpdatePortal, setVisibleUpdatePortal] = useState<boolean>(
    () => false,
  )

  const [calculatorModeBillArray, setCalculatorModeBillArray] = useState<
    CalculatorShowBillData[]
  >(() => [])

<<<<<<< Updated upstream
=======
  // Login-time customer picker
  const [custPickerVisible, setCustPickerVisible] = useState(() => false)
  const [custPickerSelected, setCustPickerSelected] = useState<number | null>(
    () => null,
  )

  const dismissCustPicker = () => {
    setCustPickerVisible(false)
    setJustLoggedIn(false)
  }

  const confirmCustPicker = () => {
    dismissCustPicker()
  }

>>>>>>> Stashed changes
  const showDialogForAppUpdate = () => setVisibleUpdatePortal(true)

  let today = new Date()
  let year = today.getFullYear()
  let month = ("0" + (today.getMonth() + 1)).slice(-2)
  let day = ("0" + today.getDate()).slice(-2)
  let formattedDate = year + "-" + month + "-" + day

  // let netTotal = 0
  // let totalDiscount = 0

  useEffect(() => {
    SplashScreen.hide()

    return () => SplashScreen.hide()
  }, [])

<<<<<<< Updated upstream
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    handleGetReceiptSettings()
    // handleGetBillSummary()
    handleGetRecentBills()
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

=======
>>>>>>> Stashed changes
  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0

    setIsExtended(currentScrollPosition <= 0)
  }

  const onDialogFailure = () => {
    setVisible(false)
  }

  const onDialogSuccecss = (calculatorMode = false) => {
    setVisible(false)

    if (!calculatorMode) {
      handleRePrintReceipt(false)
    } else {
      handleRePrintReceiptForCalculatorMode()
    }
  }

  const handleRePrintReceipt = (cancelFlag: boolean) => {
    if (billedSaleData.length > 0) {
      // gstFlag === "N"
      //   ? rePrintWithoutGst(
      //     billedSaleData,
      //     // netTotal,
      //     billedSaleData[0]?.tprice,
      //     // totalDiscount,
      //     billedSaleData[0]?.tdiscount_amt,
      //     billedSaleData[0]?.received_amt,
      //     billedSaleData[0]?.received_amt !== undefined
      //       ? billedSaleData[0]?.received_amt -
      //       grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
      //       : 0,
      //     billedSaleData[0]?.cust_name,
      //     billedSaleData[0]?.phone_no,
      //     billedSaleData[0]?.receipt_no,
      //     billedSaleData[0]?.pay_mode,
      //     false,
      //     false,
      //     cancelFlag,
      //   )
      //   : gstType === "E"
      //     ? rePrint(
      //       billedSaleData,
      //       // netTotal,
      //       billedSaleData[0]?.tprice,
      //       // totalDiscount,
      //       billedSaleData[0]?.tdiscount_amt,
      //       billedSaleData[0]?.received_amt,
      //       billedSaleData[0]?.received_amt !== undefined
      //         ? billedSaleData[0]?.received_amt -
      //         parseFloat(
      //           grandTotalWithGSTCalculate(
      //             billedSaleData[0]?.tprice,
      //             billedSaleData[0]?.tdiscount_amt,
      //             billedSaleData[0]?.tcgst_amt * 2,
      //           ),
      //         )
      //         : 0,
      //       billedSaleData[0]?.cust_name,
      //       billedSaleData[0]?.phone_no,
      //       billedSaleData[0]?.receipt_no,
      //       billedSaleData[0]?.pay_mode,
      //       false,
      //       false,
      //       cancelFlag,
      //     )
      //     : rePrint(
      //       billedSaleData,
      //       // netTotal,
      //       billedSaleData[0]?.tprice,
      //       // totalDiscount,
      //       billedSaleData[0]?.tdiscount_amt,
      //       billedSaleData[0]?.received_amt,
      //       billedSaleData[0]?.received_amt !== undefined
      //         ? billedSaleData[0]?.received_amt -
      //         parseFloat(
      //           grandTotalWithGSTInclCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt),
      //         )
      //         : 0,
      //       billedSaleData[0]?.cust_name,
      //       billedSaleData[0]?.phone_no,
      //       billedSaleData[0]?.receipt_no,
      //       billedSaleData[0]?.pay_mode,
      //       false,
      //       false,
      //       cancelFlag,
      //     )

      rePrintT(
        billedSaleData,
        // netTotal,
        billedSaleData[0]?.tprice,
        // totalDiscount,
        billedSaleData[0]?.tdiscount_amt,
        billedSaleData[0]?.received_amt,
        billedSaleData[0]?.received_amt !== undefined
          ? billedSaleData[0]?.received_amt -
              grandTotalCalculate(
                billedSaleData[0]?.tprice,
                billedSaleData[0]?.tdiscount_amt,
              )
          : 0,
        billedSaleData[0]?.cust_name,
        billedSaleData[0]?.phone_no,
        billedSaleData[0]?.receipt_no,
        billedSaleData[0]?.pay_mode,
        false,
        false,
        cancelFlag,
      )
    } else {
      ToastAndroid.show("Something went wrong!", ToastAndroid.SHORT)
      return
    }
  }

  const handleRePrintReceiptForCalculatorMode = () => {
    printDuplicateBillCalculateMode(calculatorModeBillArray)
      .then(() => {
        hideDialog2()
      })
      .catch(_err => {
        ToastAndroid.show(
          "Some error while re-printing in Calculate mode.",
          ToastAndroid.SHORT,
        )
      })
  }

<<<<<<< Updated upstream
  // const handleGetBillSummary = async () => {
  //   await fetchBillSummary(
  //     formattedDate,
  //     loginStore.comp_id,
  //     loginStore.br_id,
  //     loginStore.user_id,
  //   )
  //     .then(res => {
  //       setTotalBills(res?.data[0]?.total_bills)
  //       setAmountCollected(res?.data[0]?.amount_collected)
  //     })
  //     .catch(err => {
  //       ToastAndroid.show(
  //         "Check your internet connection or something went wrong in the server.",
  //         ToastAndroid.SHORT,
  //       )
  //       console.log("handleGetBillSummary - HomeScreen", err, formattedDate)
  //     })
  // }
=======
  const handleGetBillSummary = async () => {
    await fetchBillSummary(
      today,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
      null,
    )
      .then(_res => {
        // setTotalBills(res?.data[0]?.total_bills)
        // setAmountCollected(res?.data[0]?.amount_collected)
      })
      .catch(_err => {
        ToastAndroid.show(
          "Check your internet connection or something went wrong in the server.",
          ToastAndroid.SHORT,
        )
        console.log("handleGetBillSummary - HomeScreen", _err, today)
      })
  }
>>>>>>> Stashed changes

  const handleGetRecentBills = async () => {
    await fetchRecentBills(
      formattedDate,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
<<<<<<< Updated upstream
=======
      null,
>>>>>>> Stashed changes
    )
      .then(res => {
        setRecentBills(res)
      })
      .catch(_err => {
        ToastAndroid.show(
          "Error during fetching recent bills.",
          ToastAndroid.SHORT,
        )
      })
  }

  const handleGetVersion = async () => {
    await fetchVersionInfo()
      .then(res => {
        if (parseFloat(res?.data[0]?.version_no) > parseFloat(version)) {
          showDialogForAppUpdate()
          // Alert.alert("UPDATE FOUND!", "Please update your app.")
        }
        setUpdateUrl(res?.data[0]?.url)
      })
      .catch(_err => {
        ToastAndroid.show(
          "Error during getting version info.",
          ToastAndroid.SHORT,
        )
      })
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    handleGetReceiptSettings()
    handleGetBillSummary()
    handleGetRecentBills()
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

  useEffect(() => {
    // handleGetBillSummary()
    handleGetRecentBills()

    handleGetVersion()
  }, [isFocused])

  const updateApp = () => {
    Linking.openURL(updateUrl)
  }

  const handleGetBill = async (rcptNo: string) => {
    await fetchBill(rcptNo)
      .then(res => {
<<<<<<< Updated upstream
=======
        console.log(res?.data, "mmmmmmmmmmmmmmm")
>>>>>>> Stashed changes
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
        console.log(rcptNo, "handleGetBill - HOMESCREEN - fetchBill", res?.data)
      })
      .catch(_err => {
        ToastAndroid.show("Error during fetching old bill", ToastAndroid.SHORT)
      })
  }

  const handleGetBillCalculatorMode = async (rcptNo: string) => {
    await fetchCalcBill(rcptNo).then(res => {
      setCalculatorModeBillArray(res?.data)
    })
  }

  const handleRecentBillListClick = (rcptNo: string) => {
    setVisible(true)
    handleGetBill(rcptNo)
    setCurrentReceiptNo(rcptNo)
  }

  const handleBillListClickCalculatorMode = (rcptNo: string) => {
    setVisible2(true)
    setCurrentReceiptNo(rcptNo)
    handleGetBillCalculatorMode(rcptNo)
  }

  const handleCancellingBill = async (rcptNo: string) => {
    await cancelBill(rcptNo, loginStore.user_id)
      .then(res => {
        if (res?.status === 1) {
          // ToastAndroid.show(res?.data, ToastAndroid.SHORT)
          Alert.alert("Alert", "Estimate cancelled.")
          console.log("++++++++++++++++++++++-----------------------", res)
          // handleRePrintReceipt(true)
          setVisible(false)
        }
      })
      .catch(err => {
        // ToastAndroid.show(`Error occurred during cancelling bill. ${err}`, ToastAndroid.SHORT)
        console.log("uireeeeeeeeeeee wtucrsduyrtgsueyctuwe", err)
        setVisible(false)
      })

    // handleGetBillSummary()
    handleGetRecentBills()
  }

  const handleCancelBill = (rcptNo: string) => {
    Alert.alert(
      "Cancelling Bill",
      `Are you sure you want to cancel this bill?`,
      [
        { text: "BACK", onPress: () => null },
        {
          text: "CANCEL BILL",
          onPress: async () => {
            await handleCancellingBill(rcptNo)
            if (params?.receipt_number) {
              navigation.dispatch(
                CommonActions.setParams({ receipt_number: undefined }),
              )
            }
          },
        },
      ],
      { cancelable: false },
    )
  }

<<<<<<< Updated upstream
  let totalQty: number = 0

  useEffect(() => {
    if (isFocused && params?.receipt_number) {
      handleRecentBillListClick(params.receipt_number)
=======
  // useEffect(() => {
  //   if (isFocused && params?.receipt_number) {
  //     handleRecentBillListClick(params.receipt_number)
>>>>>>> Stashed changes

      // navigation.dispatch(
      //   CommonActions.setParams({ receipt_number: undefined })
      // )
    }
  }, [isFocused, params?.receipt_number])

  const onDialogSuccess = () => {
    navigation.dispatch(CommonActions.setParams({ receipt_number: undefined }))
  }

  const [logoutVisible, setLogoutVisible] = useState(() => false)
  const showLogoutDialog = () => setLogoutVisible(true)
  const hideLogoutDialog = () => setLogoutVisible(false)

  const loggingOut = () => {
    handleLogout()
    hideLogoutDialog()
  }

  const handleLogoutPress = () => {
    showLogoutDialog()
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        onScroll={onScroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={{ alignItems: "center" }}>
<<<<<<< Updated upstream
          <HeaderImage
            imgLight={hills}
            imgDark={hillsDark}
            borderRadius={30}
            blur={10}>
            {/* Welcome Back, Estimate! */}
            Welcome, {loginStore.user_name} 
            {/* {JSON.stringify(loginStore?.id, null, 2)}  */}
          </HeaderImage>
        </View>

        {/* <View
          style={{
            alignSelf: "center",
            width: "85%",
            marginTop: -9,
            paddingBottom: normalize(10),
          }}>
          <ButtonPaper
            icon="magnify-scan"
            mode="contained"
            buttonColor={theme.colors.purpleContainer}
            onPress={() => navigation.dispatch(
              CommonActions.navigate(
                {
                  name: navigationRoutes.categoryProductsScreen,
                  params: {
                    category_id: 0,
                    category_name: "All Items",
                    category_photo: ""
                  }
                }
              )
            )}
            textColor={theme.colors.onPurpleContainer}>
            SEARCH PRODUCTS
          </ButtonPaper>
        </View> */}
=======
          <View style={{ width: "100%" }}>
            <HeaderImage
              imgLight={hills}
              imgDark={hillsDark}
              borderRadius={30}
              blur={10}
              showCustomerSelector
              showProductSearch={false}>
              Welcome, {loginStore?.user_name}
            </HeaderImage>
          </View>
        </View>

        <Portal>
          <Dialog
            visible={custPickerVisible}
            onDismiss={dismissCustPicker}
            dismissable={false}
            style={{ borderRadius: normalize(20) }}>
            <Dialog.Title style={{ textAlign: "center" }}>
              Select Customer
            </Dialog.Title>
            <Dialog.Content>
              <Text
                variant="bodyMedium"
                style={{ marginBottom: normalize(12), opacity: 0.7 }}>
                Choose a customer to filter data.
              </Text>
              <CustomerSelector
                data={customerList}
                value={custPickerSelected}
                onChange={item => {
                  setCustPickerSelected(item.value)
                  setCustomer(item)
                }}
                placeholder="Search customer..."
              />
            </Dialog.Content>
            <Dialog.Actions
              style={{
                flexDirection: "column",
                gap: normalize(10),
                paddingHorizontal: normalize(20),
                paddingBottom: normalize(15),
              }}>
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                }}>
                <Button
                  mode="outlined"
                  onPress={handleLogoutPress}
                  style={{
                    borderRadius: normalize(10),
                    flex: 1,
                    marginRight: normalize(10),
                  }}
                  textColor={theme.colors.error}>
                  Logout
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmCustPicker}
                  disabled={!custPickerSelected}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={{ borderRadius: normalize(10), flex: 1 }}>
                  Confirm
                </Button>
              </View>
              <Button
                mode="text"
                onPress={() => {
                  setCustPickerVisible(false)
                  navigation.navigate("AddCustomer" as never)
                }}
                style={{ width: "100%" }}
                icon="account-plus-outline">
                Add New Customer
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
>>>>>>> Stashed changes

        <Portal>
          <Dialog visible={visibleUpdatePortal} dismissable={false}>
            <Dialog.Title>UPDATE FOUND!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Please update your app.</Text>
            </Dialog.Content>
            <Dialog.Actions>
<<<<<<< Updated upstream
              {/* <Button onPress={hideDialog}>Cancel</Button> */}
=======
>>>>>>> Stashed changes
              <Button onPress={updateApp}>Download</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

<<<<<<< Updated upstream
        <View style={{ alignItems: "center", marginTop: -10 }}>
          {/* <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled={false}
            paddingEnabled
            elevation={1}
            backgroundColor={theme.colors.peachContainer}
            style={{
              borderTopRightRadius: normalize(30),
              borderTopLeftRadius: normalize(30),
            }}>
            <View style={{ width: "100%", padding: normalize(15) }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}>
                <View>
                  <Text variant="titleLarge" style={{
                    color: theme.colors.onPeachContainer
                  }}>Amount Collected</Text>
                </View>
                <View>
                  <Text variant="titleLarge" style={{
                    color: theme.colors.onPeachContainer
                  }}>₹{amountCollected}</Text>
                </View>
              </View>
            </View>
          </SurfacePaper> */}

          <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled={false}
            paddingEnabled
            isBorderEnabled
            heading="Recent Activities"
            elevation={1}
            backgroundColor={theme.colors.tertiaryContainer}
            style={{
              borderBottomLeftRadius: normalize(30),
              borderBottomRightRadius: normalize(30),
            }}>
            <View style={{ width: "100%" }}>
              {recentBills?.length > 0 ?(
                <>
              {recentBills?.map((item, i) => (
                <List.Item
                  key={i}
                  title={`${item?.receipt_no}`}
                  description={`₹${item?.net_amt}`}
                  onPress={() => {
                    loginStore?.mode !== "C"
                      ? handleRecentBillListClick(item?.receipt_no)
                      : handleBillListClickCalculatorMode(item?.receipt_no)
                  }}
                  // onPress={() => null}
                  left={props => <List.Icon {...props} icon="basket" />}
                // right={props => (
                //   <List.Icon {...props} icon="download" />
                // )}
                />
              ))}
              </>
            ): <View style={styles.noActivity}>
                  <Text
                  variant="titleLarge"
                  style={[styles.noActivityTxt, {
                  color: theme.colors.onVanillaTertiaryContainer,
                  }]}>
                  {/* No items found in this category. */}
                  No activity found.
                  </Text>
                  </View>
            }
            </View>
            {/* <View>
              <Button
                textColor={theme.colors.onPinkContainer}
                onPress={() =>
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: navigationRoutes.allBillsScreen,
                    }),
                  )
                }>
                ALL BILLS
              </Button>
            </View> */}
          </SurfacePaper>
        </View>
      </ScrollView>

=======
        <View style={{ alignItems: "center", marginTop: -5, width: "100%" }}>
          <ButtonPaper
            icon="magnify-scan"
            mode="contained"
            buttonColor={theme.colors.primary}
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoryProductsScreen,
                  params: {
                    category_id: 0,
                    category_name: "All Items",
                    category_photo: "",
                  },
                }),
              )
            }
            textColor={theme.colors.onPrimary}
            style={{ borderRadius: 24, elevation: 4 }}>
            SEARCH PRODUCTS
          </ButtonPaper>
        </View>
        {/* Summary Section */}
        <View
          style={{
            alignSelf: "center",
            width: "85%",
            paddingTop: normalize(15),
          }}>
          <View
            style={{
              borderRadius: 24,
              padding: normalize(15),
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              backgroundColor: "#FFFFFF",
            }}>
            <Text
              style={{
                color: theme.colors.primary,
                fontFamily: "ProductSans-Bold",
                fontSize: normalize(12),
                marginBottom: normalize(12),
                textTransform: "uppercase",
                letterSpacing: 1,
                textAlign: "center",
              }}>
              TODAY'S SUMMARY
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <View
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    padding: normalize(8),
                    borderRadius: 10,
                    marginRight: normalize(8),
                  }}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      color: "#64748B",
                      fontFamily: "ProductSans-Medium",
                      fontSize: normalize(10),
                    }}>
                    Collected
                  </Text>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontFamily: "ProductSans-Bold",
                      fontSize: normalize(16),
                    }}>
                    ₹{displayAmountCollected || 0}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 1,
                  height: normalize(30),
                  backgroundColor: "#E2E8F0",
                  marginHorizontal: normalize(5),
                }}
              />
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <View
                  style={{
                    backgroundColor: theme.colors.secondaryContainer,
                    padding: normalize(8),
                    borderRadius: 10,
                    marginRight: normalize(8),
                  }}>
                  <MaterialCommunityIcons
                    name="receipt"
                    size={20}
                    color={theme.colors.secondary}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      color: "#64748B",
                      fontFamily: "ProductSans-Medium",
                      fontSize: normalize(10),
                    }}>
                    Total Bills
                  </Text>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontFamily: "ProductSans-Bold",
                      fontSize: normalize(16),
                    }}>
                    {displayTotalBills || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* League Dashboard */}
        <TouchableRipple
          onPress={() => navigation.navigate("League" as never)}
          rippleColor="rgba(255, 255, 255, .32)"
          style={{
            alignSelf: "center",
            width: "85%",
            marginVertical: normalize(15),
            borderRadius: 20,
            overflow: "hidden",
            elevation: 4,
          }}>
          <View
            style={{
              padding: normalize(15),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#090446",
            }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: 8,
                  borderRadius: 12,
                  marginRight: 12,
                }}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={24}
                  color="#FFB800"
                />
              </View>
              <View>
                <Text
                  style={{
                    color: "#FFF",
                    fontFamily: "ProductSans-Bold",
                    fontSize: normalize(16),
                  }}>
                  League Dashboard
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "ProductSans-Medium",
                    fontSize: normalize(11),
                  }}>
                  View your rank and daily quests
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#FFF"
            />
          </View>
        </TouchableRipple>
        {/* Recent Activities List */}
        <View style={{ alignItems: "center", marginTop: -5, width: "100%" }}>
          <View style={{ width: "85%", marginBottom: normalize(20) }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: normalize(10),
                paddingHorizontal: normalize(5),
              }}>
              <Text
                style={{
                  color: theme.dark ? "#F8FAFC" : "#0F172A",
                  fontFamily: "ProductSans-Bold",
                  fontSize: normalize(18),
                }}>
                Recent Activities
              </Text>
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            {filteredRecentBills?.length > 0 ? (
              <View
                style={{
                  backgroundColor: theme.dark ? "#1E293B" : "#FFFFFF",
                  borderRadius: 24,
                  overflow: "hidden",
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.dark ? "#334155" : "#F1F5F9",
                }}>
                {filteredRecentBills.map((item, i) => (
                  <TouchableRipple
                    key={i}
                    onPress={() => {
                      loginStore?.mode !== "C"
                        ? handleRecentBillListClick(item?.receipt_no)
                        : handleBillListClickCalculatorMode(item?.receipt_no)
                    }}
                    rippleColor="rgba(0, 0, 0, .1)"
                    style={{
                      padding: normalize(16),
                      borderBottomWidth:
                        i === filteredRecentBills.length - 1 ? 0 : 1,
                      borderBottomColor: theme.dark ? "#334155" : "#F1F5F9",
                      flexDirection: "row",
                      alignItems: "center",
                    }}>
                    <>
                      <View
                        style={{
                          backgroundColor: theme.colors.primaryContainer,
                          padding: 10,
                          borderRadius: 12,
                          marginRight: 15,
                        }}>
                        <MaterialCommunityIcons
                          name="basket"
                          size={22}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: theme.dark ? "#F8FAFC" : "#0F172A",
                            fontFamily: "ProductSans-Bold",
                            fontSize: normalize(14),
                            marginBottom: 2,
                          }}>
                          {item?.receipt_no}
                        </Text>
                        <Text
                          style={{
                            color: theme.dark ? "#94A3B8" : "#64748B",
                            fontFamily: "ProductSans-Medium",
                            fontSize: normalize(12),
                          }}>
                          {item?.cust_name} ({item?.cust_id})
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            color: theme.colors.primary,
                            fontFamily: "ProductSans-Bold",
                            fontSize: normalize(15),
                          }}>
                          ₹{item?.net_amt}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={theme.dark ? "#64748B" : "#CBD5E1"}
                          style={{ marginTop: 2 }}
                        />
                      </View>
                    </>
                  </TouchableRipple>
                ))}
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: theme.dark ? "#1E293B" : "#FFFFFF",
                  borderRadius: 24,
                  padding: normalize(30),
                  alignItems: "center",
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.dark ? "#334155" : "#F1F5F9",
                }}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={48}
                  color={theme.dark ? "#475569" : "#CBD5E1"}
                  style={{ marginBottom: normalize(10) }}
                />
                <Text
                  style={{
                    color: theme.dark ? "#94A3B8" : "#64748B",
                    fontFamily: "ProductSans-Medium",
                    fontSize: normalize(16),
                  }}>
                  No activity found.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <DialogBox
        visible={logoutVisible}
        hide={hideLogoutDialog}
        onFailure={hideLogoutDialog}
        onSuccess={loggingOut}
        title="Logging Out"
        btnSuccess="YES">
        <Text variant="bodyMedium">Are you sure you want to log out?</Text>
      </DialogBox>

>>>>>>> Stashed changes
      {/* <DialogBoxForReprint
        iconSize={30}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}

        currentReceiptNo={currentReceiptNo}
        billedSaleData={billedSaleData}
        handleCancelBill={handleCancelBill}
        cancelledBillStatus={cancelledBillStatus}

        onDialogFailure={onDialogFailure}
      // onDialogSuccecss={() => onDialogSuccecss()}
      /> */}
      <DialogBoxForReprint
        iconSize={30}
        visible={visible}
        hide={hideDialog}
        titleStyle={styles.title}
        currentReceiptNo={currentReceiptNo}
        billedSaleData={billedSaleData}
        handleCancelBill={handleCancelBill}
        cancelledBillStatus={cancelledBillStatus}
        onDialogFailure={onDialogFailure}
        onDialogSuccess={onDialogSuccess}
        requireShare={Boolean(params?.receipt_number)}
      />

      <DialogForBillsInCalculatorMode
        visible={visible2}
        hide={hideDialog2}
<<<<<<< Updated upstream

        currentReceiptNumber={currentReceiptNo}
        showCalculatedBillData={calculatorModeBillArray}

        onDialogFailure={hideDialog2}
        onDialogSuccecss={() => onDialogSuccecss(true)}
      />

      {/* {
        loginStore?.mode === "N"
          ? <AnimatedFABPaper
            icon="plus"
            label="Bill"
            onPress={() =>
=======
        currentReceiptNumber={currentReceiptNo}
        showCalculatedBillData={calculatorModeBillArray}
        onDialogFailure={hideDialog2}
        onDialogSuccecss={() => onDialogSuccecss(true)}
      />

      {loginStore?.mode !== "C" && (
        <>
          <AnimatedFABPaper
            color="#FFFFFF"
            variant="tertiary"
            icon="apps"
            label="Categories"
            onPress={() => {
              if (!customer) {
                Alert.alert(
                  "Customer Selection Required",
                  "Please select a customer from the dropdown before proceeding to categories.",
                )
                return
              }
>>>>>>> Stashed changes
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoriesScreen,
                }),
              )
            }}
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={[styles.fabStyle, { backgroundColor: "#090446" }]}
          />
          <AnimatedFABPaper
            color="#FFFFFF"
            variant="secondary"
            icon="file-chart"
            label="Sales"
            onPress={() => {
              rootNavigation.navigate("Reports", {
                screen: navigationRoutes.productwiseSaleReportScreen,
              })
            }}
            extended={isExtended}
            animateFrom="left"
            iconMode="dynamic"
            customStyle={[styles.fabStyle2, { backgroundColor: "#090446" }]}
          />
<<<<<<< Updated upstream
      } */}


      {
        loginStore?.mode !== "C" && <>
          <AnimatedFABPaper
            color={theme.colors.onPeachContainer}
            variant="tertiary"
            icon="apps"
            label="Categories"
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoriesScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={[styles.fabStyle, { backgroundColor: theme.colors.peachContainer }]}
          />
        </>
      }

=======
        </>
      )}
      {(loginStore as any)?.user_type === "G" && (
        <AnimatedFABPaper
          color="#FFFFFF"
          variant="secondary"
          icon="logout"
          label="Logout"
          onPress={handleLogoutPress}
          extended={isExtended}
          animateFrom="right"
          iconMode="dynamic"
          customStyle={[
            styles.logoutFabStyle,
            { backgroundColor: "#090446" },
          ]}
        />
      )}
>>>>>>> Stashed changes
    </SafeAreaView>
  )
}

// export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },

  title: {
    textAlign: "center",
  },

  bill: {
    margin: normalize(20),
    padding: normalize(10),
    // minHeight: 200,
    height: "auto",
    maxHeight: "auto",
    borderRadius: normalize(30),
    width: normalize(320),
    alignItems: "center",
  },

  fabStyle: {
    bottom: normalize(16),
    right: normalize(16),
    position: "absolute",
    elevation: 4,
    zIndex: 5,
  },

  logoutFabStyle: {
    bottom: normalize(80),
    right: normalize(16),
    position: "absolute",
    elevation: 5,
    zIndex: 10,
  },

  fabStyle2: {
    bottom: normalize(16),
    left: normalize(16),
    position: "absolute",
    elevation: 4,
    zIndex: 5,
  },
<<<<<<< Updated upstream
  noActivity:{
    padding:15
=======
  noActivity: {
    padding: 15,
>>>>>>> Stashed changes
  },
  noActivityTxt:{
    alignSelf: "center",
<<<<<<< Updated upstream
    textAlign: "center", fontSize: 19,
  }
=======
    textAlign: "center",
    fontSize: 19,
  },
  dropdown: {
    height: normalize(55),
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
>>>>>>> Stashed changes
})
