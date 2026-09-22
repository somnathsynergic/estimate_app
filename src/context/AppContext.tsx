import React, { createContext, useEffect, useRef, useState } from "react"
import { AppState, Alert, ToastAndroid } from "react-native"
import FastImage from 'react-native-fast-image'
import { ezetapStorage, itemsContextStorage, loginStorage, productStorage } from "../storage/appStorage"
import { fileStorage } from "../storage/appStorage"
import useReceiptSettings from "../hooks/api/useReceiptSettings"
import useLogin from "../hooks/api/useLogin"
import {
  CategoryListData,
  ItemsData,
  LogoutCredentials,
  ReceiptSettingsData,
  SendOtpCredentials,
  UnitData
} from "../models/api_types"
import useItems from "../hooks/api/useItems"
import useUnits from "../hooks/api/useUnits"
import useSendOtp from "../hooks/api/useSendOtp"
import useLogout from "../hooks/api/useLogout"
import useCategories from "../hooks/api/useCategories"
import useSendOtp2 from "../hooks/api/useSendOtp2"
import { AppStoreContext, Customer } from "../models/custom_types"
// import RNEzetapSdk from "react-native-ezetap-sdk"
import DeviceInfo from "react-native-device-info"
import messaging from '@react-native-firebase/messaging'
import useCheckStatus from "../hooks/api/useCheckStatus"
import useCustomerList from "../hooks/api/useCustomerList"



export const AppStore = createContext<AppStoreContext>(null)

const AppContext = ({ children }) => {
  const appState = useRef(AppState.currentState)

  const [loading, setLoading] = useState(() => false)

  const [isLogin, setIsLogin] = useState<boolean>(() => false)
  const [otp, setOtp] = useState<number>()
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettingsData>()
  const [items, setItems] = useState<ItemsData[]>(() => [])
  const [categories, setCategories] = useState<CategoryListData[]>(() => [])
  const [units, setUnits] = useState<UnitData[]>(() => [])
  const [customer, setCustomer] = useState<Customer | null>(() => null)
  const [customerList, setCustomerList] = useState<Customer[]>(() => [])
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(() => false)

  const [flagOtp, setFlagOtp] = useState<boolean>(() => false)
  const { fetchUserStatus } = useCheckStatus()

  const { login } = useLogin()
  const { logout } = useLogout()
  const { fetchReceiptSettings } = useReceiptSettings()
  const { fetchItems } = useItems()
  const { fetchUnits } = useUnits()
  // const { getOtp } = useSendOtp()
  const { getOtp } = useSendOtp2()
  const { fetchCategories } = useCategories()
  const { fetchCustomerList } = useCustomerList()

  const [deviceId, setDeviceId] = useState(() => "")
  const [fcmToken, setFcmToken] = useState<string>(() => "")

  useEffect(() => {
    const uniqueId = DeviceInfo.getUniqueIdSync()
    setDeviceId(uniqueId)
  }, [])



  // const requestUserPermission = async () => {
  //     const authStatus = await messaging().requestPermission();
  //     const enabled =
  //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  //     if(enabled){
  //      console.log('Notification permission status:', authStatus)
  //     //  setAuthStatus(authStatus)
  //      getFcmToken();
  //     } else {
  //         Alert.alert('Push Notification permission denied');
  //     }
  // };

  // const getFcmToken = async () => {
  //     try{
  //         const fcmToken = await messaging().getToken();

  //         if(fcmToken){
  //             console.log("Fcm Token", fcmToken);
  //             setFcmToken(fcmToken)
  //         }else {
  //             console.log("Failed to get Fcm token")
  //         }
  //     }catch (error) {
  //         console.error('Error fetching FCM token:', error);
  //     }
  // }

  const checkUserActiveInactive = async () => {
    console.log('checkkkkkkkkk');
    const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}')

    await fetchUserStatus(
      loginStore?.user_id,
    )
      .then(res => {
        console.log('user________', 'then', res[0].active_flag);
        if (res[0]?.active_flag == 'N') {
          handleLogout()
        }
      })
      .catch(err => {
        console.log('user________', 'catch', err);
        // ToastAndroid.show(
        //   "Error during fetching recent bills",
        //   ToastAndroid.SHORT,
        // )
      })
  }

  useEffect(() => {
    // requestUserPermission();

    checkUserActiveInactive()

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // Alert.alert('New Notification', JSON.stringify(remoteMessage.data?.body || ""));
      console.log(remoteMessage, 'remoteMessage');
      if (remoteMessage.data?.action == 'force_logout') {
        handleLogout()
      }

    })

    messaging().setBackgroundMessageHandler(async remoteMessage => {

      console.log(messaging(), 'Notification opened from background state:', remoteMessage.data)
      if (remoteMessage.data?.action == 'force_logout') {
        handleLogout()
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background state:', remoteMessage.data)
    });

    messaging().getInitialNotification().then(remoteMessage => {
      console.log('Notification caused app to open from quit state:', remoteMessage.data);
    });


    return unsubscribe;

  }, []);

  // const initRazorpay = async () => {
  //   var withAppKey =
  //     '{"userName":' +
  //     "9903044748" +
  //     ',"demoAppKey":"a40c761a-b664-4bc6-ab5a-bf073aa797d5","prodAppKey":"a40c761a-b664-4bc6-ab5a-bf073aa797d5","merchantName":"SYNERGIC_SOFTEK_SOLUTIONS","appMode":"DEMO","currencyCode":"INR","captureSignature":false,"prepareDevice":false}'
  //   var response = await RNEzetapSdk.initialize(withAppKey)
  //   console.log("XXXXXXXXXXCCCCCCCCCCCCCC========RES", response)
  //   // var jsonData = JSON.parse(response)
  //   // setRazorpayInitializationJson(jsonData)
  //   ezetapStorage.set("ezetap-initialization-json", response)
  // }

  // const init = async () => {
  //   console.log(
  //     "PPPPPPPPPPPPKKKKKKKKKKKKK",
  //     ezetapStorage.contains("ezetap-initialization-json"),
  //     ezetapStorage.getString("ezetap-initialization-json"),
  //   )
  //   // if (!ezetapStorage.contains("ezetap-initialization-json")) {
  //   await initRazorpay()

  //   var res = await RNEzetapSdk.prepareDevice()
  //   console.warn("RAZORPAY===PREPARE DEVICE", res)
  //   // }
  // }

  // useEffect(() => {
  //   init()
  // }, [])

  // useEffect(() => {
  //   const handleAppStateChange = (nextAppState) => {
  //     if (nextAppState === 'background') {
  //       console.log('App has gone to the background!');

  //       // ezetapStorage.clearAll()
  //     } else if (nextAppState === 'inactive') {
  //       console.log('App is closing!');

  //       // ezetapStorage.clearAll()
  //     }
  //   };

  //   const subscription = AppState.addEventListener('change', handleAppStateChange);

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  const handleLogin = async (loginText: string, passwordText: string, fcmToken: string) => {
    setLoading(true)
    setFlagOtp(!flagOtp)
    console.log("LOGIN________________", loginText, passwordText, fcmToken, deviceId)
    await login(loginText, passwordText, fcmToken, deviceId)
      .then(loginData => {
        console.log("loginData", loginData)

        if (loginData?.suc === 0) {
          Alert.alert("Error", loginData?.msg?.toString())
          setIsLogin(false)
          return
        }
        if (loginData?.suc === 1) {
          loginStorage.set("login-data", JSON.stringify(loginData?.msg))
          const savedData = JSON.parse(loginStorage.getString("login-data") || "{}");
          console.log("Saved login data to storage:", savedData);
          console.log("stock_flag from localstorage:", savedData?.stock_flag);
          setIsLogin(true)
          setJustLoggedIn(true)
        }
      })
      .catch(err => {
        console.log("========", err)
        ToastAndroid.show(
          err,
          ToastAndroid.SHORT,
        )
      })
    setLoading(false)
  }

  // useEffect(() => {
  //   setTimeout(() => {
  //     console.log("CALLED OTP RESET")
  //     setOtp(-1)
  //   }, 300000)
  // }, [flagOtp])

  // const handleLogin = async (loginText: string, passwordText: string) => {
  //   await login(loginText, passwordText).then(loginData => {
  //     console.log("loginData", loginData)

  //     if (loginData?.suc === 0) {
  //       Alert.alert("Error", "Login credentials are wrong! Please try again.")
  //       setIsLogin(false)
  //       return
  //     }
  //     if (loginData?.suc === 1) {
  //       loginStorage.set("login-data", JSON.stringify(loginData?.msg));
  //     }
  //     setIsLogin(true)
  //   }).catch(err => {
  //     ToastAndroid.show("No internet or Some error on server.", ToastAndroid.SHORT)
  //   })
  // }

  const isLoggedIn = () => {
    if (loginStorage.getAllKeys().length === 0) {
      console.log("IF - isLoggedIn")
      setIsLogin(false)
    } else {
      console.log("ELSE - isLoggedIn")
      setIsLogin(true)
    }
  }

  useEffect(() => {
    if (appState.current === "active") {
      isLoggedIn()
      // handleLogout()
    }
  }, [])

  const handleGetReceiptSettings = async () => {
    const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}')

    const companyId = loginStore.comp_id
    if (!companyId) return;
    await fetchReceiptSettings(companyId)
      .then(res => {
        setReceiptSettings(res[0])
        console.log("receiptSettingsData", res[0])
      })
      .catch(err => {
        ToastAndroid.show(
          "Error fetching Receipt Settings.",
          ToastAndroid.SHORT,
        )
      })
  }

  const handleGetItems = async () => {
    const loginData = loginStorage.getString("login-data")
    if (!loginData) return;
    const loginStore = JSON.parse(loginData)
    const companyId = loginStore.comp_id
    if (!companyId) return;
    let itemsData = await fetchItems(companyId)
    // console.log("itemsData", itemsData)

    setItems(itemsData)
  }

  const handleGetCategories = async () => {
    const loginData = loginStorage.getString("login-data")
    if (!loginData) return;
    const loginStore = JSON.parse(loginData)

    await fetchCategories(loginStore?.comp_id).then(res => {
      setCategories(res?.msg)
    }).catch(err => {
      ToastAndroid.show(`Some error occurred while getting categories - ${err}`, ToastAndroid.SHORT)
    })
  }

  const handleGetUnits = async () => {
    const loginData = loginStorage.getString("login-data")
    if (!loginData) return;
    const loginStore = JSON.parse(loginData)
    const companyId = loginStore.comp_id
    if (!companyId) return;

    let unitsData = await fetchUnits(companyId)
    console.log("unitsData", unitsData)

    setUnits(unitsData)
  }

  const handleGetCustomerList = async () => {
    const loginData = loginStorage.getString("login-data")
    if (!loginData) return;
    const loginStore = JSON.parse(loginData)

    const creds = {
      comp_id: loginStore?.comp_id,
      user_id: loginStore?.user_id
    }

    await fetchCustomerList(creds).then(res => {
      console.log("Fetched customers in AppContext:", res?.data?.length)
      if (res?.data && res.data.length > 0) {
        console.log("Sample Customer Keys:", Object.keys(res.data[0]));
        console.log("Sample Customer Data:", JSON.stringify(res.data[0]));
      }
      const list = (res?.data || []) as any[]
      setCustomerList(
        list.map((item: any) => ({
          label: `${item?.cust_name} (ID: ${item?.cust_id})`,
          value: item?.cust_id,
          name: item?.cust_name,
          phone: item?.phone_no,
          lat: item?.lat,
          long: item?.lng
        }))
      )
    }).catch(err => {
      console.log("Error fetching customer list", err)
    })
  }

  useEffect(() => {
    if (isLogin) {
      handleGetReceiptSettings()
      handleGetCustomerList()
    }
  }, [isLogin])

  const handleLogout = async () => {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))

    const logoutCreds: LogoutCredentials = {
      comp_id: loginStore?.comp_id,
      br_id: loginStore?.br_id,
      user_id: loginStore?.user_id
    }

    await logout(logoutCreds).then(res => {
      loginStorage.clearAll()
      fileStorage.clearAll()
      productStorage.clearAll()
      itemsContextStorage.clearAll()
      FastImage.clearMemoryCache()
      FastImage.clearDiskCache()
      setIsLogin(false)
      ToastAndroid.show(`${res?.data}`, ToastAndroid.SHORT)
    }).catch(err => {
      ToastAndroid.show("Some error occurred while logging out!", ToastAndroid.SHORT)
    })
    // loginStorage.clearAll()
    // fileStorage.clearAll()
    // setIsLogin(!isLogin)
  }

  return (
    <AppStore.Provider
      value={{
        isLogin,
        otp,
        setIsLogin,
        handleLogin,
        handleLogout,
        receiptSettings,
        handleGetReceiptSettings,
        items,
        handleGetItems,
        categories,
        handleGetCategories,
        units,
        handleGetUnits,
        deviceId,
        loading,
        customer,
        setCustomer,
        justLoggedIn,
        setJustLoggedIn,
        customerList,
        handleGetCustomerList,
        // init
      }}>
      {children}
    </AppStore.Provider>
  )
}

export default AppContext
