import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
  Platform,
  PermissionsAndroid,
} from "react-native"
import { IconButton, List, RadioButton, Text } from "react-native-paper"
import LinearGradient from "react-native-linear-gradient"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import { usePaperColorScheme } from "../theme/theme"
import InputPaper from "../components/InputPaper"
import { useContext, useEffect, useRef, useState } from "react"
import ButtonPaper from "../components/ButtonPaper"
import {
  CommonActions,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native"
import HeaderImage from "../components/HeaderImage"
import { productHeader, productHeaderDark } from "../resources/images"
import { useBluetoothPrint } from "../hooks/printables/useBluetoothPrint"
import NetTotalButton from "../components/NetTotalButton"
import { AppStore } from "../context/AppContext"
import SquircleBox from "../components/SquircleBox"
import useSaleInsert from "../hooks/api/useSaleInsert"
import { ezetapStorage, fileStorage, itemsContextStorage, loginStorage } from "../storage/appStorage"
import { AppStoreContext, FilteredItem } from "../models/custom_types"
import navigationRoutes from "../routes/navigationRoutes"
import { ProductsScreenRouteProp } from "../models/route_types"
import { mapItemToFilteredItem } from "../utils/mapItemToFilteredItem"
import { gstFilterationAndTotals } from "../utils/gstFilterTotal"
import useCalculations from "../hooks/useCalculations"
import useCustomerInfo from "../hooks/api/useCustomerInfo"
import useSendTxnDetails from "../hooks/api/useSendTxnDetails"
import {
  CustomerInfoCredentials,
  LoginDataMessage,
} from "../models/api_types"
import useCustomerList from "../hooks/api/useCustomerList"
import CustomerSelector from "../components/CustomerSelector"
import Geolocation from 'react-native-geolocation-service'
import { getDistance } from "../utils/geofence"

const CustomerDetailsFillScreen = () => {
  const isFocused = useIsFocused()
  const navigation = useNavigation()
  const { params } = useRoute<ProductsScreenRouteProp>()
  const theme = usePaperColorScheme()

  const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}') as LoginDataMessage
  const upiData = fileStorage.getString("upi-data")

  const PROXIMITY_THRESHOLD = 50;

  const { receiptSettings, init, customer, setCustomer, customerList, handleGetCustomerList } = useContext<AppStoreContext>(AppStore)

  const [distanceFromCustomer, setDistanceFromCustomer] = useState<number | null>(null);

  const { totalGST } = gstFilterationAndTotals(
    params?.added_products || [],
    receiptSettings?.gst_type || 'I',
  )

  const { printReceiptT } = useBluetoothPrint()
  const {
    grandTotalCalculate,
    grandTotalWithGSTCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()
  const { sendSaleDetails } = useSaleInsert()
  const { fetchCustomerInfo } = useCustomerInfo()
  // const { sendBillSms } = useBillSms()
  // const { sendBillSms } = useBillSms2()
  const { sendTxnDetails } = useSendTxnDetails()

  const [customerName, setCustomerName] = useState<string>(() => "")
  const [customerMobileNumber, setCustomerMobileNumber] = useState<string>(
    () => "",
  )
  const [cashAmount, setCashAmount] = useState<number>(
    () => grandTotalCalculate(
      params?.net_total || 0,
      0,
    ),
  )
  const [finalCashAmount, setFinalCashAmount] = useState<number>(
    () => 0,
  )

  const [discountBillwise, setDiscountBillwise] = useState<number>(() => 0)

  const receiptNumber = useRef<number | undefined>(undefined)
  const kotNumber = useRef<number | undefined>(undefined)

  const [checked, setChecked] = useState<string>(() => "C")
  const [isLoading, setIsLoading] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(() => true)

  const [customerInfoFlag, setCustomerInfoFlag] = useState<number>(() => 0)
  const [selectedCustId, setSelectedCustId] = useState<number | null>(() => customer?.value || null)
  const distanceHistory = useRef<number[]>([])
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)

  useEffect(() => {
    if (customerList.length === 0) {
      handleGetCustomerList()
    }
  }, [])

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name || "")
      setSelectedCustId(customer.value)
      setCustomerMobileNumber(customer.phone || "")
    }
  }, [customer, isFocused])

  // let paymentModeOptionsArr = [
  //   { icon: "cash", title: "Cash", func: () => setChecked("C") },
  //   { icon: "credit-card-outline", title: "Card", func: () => setChecked("D") },
  //   { icon: "contactless-payment", title: "UPI", func: () => setChecked("U") },
  //   { icon: "credit-card-clock-outline", title: "Credit", func: () => setChecked("R") },
  // ]

  useEffect(() => {
    if (checked === "R") {
      setCashAmount(0)
    }
  }, [checked])

  useEffect(() => {
    // if (receiptSettings?.gst_flag === "Y") {
    //   receiptSettings?.gst_type === "E"
    //     ? setFinalCashAmount(() =>
    //       cashAmount !== undefined
    //         ? cashAmount -
    //         parseFloat(
    //           grandTotalWithGSTCalculate(
    //             params?.net_total,
    //             receiptSettings?.discount_position !== "B"
    //               ? params?.total_discount
    //               : receiptSettings?.discount_type === "A"
    //                 ? discountBillwise
    //                 : (params?.net_total * discountBillwise) / 100,
    //             totalGST,
    //           ),
    //         )
    //         : 0,
    //     )
    //     : setFinalCashAmount(() =>
    //       cashAmount !== undefined
    //         ? cashAmount -
    //         parseFloat(
    //           grandTotalWithGSTInclCalculate(
    //             params?.net_total,
    //             receiptSettings?.discount_position !== "B"
    //               ? params?.total_discount
    //               : receiptSettings?.discount_type === "A"
    //                 ? discountBillwise
    //                 : (params?.net_total * discountBillwise) / 100,
    //           ),
    //         )
    //         : 0,
    //     )
    // } else {
    //   setFinalCashAmount(() =>
    //     cashAmount !== undefined
    //       ? cashAmount -
    //       grandTotalCalculate(
    //         params?.net_total,
    //         receiptSettings?.discount_position !== "B"
    //           ? params?.total_discount
    //           : receiptSettings?.discount_type === "A"
    //             ? discountBillwise
    //             : (params?.net_total * discountBillwise) / 100,
    //       )
    //       : 0,
    //   )
    // }
    setFinalCashAmount(() =>
      cashAmount !== undefined
        ? cashAmount -
        grandTotalCalculate(
          params?.net_total || 0,
          0,
        )
        : 0,
    )
  }, [cashAmount, discountBillwise, isFocused])

  useEffect(() => {
    if (customerMobileNumber?.length === 10) {
      handleGetCustomerInfo()
    }
  }, [customerMobileNumber])

  // useEffect(() => {
  //   if (receiptSettings?.rcv_cash_flag === "N") {
  //     setCashAmount(Math.abs(finalCashAmount))

  //     console.log("TTTSSSSSGGGGGDDDDDD", cashAmount)
  //   }
  // }, [isFocused])

  const handleGetCustomerInfo = async () => {
    let fetchCustInfCreds: CustomerInfoCredentials = {
      comp_id: loginStore?.comp_id,
      phone_no: customerMobileNumber,
    }

    await fetchCustomerInfo(fetchCustInfCreds)
      .then(res => {
        setCustomerName(res?.data[0]?.cust_name)
        setCustomerInfoFlag(() => 1)
        if (res?.data?.length === 0) {
          setCustomerName("")
          setCustomerInfoFlag(() => 0)
        }
      })
      .catch(err => {
        ToastAndroid.show(
          "Some error occurred while fetching Customer Name!",
          ToastAndroid.SHORT,
        )
      })
  }

  const onChangeCustomerMobileNumber = (mobile: string) => {
    if (/^\d*$/.test(mobile)) {
      setCustomerMobileNumber(mobile)
      setSelectedCustId(null)
    }
  }

  // const handleDiscountBillwise = (dis: number) => {
  //   setDiscountBillwise(dis)
  // }

  const handleSendSaleData = async () => {
    const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}')
    const branchId = loginStore?.br_id
    const createdBy = loginStore?.user_id

    const branchName = loginStore?.branch_name
    const userName = loginStore?.user_name

    let filteredData: FilteredItem[]
    console.log(params?.added_products, 'params?.added_products')
    filteredData = (params?.added_products).map(item =>
      mapItemToFilteredItem(
        item,
        receiptSettings,
        branchId,
        params,
        checked,
        cashAmount,
        customerName || customer?.name || '',
        selectedCustId || customer?.value || null,
        customerMobileNumber || customer?.phone || '',
        createdBy,
        totalGST,
        receiptSettings?.gst_flag || 'N',
        receiptSettings?.gst_type || 'I',
        receiptSettings?.discount_flag || 'N',
        receiptSettings?.discount_type || 'A',
        receiptSettings?.discount_position || 'B',
        receiptSettings?.rcpt_type || 'B',
        customerInfoFlag,
        receiptSettings?.stock_flag || 'N',

        discountBillwise || 0,

        /////////////////////////////////////
        branchName,
        userName
      ),
    )

    await sendSaleDetails(filteredData)
      .then(res => {
        console.log("SALE_INSERT_RES:", res)
        if (res?.data?.status === 1) {
          receiptNumber.current = res?.data?.data
          kotNumber.current = res?.kot_no?.kot_no

          Alert.alert("Success", "Estimate Uploaded Successfully.", [
            {
              text: "OK", onPress: () => {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: navigationRoutes.homeScreen,
                    params: {
                      receipt_number: receiptNumber.current
                    }
                  }),
                )
              }
            }
          ], { cancelable: false })
        } else {
          Alert.alert("Fail", "Something Went Wrong!")
        }
      })
      .catch(err => {
        Alert.alert("Fail", "Error while sending sale details!!!!!")
        console.log("SALE_INSERT_ERROR:", err)
      })
  }

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };


  const checkRealTimeDistance = async () => {
    const targetCustomer = customerList.find(c => c.value === selectedCustId);
    console.log("Checking distance for customer:", targetCustomer?.name || 'Unknown', "ID:", selectedCustId);
    // Reset history when checking a new customer to avoid stale data from previous selections
    distanceHistory.current = [];

    const hasLat = targetCustomer?.lat && String(targetCustomer.lat) !== "0" && String(targetCustomer.lat) !== "0.000000";
    const hasLong = targetCustomer?.long && String(targetCustomer.long) !== "0" && String(targetCustomer.long) !== "0.000000";

    // Reset UI state for new calculation
    setDistanceFromCustomer(null);
    setGpsAccuracy(null);

    if (hasLat && hasLong) {
      // Disable while calculating
      setIsDisabled(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setIsDisabled(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const rawDistance = getDistance(
            position.coords.latitude,
            position.coords.longitude,
            parseFloat(String(targetCustomer.lat)),
            parseFloat(String(targetCustomer.long))
          );

          // Smoothing Logic: Maintain a history of last 5 readings
          distanceHistory.current.push(rawDistance);
          if (distanceHistory.current.length > 5) {
            distanceHistory.current.shift();
          }

          // Calculate Moving Average
          const sum = distanceHistory.current.reduce((a, b) => a + b, 0);
          const smoothedDistance = sum / distanceHistory.current.length;

          console.log("Raw Distance:", rawDistance, "Smoothed Distance:", smoothedDistance, "GPS Accuracy:", position.coords.accuracy, "m");
          setDistanceFromCustomer(smoothedDistance);
          setGpsAccuracy(position.coords.accuracy);

          // Disable button if out of range (20m threshold)
          if (smoothedDistance > PROXIMITY_THRESHOLD) {
            setIsDisabled(true);
          } else {
            setIsDisabled(false);
          }
        },
        (error) => {
          console.log("Error getting real-time distance:", error);
          setIsDisabled(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setDistanceFromCustomer(null);
      // Disable save button if no customer is selected
      if (selectedCustId === null) {
        setIsDisabled(true);
      } else {
        setIsDisabled(false);
      }
    }
  };

  useEffect(() => {
    if (isFocused && selectedCustId !== null) {
      checkRealTimeDistance();
    }
  }, [isFocused, selectedCustId]);

  const handlePrintReceipt = async (printFlag = false) => {
    const targetCustomer = customerList.find(c => c.value === selectedCustId);

    const hasLat = targetCustomer?.lat && String(targetCustomer.lat) !== "0" && String(targetCustomer.lat) !== "0.000000";
    const hasLong = targetCustomer?.long && String(targetCustomer.long) !== "0" && String(targetCustomer.long) !== "0.000000";

    if (hasLat && hasLong) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Location permission is required to verify your distance from the customer.");
        return;
      }

      setIsLoading(true);

      const getCurrentLocation = () => {
        return new Promise<{ latitude: number, longitude: number }>((resolve, reject) => {
          Geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              reject(error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      };

      try {
        const currentLoc = await getCurrentLocation();
        const distance = getDistance(
          currentLoc.latitude,
          currentLoc.longitude,
          parseFloat(String(targetCustomer.lat)),
          parseFloat(String(targetCustomer.long))
        );

        if (distance > PROXIMITY_THRESHOLD) {
          setIsLoading(false);
          Alert.alert(
            "Out of Range",
            `You are too far from the customer's registered location. Current distance: ${distance.toFixed(2)}m. Please be within ${PROXIMITY_THRESHOLD}m range.`
          );
          return;
        }
      } catch (error) {
        setIsLoading(false);
        Alert.alert("Location Error", "Failed to get current location. Please check your GPS settings.");
        return;
      }
    }

    // pass conditonal grand total after - now just written net_total
    // if (discountBillwise > params?.net_total) {
    //   ToastAndroid.show("Enter valid Bill Discount!", ToastAndroid.SHORT)
    //   return
    // }

    if (receiptSettings?.rcv_cash_flag === "Y") {
      if (
        checked === "C" &&
        (cashAmount === undefined || cashAmount === 0 || finalCashAmount < 0)
      ) {
        ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
        return
      }
    }

    if (
      checked === "R" &&
      (cashAmount === undefined || finalCashAmount > 0)
    ) {
      ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
      return
    }

    if (checked === "R" && finalCashAmount === 0) {
      ToastAndroid.show("Changing Payment mode to Cash...", ToastAndroid.SHORT)
      setChecked(() => "C")
      return
    }

    if (checked === "R" && customerMobileNumber?.length < 10) {
      ToastAndroid.show("Valid Mobile Number is mandatory for Credit Mode.", ToastAndroid.SHORT)
      return
    }

    if (checked === "R" && (!customerName || customerName?.length === 0)) {
      ToastAndroid.show("Valid Customer Name is mandatory for Credit Mode.", ToastAndroid.SHORT)
      return
    }

    // if (customerMobileNumber.length === 0) {
    //   ToastAndroid.show("Customer mobile is mandatory.", ToastAndroid.SHORT)
    //   return
    // }

    setIsDisabled(true)
    setIsLoading(true)
    await handleSendSaleData()
    console.log("Sending data and printing receipts...")


    const receiptFunction =
      receiptSettings?.gst_flag === "N" ? printReceiptT : printReceiptT

    // if (printFlag) {
    // if (receiptSettings?.rcpt_type !== "S") {
    receiptFunction(
      params?.added_products || [],
      params?.net_total || 0,
      0, // discount
      cashAmount,
      finalCashAmount,
      customerName,
      customerMobileNumber,
      receiptNumber.current,
      checked,
    )

    //     console.log(
    //       "=================+++++++++++++++++++ params?.added_products",
    //       params?.added_products,
    //     )
    //     console.log(
    //       "=================+++++++++++++++++++ params?.net_total",
    //       params?.net_total,
    //     )
    //     console.log(
    //       "=================+++++++++++++++++++ parseFloat(params?.total_discount)",
    //       //@ts-ignore
    //       parseFloat(params?.total_discount),
    //     )
    //     console.log("=================+++++++++++++++++++ cashAmount", cashAmount)
    //     console.log(
    //       "=================+++++++++++++++++++ finalCashAmount",
    //       finalCashAmount,
    //     )
    //     console.log(
    //       "=================+++++++++++++++++++ customerName",
    //       customerName,
    //     )
    //     console.log(
    //       "=================+++++++++++++++++++ customerMobileNumber",
    //       customerMobileNumber,
    //     )
    //     console.log(
    //       "=================+++++++++++++++++++ receiptNumber",
    //       receiptNumber,
    //     )
    //     console.log("=================+++++++++++++++++++ checked", checked)
    //   }
    // }



    itemsContextStorage.clearAll()

    setIsLoading(false)
    setIsDisabled(false)
  }

  // const handlePrintReceipt = async (printFlag = false) => {
  //   // pass conditonal grand total after - now just written net_total
  //   if (discountBillwise > params?.net_total) {
  //     ToastAndroid.show("Enter valid Bill Discount!", ToastAndroid.SHORT)
  //     return
  //   }

  //   if (receiptSettings?.rcv_cash_flag === "Y") {
  //     if (
  //       checked === "C" &&
  //       (cashAmount === undefined || cashAmount === 0 || finalCashAmount < 0)
  //     ) {
  //       ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
  //       return
  //     }
  //   }

  //   if (
  //     checked === "R" &&
  //     (cashAmount === undefined || finalCashAmount > 0)
  //   ) {
  //     ToastAndroid.show("Add valid cash amount.", ToastAndroid.SHORT)
  //     return
  //   }

  //   if (checked === "R" && finalCashAmount === 0) {
  //     ToastAndroid.show("Changing Payment mode to Cash...", ToastAndroid.SHORT)
  //     setChecked(() => "C")
  //     return
  //   }

  //   if (checked === "R" && customerMobileNumber.length < 10) {
  //     ToastAndroid.show("Valid Mobile Number is mandatory for Credit Mode.", ToastAndroid.SHORT)
  //     return
  //   }

  //   // if (customerMobileNumber.length === 0) {
  //   //   ToastAndroid.show("Customer mobile is mandatory.", ToastAndroid.SHORT)
  //   //   return
  //   // }

  //   setIsDisabled(true)
  //   setIsLoading(true)
  //   await handleSendSaleData()
  //   console.log("Sending data and printing receipts...")


  //   const receiptFunction =
  //     receiptSettings?.gst_flag === "N" ? printReceiptWithoutGst : printReceipt

  //   if (printFlag) {
  //     if (receiptSettings?.rcpt_type !== "S") {
  //       receiptFunction(
  //         params?.added_products,
  //         params?.net_total,
  //         //@ts-ignore
  //         // parseFloat(params?.total_discount),
  //         receiptSettings?.discount_position !== "B"
  //           //@ts-ignore
  //           ? parseFloat(params?.total_discount)
  //           : receiptSettings?.discount_type === "A"
  //             //@ts-ignore
  //             ? parseFloat(discountBillwise)
  //             //@ts-ignore
  //             : parseFloat((params?.net_total * discountBillwise) / 100),
  //         cashAmount,
  //         finalCashAmount,
  //         customerName,
  //         customerMobileNumber,
  //         receiptNumber,
  //         checked,
  //         kotNumber,
  //         params?.table_no
  //       )

  //       console.log(
  //         "=================+++++++++++++++++++ params?.added_products",
  //         params?.added_products,
  //       )
  //       console.log(
  //         "=================+++++++++++++++++++ params?.net_total",
  //         params?.net_total,
  //       )
  //       console.log(
  //         "=================+++++++++++++++++++ parseFloat(params?.total_discount)",
  //         //@ts-ignore
  //         parseFloat(params?.total_discount),
  //       )
  //       console.log("=================+++++++++++++++++++ cashAmount", cashAmount)
  //       console.log(
  //         "=================+++++++++++++++++++ finalCashAmount",
  //         finalCashAmount,
  //       )
  //       console.log(
  //         "=================+++++++++++++++++++ customerName",
  //         customerName,
  //       )
  //       console.log(
  //         "=================+++++++++++++++++++ customerMobileNumber",
  //         customerMobileNumber,
  //       )
  //       console.log(
  //         "=================+++++++++++++++++++ receiptNumber",
  //         receiptNumber,
  //       )
  //       console.log("=================+++++++++++++++++++ checked", checked)
  //     }
  //   }



  //   itemsContextStorage.clearAll()

  //   setIsLoading(false)
  //   setIsDisabled(false)
  // }

  // const handlePrintReceipt = async (flag?: boolean) => {
  //   console.log(flag)
  //   printReceiptT(
  //     params?.added_products,
  //     params?.net_total,
  //     //@ts-ignore
  //     // parseFloat(params?.total_discount),
  //     receiptSettings?.discount_position !== "B"
  //       //@ts-ignore
  //       ? parseFloat(params?.total_discount)
  //       : receiptSettings?.discount_type === "A"
  //         //@ts-ignore
  //         ? parseFloat(discountBillwise)
  //         //@ts-ignore
  //         : parseFloat((params?.net_total * discountBillwise) / 100),
  //     cashAmount,
  //     finalCashAmount,
  //     customerName,
  //     customerMobileNumber,
  //     receiptNumber,
  //     checked,
  //     kotNumber,
  //     params?.table_no
  //   )
  // }




  //////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////

  // useEffect(() => {
  //   init()
  // }, [])

  // var tnxResponse

  // const handleRazorpayClient = async () => {
  //   let json = {
  //     username: "9903044748",
  //     amount: +cashAmount,
  //     externalRefNumber: "",
  //   }

  //   let jsonUPI = {
  //     username: "9903044748",
  //     amount: params?.net_total,
  //     externalRefNumber: "",
  //   }

  //   // Convert json object to string
  //   let jsonString = JSON.stringify(checked !== "U" ? json : jsonUPI)

  //   // await RNEzetapSdk.initialize(jsonString)
  //   //   .then(res => {
  //   //     console.log(">>>>>>>>>>>>>>>>>", res)
  //   //   })
  //   //   .catch(err => {
  //   //     console.log("<<<<<<<<<<<<<<<<<", err)
  //   //   })

  //   // var res = await RNEzetapSdk.prepareDevice()
  //   // console.log("RAZORPAY===PREPARE DEVICE", res)

  //   await RNEzetapSdk.pay(jsonString)
  //     .then(res => {
  //       console.log(">>>>>>>>>>>>>>>>>", res)

  //       // if (res?.status == "success") {
  //       //   handleSave()
  //       //   Alert.alert("Txn ID", res?.txnId)
  //       // } else {
  //       //   Alert.alert("Error in Tnx", res?.error)
  //       // }
  //       tnxResponse = res
  //       // setTnxResponse(res)
  //     })
  //     .catch(err => {
  //       console.log("<<<<<<<<<<<<<<<<<", err)
  //     })
  // }

  // const initializePaymentRequest = async () => {
  //   // var withAppKey =
  //   //   '{"userName":' +
  //   //   "9903044748" +
  //   //   ',"demoAppKey":"a40c761a-b664-4bc6-ab5a-bf073aa797d5","prodAppKey":"a40c761a-b664-4bc6-ab5a-bf073aa797d5","merchantName":"SYNERGIC_SOFTEK_SOLUTIONS","appMode":"DEMO","currencyCode":"INR","captureSignature":false,"prepareDevice":false}'
  //   // var response = await RNEzetapSdk.initialize(withAppKey)
  //   // console.log(response)
  //   // var jsonData = JSON.parse(response)

  //   let razorpayInitializationJson = JSON.parse(
  //     ezetapStorage.getString("ezetap-initialization-json"),
  //   )

  //   console.log("MMMMMMSSSSSSSSSSSS", razorpayInitializationJson)

  //   if (razorpayInitializationJson.status == "success") {
  //     await handleRazorpayClient()
  //       .then(async res => {
  //         console.log("###################", res)
  //         // var res = await RNEzetapSdk.close()
  //         // console.log("CLOSEEEEE TNXXXXX", res)
  //         // var json = JSON.parse(res)
  //       })
  //       .catch(err => {
  //         console.log("==================", err)
  //       })
  //   } else {
  //     console.log("XXXXXXXXXXXXXXXXXXX ELSE PART")
  //   }
  // }

  // const handleSaveBillRazorpay = async (flag?: boolean) => {
  //   await initializePaymentRequest()
  //     .then(async () => {
  //       console.log(
  //         "TRANSACTION RES DATA================",
  //         tnxResponse,
  //       )
  //       if (JSON.parse(tnxResponse)?.status === "success") {

  //         await handlePrintReceipt(flag)

  //         const creds: TxnDetailsCreds = {
  //           receipt_no: receiptNumber?.toString(),
  //           pay_txn_id: JSON.parse(tnxResponse)?.result?.txn?.txnId,
  //           pay_amount: +JSON.parse(tnxResponse)?.result?.txn?.amount,
  //           pay_amount_original: +JSON.parse(tnxResponse)?.result?.txn?.amountOriginal,
  //           currency_code: JSON.parse(tnxResponse)?.result?.txn?.currencyCode,
  //           payment_mode: JSON.parse(tnxResponse)?.result?.txn?.paymentMode,
  //           pay_status: JSON.parse(tnxResponse)?.result?.txn?.status,
  //           receipt_url: JSON.parse(tnxResponse)?.result?.receipt?.receiptUrl,
  //           created_by: loginStore?.user_id
  //         }

  //         console.log("::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::", creds)

  //         await sendTxnDetails(creds).then(res => {
  //           console.log("Txn details sent done.", res)
  //         }).catch(err => {
  //           console.log("Txn send failed.", err)
  //         })

  //       } else {
  //         console.log("tnxResponse value error...")
  //       }
  //     })
  //     .catch(err => {
  //       console.error("TNX Response Error!", err)

  //       console.log(
  //         "PPPPPPPPPPPPKKKKKKKKKKKKK",
  //         ezetapStorage.contains("ezetap-initialization-json"),
  //         ezetapStorage.getString("ezetap-initialization-json"),
  //       )
  //     })
  // }


  return (
    <SafeAreaView>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View
          style={{
            backgroundColor: theme.colors.background,
            minHeight: SCREEN_HEIGHT,
            height: "auto",
          }}>
          <View style={{ alignItems: "center" }}>
            <HeaderImage
              imgLight={productHeader}
              imgDark={productHeaderDark}
              borderRadius={30}
              blur={10}
              isBackEnabled>
              {/* {receiptSettings?.cust_inf === "Y"
                ? "Customer Details & Print"
                : "Print"} */}
              Payment & Print
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
              buttonColor={theme.colors.tertiaryContainer}
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
              textColor={theme.colors.onTertiaryContainer}>
              SEARCH PRODUCTS
            </ButtonPaper>
          </View> */}

          <View style={{
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 35,
            width: SCREEN_WIDTH / 1.15,
            alignSelf: "center",
            marginTop: normalize(2),
            padding: 10,
            // height: "auto",
            // paddingVertical: normalize(15),
            justifyContent: "center",
            alignItems: "center"
          }}>
            {/* {receiptSettings?.discount_flag === "Y" && receiptSettings?.discount_position === "B" && (
              <View
                style={{
                  paddingHorizontal: SCREEN_WIDTH / 20,
                }}>
                <InputPaper
                  selectTextOnFocus
                  label={
                    receiptSettings?.discount_type === "A"
                      ? "Discount (₹)"
                      : "Discount (%)"
                  }
                  onChangeText={handleDiscountBillwise}
                  value={discountBillwise}
                  keyboardType="numeric"
                  mode="flat"
                />
              </View>
            )} */}
            <NetTotalButton
              width={290}
              disabled
              backgroundColor={theme.colors.onSurfaceVariant}
              textColor={theme.colors.surfaceVariant}
              addedProductsList={params?.added_products}
              netTotal={params?.net_total}
              // totalDiscount={
              //   receiptSettings?.discount_position !== "B"
              //     ? params?.total_discount
              //     : receiptSettings?.discount_type === "A"
              //       ? discountBillwise
              //       : (params?.net_total * discountBillwise) / 100
              // }
              totalDiscount={0}
            />
          </View>

          <View
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 40,
              width: SCREEN_WIDTH / 1.15,
              alignSelf: "center",
              marginTop: normalize(10),
              marginBottom: normalize(10),
            }}>
            <View style={{ justifyContent: "center" }}>
              <View
                style={{
                  paddingVertical: normalize(5),
                  marginVertical: SCREEN_HEIGHT / 100,
                  gap: 2
                }}>
                {/* Customer selection moved to the top of the screen */}
              </View>
            </View>

            {receiptSettings?.pay_mode === "Y" && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  // marginRight: normalize(18),
                  // marginLeft: normalize(4),
                  marginVertical: normalize(5),
                  marginHorizontal: normalize(25),
                  flexWrap: "wrap"
                }}>
                <View style={styles.eachRadioBtn}>
                  <RadioButton
                    value="C"
                    status={checked === "C" ? "checked" : "unchecked"}
                    color={theme.colors.onTertiaryContainer}
                    onPress={() => setChecked("C")}
                  />
                  <Text
                    variant="labelLarge"
                    style={
                      checked === "C" && {
                        color: theme.colors.onTertiaryContainer,
                      }
                    }>
                    Cash
                  </Text>
                </View>
                {/* <View style={styles.eachRadioBtn}>
                  <RadioButton
                    value="D"
                    status={checked === "D" ? "checked" : "unchecked"}
                    color={theme.colors.onTertiaryContainer}
                    onPress={() => setChecked("D")}
                  />
                  <Text
                    variant="labelLarge"
                    style={
                      checked === "D" && {
                        color: theme.colors.onTertiaryContainer,
                      }
                    }>
                    Card
                  </Text>
                </View> */}

                {/* <View style={styles.eachRadioBtn}>
                  <RadioButton
                    value="U"
                    status={checked === "U" ? "checked" : "unchecked"}
                    color={theme.colors.onTertiaryContainer}
                    onPress={() => setChecked("U")}
                  />
                  <Text
                    variant="labelLarge"
                    style={
                      checked === "U" && {
                        color: theme.colors.onTertiaryContainer,
                      }
                    }>
                    UPI
                  </Text>
                </View> */}

                <View style={styles.eachRadioBtn}>
                  <RadioButton
                    value="R"
                    status={checked === "R" ? "checked" : "unchecked"}
                    color={theme.colors.onTertiaryContainer}
                    onPress={() => setChecked("R")}
                  />
                  <Text
                    variant="labelLarge"
                    style={
                      checked === "R" && {
                        color: theme.colors.onTertiaryContainer,
                      }
                    }>
                    Credit
                  </Text>
                </View>

                {/* <List.Item
                  style={{ width: "100%" }}
                  title="Payment Mode"
                  description={
                    checked === "C"
                      ? "Cash"
                      : checked === "D"
                        ? "Card"
                        : checked === "U"
                          ? "UPI"
                          : checked === "R"
                            ? "Credit"
                            : "Error Occurred"
                  }
                  left={props => <List.Icon {...props} icon="contactless-payment-circle-outline" />}
                  right={props => {
                    return <MenuPaperWithoutRestriction menuArrOfObjects={paymentModeOptionsArr} customStyle={{ backgroundColor: theme.colors.surface }} textColor={theme.colors.onSurface} />
                  }}
                  descriptionStyle={{
                    color: theme.colors.purple,
                  }}
                /> */}
              </View>
            )}

            <View style={{ paddingVertical: normalize(10) }}></View>

            {checked === "C" && (
              <View style={{
                // backgroundColor: theme.colors.surfaceVariant,
                // borderRadius: 20,
                // width: SCREEN_WIDTH / 1.15,
                alignSelf: "center",
                // marginTop: normalize(10),
                // padding: normalize(12),
                alignItems: 'center',
                // elevation: 2
              }}>

                {/* <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurfaceVariant, marginBottom: 5 }}>
              Selected Customer
            </Text>

            <CustomerSelector
              data={customerList}
              value={selectedCustId}
              onChange={item => {
                setSelectedCustId(item.value);
                setCustomerMobileNumber(item.phone);
                setCustomerName(item.name);
                setCustomerInfoFlag(1);
                setCustomer(item);
                distanceHistory.current = []; // Clear history for new customer
                // Immediate refresh when customer changes
                setTimeout(checkRealTimeDistance, 100);
              }}
            /> */}

                {selectedCustId !== null && (
                  <View style={{ marginTop: 8 }}>
                    {(() => {
                      const targetCustomer = customerList.find(c => c.value === selectedCustId);
                      const hasLat = targetCustomer?.lat && String(targetCustomer.lat) !== "0" && String(targetCustomer.lat) !== "0.000000";
                      const hasLong = targetCustomer?.long && String(targetCustomer.long) !== "0" && String(targetCustomer.long) !== "0.000000";

                      return hasLat && hasLong ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text
                            variant="labelMedium"
                            style={{
                              color: distanceFromCustomer !== null && distanceFromCustomer > PROXIMITY_THRESHOLD ? theme.colors.error : theme.colors.primary,
                              fontWeight: 'bold'
                            }}
                          >
                            {distanceFromCustomer !== null
                              ? `Distance: ${distanceFromCustomer.toFixed(2)}m ${distanceFromCustomer > PROXIMITY_THRESHOLD ? " (Out of Range)" : " (In Range)"}`
                              : "Calculating distance..."}
                          </Text>
                          {gpsAccuracy !== null && (
                            <Text variant="labelSmall" style={{ color: gpsAccuracy > 20 ? theme.colors.error : theme.colors.outline, fontSize: 10 }}>
                              GPS Accuracy: ±{gpsAccuracy.toFixed(1)}m {gpsAccuracy > 20 ? "(Weak Signal)" : "(Good Signal)"}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
                          Registered location not found
                        </Text>
                      );
                    })()}
                  </View>
                )}
                {/* </View> */}
                <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
                  <InputPaper
                    selectTextOnFocus
                    label="Received"
                    value={
                      // receiptSettings?.rcv_cash_flag === "N"
                      //   ? Math.abs(finalCashAmount)
                      //   : cashAmount
                      cashAmount
                    }
                    onChangeText={(cash: any) => {
                      const amount = Number(cash);
                      if (!isNaN(amount) && amount > 0) {
                        setCashAmount(amount);
                      } else {
                        setCashAmount(0);
                      }
                      setFinalCashAmount(amount - (grandTotalCalculate(params?.net_total || 0, 0)))
                    }}
                    keyboardType="number-pad"
                    leftIcon="cash-multiple"
                    maxLength={8}
                    customStyle={{ marginBottom: normalize(10) }}
                    disabled={receiptSettings?.rcv_cash_flag === "N"}
                  />
                </View>
                {
                  receiptSettings?.rcv_cash_flag === "Y" &&
                  <SquircleBox
                    backgroundColor={theme.colors.surface}
                    textColor={theme.colors.onSurface}
                    height={SCREEN_HEIGHT / 15}>
                    RETURNED AMOUNT: ₹{finalCashAmount}
                  </SquircleBox>
                }
              </View>
            )}

            {checked === "R" && (
              <View>
                {/* <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
                  <InputPaper
                    selectTextOnFocus
                    label="Received Amount"
                    value={cashAmount}
                    onChangeText={(cash: number) => {
                      // setCashAmount(cash)

                      const amount = Number(cash);
                      // Allow only positive numbers greater than 0
                      if (!isNaN(amount) && amount > 0) {
                      setCashAmount(amount);
                      } else {
                      // Optionally clear or reset invalid input
                      setCashAmount(0);
                      }

                    }}
                    keyboardType="number-pad"
                    leftIcon="cash-multiple"
                    maxLength={8}
                    customStyle={{ marginBottom: normalize(10) }}
                  />
                </View> */}
                <SquircleBox
                  backgroundColor={theme.colors.surface}
                  textColor={theme.colors.onSurface}
                  height={SCREEN_HEIGHT / 15}>
                  DUE AMOUNT: ₹{Math.abs(finalCashAmount)}
                </SquircleBox>
              </View>
            )}

            {/* {
              checked === "U" && upiData !== undefined && (
                <View>
                  <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12), alignSelf: "center" }}>
                    {
                      receiptSettings?.gst_flag === "Y"
                        ? <QRCode
                          size={150}
                          value={`${upiData}&am=${receiptSettings?.gst_type === "E"
                            ? grandTotalWithGSTCalculate(
                              params?.net_total,
                              receiptSettings?.discount_position !== "B"
                                ? params?.total_discount
                                : receiptSettings?.discount_type === "A"
                                  ? discountBillwise
                                  : (params?.net_total * discountBillwise) / 100,
                              totalGST,
                            )
                            : grandTotalWithGSTInclCalculate(
                              params?.net_total,
                              receiptSettings?.discount_position !== "B"
                                ? params?.total_discount
                                : receiptSettings?.discount_type === "A"
                                  ? discountBillwise
                                  : (params?.net_total * discountBillwise) / 100,
                            )
                            }`}
                          color={theme.colors.onBackground}
                          backgroundColor={theme.colors.surfaceVariant}
                        />
                        : <QRCode
                          size={150}
                          value={`${upiData}&am=${grandTotalCalculate(
                            params?.net_total,
                            receiptSettings?.discount_position !== "B"
                              ? params?.total_discount
                              : receiptSettings?.discount_type === "A"
                                ? discountBillwise
                                : (params?.net_total * discountBillwise) / 100,
                          )}`}
                          color={theme.colors.onBackground}
                          backgroundColor={theme.colors.surfaceVariant}
                        />
                    }

                  </View>
                </View>
              )
            } */}

            <View style={{ padding: normalize(20), flexDirection: "row", gap: 10, alignSelf: "center" }}>
              {/* {checked !== "U" ? <ButtonPaper
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                onPress={() => handlePrintReceipt(true)}
                icon="cloud-print-outline"
                loading={isLoading}
                disabled={isDisabled}>
                SAVE / PRINT
              </ButtonPaper>
                : <ButtonPaper
                  mode="contained"
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  onPress={() => handleSaveBillRazorpay(true)}
                  icon="cloud-print-outline"
                  loading={isLoading}
                  disabled={isDisabled}>
                  SAVE / PRINT
                </ButtonPaper>} */}
              <ButtonPaper
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                onPress={() => handlePrintReceipt(true)}
                icon="cloud-print-outline"
                loading={isLoading}
                disabled={isDisabled}>
                SAVE
              </ButtonPaper>
              {/* {checked !== "U" ? <ButtonPaper
                mode="contained"
                buttonColor={theme.colors.purple}
                textColor={theme.colors.onPurple}
                onPress={() => handlePrintReceipt()}
                icon="content-save-outline"
                loading={isLoading}
                disabled={isDisabled}>
                SAVE
              </ButtonPaper>
                : <ButtonPaper
                  mode="contained"
                  buttonColor={theme.colors.purple}
                  textColor={theme.colors.onPurple}
                  onPress={() => handleSaveBillRazorpay()}
                  icon="content-save-outline"
                  loading={isLoading}
                  disabled={isDisabled}>
                  SAVE
                </ButtonPaper>} */}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default CustomerDetailsFillScreen

const styles = StyleSheet.create({
  eachRadioBtn: {
    justifyContent: "center",
    alignItems: "center"
  },
  dropdown: {
    marginBottom: normalize(5),
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
