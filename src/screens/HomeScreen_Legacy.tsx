import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
  RefreshControl,
  Alert,
  Linking,
  Animated,
  TouchableOpacity,
} from "react-native"
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import React, { useCallback, useContext, useEffect, useState, useMemo } from "react"
import SplashScreen from "react-native-splash-screen"
import AnimatedFABPaper from "../components/AnimatedFABPaper"
import {
  ActivityIndicator,
  Button,
  Dialog,
  List,
  MD2Colors,
  Portal,
  SegmentedButtons,
  Text,
  TouchableRipple,
  IconButton,
} from "react-native-paper"
import { Dropdown } from 'react-native-element-dropdown'
import useCustomerList from "../hooks/api/useCustomerList"
import CustomerSelector from "../components/CustomerSelector"
import { usePaperColorScheme } from "../theme/theme"
import HeaderImage from "../components/HeaderImage"
import {
  flowerGlass,
  flowerGlassDark,
  flowerHome,
  flowerHomeDark,
  hills,
  hillsDark,
} from "../resources/images"
import navigationRoutes from "../routes/navigationRoutes"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native"
import SurfacePaper from "../components/SurfacePaper"
import DialogBox from "../components/DialogBox"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import ScrollableListContainer from "../components/ScrollableListContainer"
import { loginStorage } from "../storage/appStorage"
import { CalculatorShowBillData, LoginData, LoginDataMessage, RecentBillsData, ShowBillData } from "../models/api_types"
import { AppStore } from "../context/AppContext"
import useBillSummary from "../hooks/api/useBillSummary"
import useRecentBills from "../hooks/api/useRecentBills"
import useShowBill from "../hooks/api/useShowBill"
import useCalculatorShowBill from "../hooks/api/useCalculatorShowBill"
import AddedProductList from "../components/AddedProductList"
import NetTotalForRePrints from "../components/NetTotalForRePrints"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import { formattedDate } from "../utils/dateFormatter"
import useVersionCheck from "../hooks/api/useVersionCheck"
import DeviceInfo from "react-native-device-info"
import ButtonPaper from "../components/ButtonPaper"
import useCancelBill from "../hooks/api/useCancelBill"
import useCalculations from "../hooks/useCalculations"
import DialogBoxForReprint from "../components/DialogBoxForReprint"
import DialogForBillsInCalculatorMode from "../components/DialogForBillsInCalculatorMode"
import { AppStoreContext } from "../models/custom_types"
import { ADDRESSES } from "../config/api_list"

function HomeScreen() {
  const theme = usePaperColorScheme()
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const { params } = useRoute<any>()

  let navigationFetchedReceiptNumber = params?.receipt_number

  let version = DeviceInfo.getVersion()

  const { handleGetReceiptSettings, customer, setCustomer, justLoggedIn, setJustLoggedIn, handleLogout, customerList, handleGetCustomerList } = useContext<AppStoreContext>(AppStore)

  const { fetchBillSummary } = useBillSummary()
  const { fetchRecentBills } = useRecentBills()
  const { fetchBill } = useShowBill()
  const { fetchVersionInfo } = useVersionCheck()
  const { printDuplicateBillCalculateMode, rePrintT } = useBluetoothPrint()
  const { cancelBill } = useCancelBill()
  const { fetchCalcBill } = useCalculatorShowBill()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  const loginStore = JSON.parse(loginStorage.getString("login-data")) as LoginDataMessage
  // let loginStore

  // try {
  //   const loginData = loginStorage.getString("login-data")

  //   loginStore = loginData ? JSON.parse(loginData) : {}
  // } catch (error) {
  //   console.error("Failed to parse login-data:", error)
  //   loginStore = {}
  // }

  const [isExtended, setIsExtended] = useState<boolean>(() => true)

  const [recentBills, setRecentBills] = useState<RecentBillsData[]>(() => [])
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])
  const [currentReceiptNo, setCurrentReceiptNo] = useState<string | undefined>(
    () => undefined,
  )
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [gstFlag, setGstFlag] = useState<"Y" | "N">()
  const [gstType, setGstType] = useState<"I" | "E">()

  const [refreshing, setRefreshing] = useState<boolean>(() => false)
  const [updateUrl, setUpdateUrl] = useState<string>()
  const today = formattedDate(new Date())

  const filteredRecentBills = useMemo(() => {
    return recentBills
  }, [recentBills])

  const displayTotalBills = useMemo(() => {
    return recentBills.length
  }, [recentBills])

  const displayAmountCollected = useMemo(() => {
    return recentBills.reduce((acc, curr) => acc + (curr.net_amt || 0), 0)
  }, [recentBills])

  const [visible, setVisible] = useState<boolean>(() => false)
  const hideDialog = () => setVisible(() => false)

  const [visible2, setVisible2] = useState<boolean>(() => false)
  const hideDialog2 = () => setVisible2(() => false)

  const [visibleUpdatePortal, setVisibleUpdatePortal] = useState<boolean>(
    () => false,
  )

  const [calculatorModeBillArray, setCalculatorModeBillArray] = useState<CalculatorShowBillData[]>(() => [])

  // Login-time customer picker
  const [custPickerVisible, setCustPickerVisible] = useState(() => false)
  const [custPickerSelected, setCustPickerSelected] = useState<number | null>(() => null)

  const dismissCustPicker = () => {
    setCustPickerVisible(false)
    setJustLoggedIn(false)
  }

  const confirmCustPicker = () => {
    dismissCustPicker()
  }

  const showDialogForAppUpdate = () => setVisibleUpdatePortal(true)
  const hideDialogForAppUpdate = () => setVisibleUpdatePortal(false)

  // let netTotal = 0
  // let totalDiscount = 0

  useEffect(() => {
    if (!justLoggedIn) return
    
    if (customerList.length === 0) {
      handleGetCustomerList()
    }
    setCustPickerVisible(true)
  }, [justLoggedIn])

  useEffect(() => {
    SplashScreen.hide()

    return () => SplashScreen.hide()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    handleGetReceiptSettings()
    handleGetBillSummary()
    handleGetRecentBills()
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

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
          grandTotalCalculate(billedSaleData[0]?.tprice, billedSaleData[0]?.tdiscount_amt)
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
    printDuplicateBillCalculateMode(calculatorModeBillArray).then(() => {
      hideDialog2()
    }).catch(err => {
      ToastAndroid.show("Some error while re-printing in Calculate mode.", ToastAndroid.SHORT)
    })
  }

  const handleGetBillSummary = async () => {
    await fetchBillSummary(
      today,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
      null
    )
      .then(res => {
        // setTotalBills(res?.data[0]?.total_bills)
        // setAmountCollected(res?.data[0]?.amount_collected)
      })
      .catch(err => {
        ToastAndroid.show(
          "Check your internet connection or something went wrong in the server.",
          ToastAndroid.SHORT,
        )
        console.log("handleGetBillSummary - HomeScreen", err, today)
      })
  }

  const handleGetRecentBills = async () => {
    await fetchRecentBills(
      today,
      loginStore.comp_id,
      loginStore.br_id,
      loginStore.user_id,
      null
    )
      .then(res => {
        console.log("handleGetRecentBills =>>>", res)
        setRecentBills(res)
      })
      .catch(err => {
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
      .catch(err => {
        ToastAndroid.show(
          "Error during getting version info.",
          ToastAndroid.SHORT,
        )
      })
  }

  useEffect(() => {
    handleGetBillSummary()
    handleGetRecentBills()

    handleGetVersion()
  }, [isFocused])

  const updateApp = () => {
    Linking.openURL(updateUrl)
  }

  const handleGetBill = async (rcptNo: string) => {
    await fetchBill(rcptNo)
      .then(res => {
        console.log(res?.data, 'mmmmmmmmmmmmmmm')
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
        console.log(rcptNo, "handleGetBill - HOMESCREEN - fetchBill", res?.data)
      })
      .catch(err => {
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
    setGstFlag(billedSaleData[0]?.gst_flag)
    setGstType(billedSaleData[0]?.gst_type)
  }

  const handleBillListClickCalculatorMode = (rcptNo: string) => {
    setVisible2(true)
    setCurrentReceiptNo(rcptNo)
    handleGetBillCalculatorMode(rcptNo)
  }

  const handleCancellingBill = async (rcptNo: string) => {
    await cancelBill(rcptNo, loginStore.user_id).then(res => {
      if (res?.status === 1) {
        // ToastAndroid.show(res?.data, ToastAndroid.SHORT)
        Alert.alert("Alert", "Estimate cancelled.")
        console.log("++++++++++++++++++++++-----------------------", res)
        // handleRePrintReceipt(true)
        setVisible(false)
      }
    }).catch(err => {
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
          text: "CANCEL BILL", onPress: async () => {
            await handleCancellingBill(rcptNo);
            if (params?.receipt_number) {
              navigation.dispatch(
                CommonActions.setParams({ receipt_number: undefined })
              )
            }
          }
        },
      ],
      { cancelable: false },
    )
  }

  let totalQty: number = 0

  // useEffect(() => {
  //   if (isFocused && params?.receipt_number) {
  //     handleRecentBillListClick(params.receipt_number)

  //     // navigation.dispatch(
  //     //   CommonActions.setParams({ receipt_number: undefined })
  //     // )
  //   }
  // }, [isFocused, params?.receipt_number])

  const onDialogSuccess = () => {
    navigation.dispatch(
      CommonActions.setParams({ receipt_number: undefined })
    )
    hideDialog()
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
        <View
          style={{
            alignSelf: "center",
            width: "85%",
            paddingTop: normalize(15),
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
        </View>

        <View style={{ alignItems: "center" }}>
          <HeaderImage
            imgLight={hills}
            imgDark={hillsDark}
            borderRadius={30}
            blur={10}
            showCustomerSelector
            showProductSearch={false}>
            {/* Welcome Back, Estimate! */}
            Welcome, {loginStore.user_name}
          </HeaderImage>
        </View>



        {/* Login-time customer picker */}
        <Portal>
          <Dialog
            visible={custPickerVisible}
            onDismiss={dismissCustPicker}
            dismissable={false}
            style={{ borderRadius: normalize(20) }}>
            <Dialog.Title style={{ textAlign: 'center' }}>Select Customer</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: normalize(12), opacity: 0.7 }}>
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
            <Dialog.Actions style={{ flexDirection: 'column', gap: normalize(10), paddingHorizontal: normalize(20), paddingBottom: normalize(15) }}>
              <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  style={{ borderRadius: normalize(10), flex: 1, marginRight: normalize(10) }}
                  textColor={theme.colors.error}
                >
                  Logout
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmCustPicker}
                  disabled={!custPickerSelected}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  style={{ borderRadius: normalize(10), flex: 1 }}
                >
                  Confirm
                </Button>
              </View>
              <Button
                mode="text"
                onPress={() => {
                  setCustPickerVisible(false);
                  navigation.navigate("AddCustomer" as never);
                }}
                style={{ width: '100%' }}
                icon="account-plus-outline"
              >
                Add New Customer
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog visible={visibleUpdatePortal} dismissable={false}>
            <Dialog.Title>UPDATE FOUND!</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Please update your app.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              {/* <Button onPress={hideDialog}>Cancel</Button> */}
              <Button onPress={updateApp}>Download</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <View style={{ alignItems: "center", marginTop: -10 }}>
          <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled
            paddingEnabled
            elevation={1}
            backgroundColor={theme.colors.purpleContainer}
            style={{
              marginBottom: normalize(15),
            }}>
            <View style={{ width: "100%", padding: normalize(15) }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: normalize(8),
                }}>
                <View>
                  <Text variant="titleMedium" style={{
                    color: theme.colors.onPurpleContainer
                  }}>Amount Collected</Text>
                </View>
                <View>
                  <Text variant="titleMedium" style={{
                    color: theme.colors.onPurpleContainer
                  }}>₹{displayAmountCollected || 0}</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: 'center'
                }}>
                <View>
                  <Text variant="titleMedium" style={{
                    color: theme.colors.onPurpleContainer
                  }}>Total Bills</Text>
                </View>
                <View>
                  <Text variant="titleMedium" style={{
                    color: theme.colors.onPurpleContainer
                  }}>{displayTotalBills || 0}</Text>
                </View>
              </View>
            </View>
          </SurfacePaper>

          <TouchableRipple
            onPress={() => navigation.navigate("League" as never)}
            rippleColor="rgba(255, 255, 255, .32)"
            style={{
              width: "85%",
              marginBottom: normalize(15),
              borderRadius: 20,
              overflow: 'hidden',
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#004AAD', '#006BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                padding: normalize(15),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: 8,
                  borderRadius: 12,
                  marginRight: 12
                }}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#FFB800" />
                </View>
                <View>
                  <Text style={{ color: '#FFF', fontFamily: 'ProductSans-Bold', fontSize: normalize(16) }}>League Dashboard</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'ProductSans-Medium', fontSize: normalize(11) }}>View your rank and daily quests</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableRipple>

          {/* <View
            style={{
              alignSelf: "center",
              width: "85%",
              paddingBottom: normalize(15),
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

          <SurfacePaper
            smallWidthEnabled
            borderRadiusEnabled
            paddingEnabled
            isBorderEnabled
            heading="Recent Activities"
            elevation={1}
            backgroundColor={theme.colors.tertiaryContainer}
            style={{}}>
            <View style={{ width: "100%" }}>
              {filteredRecentBills?.length > 0 ? (
                <>
                  {filteredRecentBills?.map((item, i) => (
                    <List.Item
                      key={i}
                      title={`${item?.receipt_no}`}
                      description={`${item?.cust_name}(${item?.cust_id})-₹${item?.net_amt}`}
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
              ) : <View style={styles.noActivity}>
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
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.productsScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={styles.fabStyle}
          />
          : <AnimatedFABPaper
            icon="pencil-plus-outline"
            label="Bill"
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.calculateModeBillScreen,
                }),
              )
            }
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={styles.fabStyle}
          />
      } */}


      {
        loginStore?.mode !== "C" && <>
          <AnimatedFABPaper
            color={theme.colors.onPeachContainer}
            variant="tertiary"
            icon="apps"
            label="Categories"
            onPress={() => {
              if (!customer) {
                Alert.alert("Customer Selection Required", "Please select a customer from the dropdown before proceeding to categories.")
                return
              }
              navigation.dispatch(
                CommonActions.navigate({
                  name: navigationRoutes.categoriesScreen,
                }),
              )
            }}
            extended={isExtended}
            animateFrom="right"
            iconMode="dynamic"
            customStyle={[styles.fabStyle, { backgroundColor: theme.colors.peachContainer }]}
          />

          <AnimatedFABPaper
            color={theme.colors.onSecondaryContainer}
            variant="secondary"
            icon="file-chart"
            label="Sales"
            onPress={() => {
              navigation.navigate("Reports", {
                screen: navigationRoutes.productwiseSaleReportScreen,
              })
            }}
            extended={isExtended}
            animateFrom="left"
            iconMode="dynamic"
            customStyle={[styles.fabStyle2, { backgroundColor: theme.colors.secondaryContainer }]}
          />
        </>
      }

    </SafeAreaView>
  )
}

export default HomeScreen

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
  },

  fabStyle2: {
    bottom: normalize(16),
    left: normalize(16),
    position: "absolute",
  },
  noActivity: {
    padding: 15
  },
  noActivityTxt: {
    alignSelf: "center",
    textAlign: "center", fontSize: 19,
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
})
