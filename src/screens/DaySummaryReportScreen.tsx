import React, { useState, useEffect } from "react";
import { StyleSheet, SafeAreaView, ScrollView, View, ToastAndroid, TextStyle, ViewStyle } from "react-native";
import HeaderImage from "../components/HeaderImage";
import { greenRep, greenRepDark } from "../resources/images";
import { usePaperColorScheme } from "../theme/theme";
import { DataTable, Text } from "react-native-paper";
import DatePicker from "react-native-date-picker";
import ButtonPaper from "../components/ButtonPaper";
import normalize from "react-native-normalize";
import { formattedDate } from "../utils/dateFormatter";
import { loginStorage } from "../storage/appStorage";
import useDaySummaryReport from "../hooks/api/useDaySummaryReport";

function DaySummaryReportScreen() {
  const theme = usePaperColorScheme();
  const login = JSON.parse(loginStorage.getString("login-data") as string);

  const { fetchDaySummary } = useDaySummaryReport();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

  const formattedSelectedDate = formattedDate(selectedDate);

  const handleGetReport = async () => {
    setIsLoading(true);
    const creds = {
      user_id: login?.user_id,
      date: formattedSelectedDate,
    };
    try {
      const res = await fetchDaySummary(creds);
      setReportData(res?.data ?? []);
    } catch (err) {
      console.error(err);
      ToastAndroid.show("Error fetching Day Summary report", ToastAndroid.SHORT);
    }
    setIsLoading(false);
  };

  const titleTextStyle: TextStyle = { color: theme.colors.onPrimary };
  const titleStyle: ViewStyle = { backgroundColor: theme.colors.primary };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center" }}>
          <HeaderImage
            isBackEnabled
            imgLight={greenRep}
            imgDark={greenRepDark}
            borderRadius={30}
            blur={10}
          >
            Day Summary Report
          </HeaderImage>
        </View>
        <View style={styles.controls}>
          <ButtonPaper
            onPress={() => setOpenDatePicker(true)}
            mode="text"
            textColor={theme.colors.primary}
          >
            DATE: {selectedDate?.toLocaleDateString("en-GB")}
          </ButtonPaper>
          <DatePicker
            modal
            mode="date"
            open={openDatePicker}
            date={selectedDate}
            onConfirm={date => {
              setOpenDatePicker(false);
              setSelectedDate(date);
            }}
            onCancel={() => setOpenDatePicker(false)}
          />
          <ButtonPaper
            onPress={handleGetReport}
            mode="contained-tonal"
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onGreen}
            loading={isLoading}
          >
            GET REPORT
          </ButtonPaper>
        </View>
        <View style={styles.tableContainer}>
          <DataTable>
            <DataTable.Header style={titleStyle}>
              <DataTable.Title textStyle={titleTextStyle}>Item</DataTable.Title>
              <DataTable.Title textStyle={titleTextStyle}>Opening</DataTable.Title>
              <DataTable.Title textStyle={titleTextStyle}>Issued</DataTable.Title>
              <DataTable.Title textStyle={titleTextStyle}>Billed</DataTable.Title>
              <DataTable.Title textStyle={titleTextStyle}>Returned</DataTable.Title>
              <DataTable.Title textStyle={titleTextStyle}>Closing</DataTable.Title>
            </DataTable.Header>
            {reportData.map(item => (
              <DataTable.Row key={item?.item_id}>
                <DataTable.Cell>{item?.item_name}</DataTable.Cell>
                <DataTable.Cell>{item?.opening_packet}</DataTable.Cell>
                <DataTable.Cell>{item?.issued_packet}</DataTable.Cell>
                <DataTable.Cell>{item?.billed_packet}</DataTable.Cell>
                <DataTable.Cell>{item?.returned_packet}</DataTable.Cell>
                <DataTable.Cell>{item?.closing_packet}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default DaySummaryReportScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  controls: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
    alignItems: "center",
    gap: normalize(10),
  },
  tableContainer: { marginTop: normalize(15), paddingHorizontal: normalize(10) },
});
