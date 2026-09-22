import { REPORT_SCREEN_DATA } from "../data/ui/REPORTS_SCREEN";
import HeaderImage from "../components/HeaderImage";
import { blurReport, blurReportDark } from "../resources/images";
import { usePaperColorScheme } from "../theme/theme";
import ReportButton from "../components/ReportButton";
import ReportButtonsWrapper from "../components/ReportButtonsWrapper";
import { CommonActions, useNavigation, useFocusEffect } from "@react-navigation/native";
import navigationRoutes from "../routes/navigationRoutes";

import React, { useContext, useEffect, useState } from "react";
import { AppStore } from "../context/AppContext";
import { AppStoreContext } from "../models/custom_types";
import { View, SafeAreaView, ScrollView, StyleSheet, ToastAndroid, Pressable, Alert } from "react-native";
import { Text, List } from "react-native-paper";
import useRecentBills from "../hooks/api/useRecentBills";
import { RecentBillsData, ShowBillData } from "../models/api_types";
import DialogBoxForReprint from "../components/DialogBoxForReprint";
import normalize from "react-native-normalize";
import { loginStorage } from "../storage/appStorage";
import useShowBill from "../hooks/api/useShowBill";
import useCancelBill from "../hooks/api/useCancelBill"

function ReportsScreen() {
  const navigation = useNavigation();
  const theme = usePaperColorScheme();
  const loginStore = JSON.parse(loginStorage.getString("login-data"))

  const { cancelBill } = useCancelBill()
  
  const [recentBills, setRecentBills] = useState<RecentBillsData[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentReceiptNo, setCurrentReceiptNo] = useState<string>("");
  const { fetchBill } = useShowBill()
  const [cancelledBillStatus, setCancelledBillStatus] = useState<"Y" | "N">()
  const [billedSaleData, setBilledSaleData] = useState<ShowBillData[]>(() => [])

  const { fetchRecentBills } = useRecentBills();
  const handleGetBill = async (rcptNo: any) => {
    await fetchBill(rcptNo)
      .then(res => {
        setBilledSaleData(res?.data)
        setCancelledBillStatus(res?.cancel_flag)
      })
      .catch(err => {
        ToastAndroid.show("Error during fetching bills.", ToastAndroid.SHORT)
      })
  }
  const handleRecentBillListClick = (rcptNo: string) => {
    setCurrentReceiptNo(rcptNo);
    handleGetBill(rcptNo)

    setVisible(true);
  };

  useFocusEffect(
    React.useCallback(() => {
      const today = new Date();
      console.log(today)
      // const formatted = `${today.getFullYear()}${("-" + (today.getMonth() + 1)).slice(-2)}${("-" + today.getDate()).slice(-2)}`;
      const formatted =  today.toISOString().split('T')[0]
      // console.log( `${today.getFullYear()}${("-" + (today.getMonth() + 1)).slice(-2)}`,'formatted')
      fetchRecentBills(
        formatted,
        loginStore.comp_id,
        loginStore.br_id,
        loginStore.user_id,
        null
      )
        .then(setRecentBills)
        .catch(err => console.log("fetch recent bills error", err));
    }, [])
  );

  const filteredReportScreenData = REPORT_SCREEN_DATA.filter((item) => 
    !(loginStore?.stock_flag === 'N' && item.text === "Day Stock Summary")
  );

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
      const today = new Date();
      console.log(today)
      // const formatted = `${today.getFullYear()}${("-" + (today.getMonth() + 1)).slice(-2)}${("-" + today.getDate()).slice(-2)}`;
      const formatted =  today.toISOString().split('T')[0]
      // console.log( `${today.getFullYear()}${("-" + (today.getMonth() + 1)).slice(-2)}`,'formatted')
      fetchRecentBills(
        formatted,
        loginStore.comp_id,
        loginStore.br_id,
        loginStore.user_id,
        null
      )
        .then(setRecentBills)
        .catch(err => console.log("fetch recent bills error", err));
    // handleGetBillSummary()
    // handleGetRecentBills()
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
            // if (params?.receipt_number) {
            //   navigation.dispatch(
            //     CommonActions.setParams({ receipt_number: undefined }),
            //   )
            // }
          },
        },
      ],
      { cancelable: false },
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage imgLight={blurReport} imgDark={blurReportDark} borderRadius={30} blur={10}>            My Reports          </HeaderImage>
        </View>
        <ReportButtonsWrapper>
          {filteredReportScreenData.map((item, index) =>
          (<ReportButton key={index}
            text={item?.text}
            color={index % 2 === 0 ?
              theme.colors.purpleContainer : theme.colors.primaryContainer
            } textColor={index % 2 === 0 ? theme.colors.onPurpleContainer : theme.colors.onPrimaryContainer}
            icon={item?.icon}
            onPress={() => navigation.dispatch(CommonActions.navigate({ name: item?.route }))} />
          ))}
        </ReportButtonsWrapper>
        <View style={{ height: 2, backgroundColor: 'black', opacity: 0.1 }}></View>
        <View style={{ alignItems: "center", marginTop: 20, width: "100%" }}>
          {/* <View style={{ width: "85%" }}>
            <Text variant="titleLarge" style={{ color: theme.colors.primary, marginBottom: 10, textAlign: 'center' }}>
              Recent Activities
            </Text>
            {recentBills?.length > 0 ? (
              <View>
                {recentBills.map((item, i) => (
                  <List.Item
                    key={i}
                    title={`${item?.receipt_no}`}
                    style={{ marginVertical: 5, borderRadius: 10, shadowColor: 'black' }}
                    description={`₹${item?.net_amt}`}
                    onPress={() => handleRecentBillListClick(item?.receipt_no)}
                    left={props => <List.Icon {...props} icon="basket" />}
                  />
                ))}

              </View>
            ) : (
              <View style={styles.noActivity}>
                <Text variant="titleLarge" style={[styles.noActivityTxt, { color: theme.colors.onVanillaTertiaryContainer }]}>No activity found.</Text>
              </View>
            )}
          </View> */}
          <View
  style={{
    width: "85%",
    alignSelf: "center",
    marginTop: 10,
  }}
>
  {/* Header */}
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingHorizontal: 4,
    }}
  >
    <Text
      variant="headlineSmall"
      style={{
        color: theme.colors.primary,
        fontWeight: "700",
        letterSpacing: 0.3,
      }}
    >
      Recent Activities
    </Text>

    <View
      style={{
        backgroundColor: theme.colors.primaryContainer,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
      }}
    >
      <Text
        style={{
          color: theme.colors.onPrimaryContainer,
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {recentBills?.length || 0}
      </Text>
    </View>
  </View>

  {recentBills?.length > 0 ? (
    <View>
      {recentBills.map((item, i) => (
        <Pressable
  key={i}
  onPress={() => handleRecentBillListClick(item?.receipt_no)}
  style={({ pressed }) => ({
    backgroundColor: pressed
      ? theme.colors.surfaceVariant
      : theme.colors.surface,

    marginBottom: 14,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: pressed ? 0.04 : 0.08,
    shadowRadius: 8,
    elevation: pressed ? 2 : 4,

    transform: [{ scale: pressed ? 0.98 : 1 }],
  })}
>
  {/* Left Section */}
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    }}
  >
    {/* Icon */}
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: theme.colors.primaryContainer,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
      }}
    >
      <List.Icon
        icon="basket"
        color={theme.colors.primary}
      />
    </View>

    {/* Text */}
    <View style={{ flex: 1 }}>
      <Text
        variant="titleMedium"
        style={{
          color: theme.colors.onSurface,
          fontWeight: "700",
          marginBottom: 4,
        }}
      >
        #{item?.receipt_no}
      </Text>

      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onSurfaceVariant,
          opacity: 0.75,
        }}
      >
        Tap to view details
      </Text>
    </View>
  </View>

  {/* Amount */}
  <View
    style={{
      backgroundColor: theme.colors.secondaryContainer,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
    }}
  >
    <Text
      variant="titleMedium"
      style={{
        color: theme.colors.onSecondaryContainer,
        fontWeight: "800",
      }}
    >
      ₹{item?.net_amt}
    </Text>
  </View>
</Pressable>
      ))}
    </View>
  ) : (
    <View
      style={{
        width: "100%",
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 24,
        paddingVertical: 40,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: theme.colors.primaryContainer,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <List.Icon
          icon="clipboard-text-outline"
          color={theme.colors.primary}
        />
      </View>

      <Text
        variant="titleLarge"
        style={{
          color: theme.colors.onSurface,
          fontWeight: "700",
          marginBottom: 6,
        }}
      >
        No activity found
      </Text>

      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onSurfaceVariant,
          textAlign: "center",
          opacity: 0.7,
          lineHeight: 22,
        }}
      >
        Your recent transactions and activities
        will appear here.
      </Text>
    </View>
  )}
</View>
        </View>
        <DialogBoxForReprint
          visible={visible}
          hide={() => setVisible(false)}
          onDialogFailure={() => setVisible(false)}
          titleStyle={styles.title}
          currentReceiptNo={currentReceiptNo}
          billedSaleData={billedSaleData}
          handleCancelBill={handleCancelBill}
          cancelledBillStatus="N" />
      </ScrollView>
    </SafeAreaView>)
} export default ReportsScreen; const styles = StyleSheet.create({ container: { flexGrow: 1 }, title: { textAlign: "center" }, noActivity: { padding: 15 }, noActivityTxt: { alignSelf: "center", fontSize: 19 }, });
