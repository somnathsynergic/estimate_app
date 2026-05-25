import React, { useContext, useState, useMemo, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  ToastAndroid,
} from "react-native"
import HeaderImage from "../../components/HeaderImage"
import { blurReport, blurReportDark } from "../../resources/images"
import { usePaperColorScheme } from "../../theme/theme"
import { IconButton, List, Text } from "react-native-paper"
import { Dropdown } from 'react-native-element-dropdown'
import useProductwiseSaleReport from "../../hooks/api/useProductwiseSaleReport"
import ButtonPaper from "../../components/ButtonPaper"
import normalize, { SCREEN_HEIGHT } from "react-native-normalize"
import { formattedDate } from "../../utils/dateFormatter"
import { loginStorage } from "../../storage/appStorage"
import { BasicReportCredentials, ProductwiseSaleReportData } from "../../models/api_types"
import { useBluetoothPrint } from "../../hooks/printables/useBluetoothPrint"
import { AppStoreContext } from "../../models/custom_types"
import SurfacePaper from "../../components/SurfacePaper"

export default function ProductwiseSaleReportScreen() {
  const theme = usePaperColorScheme()
  const loginStore = JSON.parse(loginStorage.getString("login-data"))
  const { fetchProductwiseSaleReport } = useProductwiseSaleReport()
  const { printProductwiseSaleReport } = useBluetoothPrint()

  const [productwiseSaleReport, setProductwiseSaleReport] = useState<ProductwiseSaleReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  const formattedFromDate = formattedDate(new Date())
  const formattedToDate = formattedDate(new Date())

  const handleGetSaleReport = async () => {
    if (formattedFromDate > formattedToDate) {
      ToastAndroid.show(
        "From date must be lower than To date.",
        ToastAndroid.SHORT,
      )
      return
    }
    const saleCreds: BasicReportCredentials = {
      from_date: formattedFromDate,
      to_date: formattedToDate,
      comp_id: loginStore.comp_id,
      br_id: loginStore.br_id,
      user_id: loginStore.user_id,
    }
    setIsDisabled(true)
    setIsLoading(true)
    try {
      const res = await fetchProductwiseSaleReport(saleCreds)
      setProductwiseSaleReport(res?.data || [])
    } catch (err: any) {
      console.log(err?.response)
      ToastAndroid.show("Error fetching sale report.", ToastAndroid.SHORT)
    } finally {
      setIsDisabled(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleGetSaleReport()
  }, [])

  const totalNetAmount = useMemo(
    () => productwiseSaleReport.reduce((sum, item) => sum + Number(item.tot_item_price), 0),
    [productwiseSaleReport]
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <View style={styles.headerContainer}>
        <HeaderImage
          isBackEnabled
          imgLight={blurReport}
          imgDark={blurReportDark}
          borderRadius={30}
          blur={10}
          showCustomerSelector={false}
        >
          SKU wise Sales
        </HeaderImage>
      </View>

      <View style={styles.submitContainer}>
        <ButtonPaper
          onPress={handleGetSaleReport}
          mode="contained-tonal"
          buttonColor={theme.colors.purple}
          textColor={theme.colors.onPurple}
          loading={isLoading}
          disabled={isDisabled}
        >
          SUBMIT/REFRESH
        </ButtonPaper>
      </View>

      <View style={styles.listWrapper}>
        <ScrollView contentContainerStyle={styles.listContainer} nestedScrollEnabled>
          {productwiseSaleReport?.length > 0 ? (
            <>
              {productwiseSaleReport.map((item, i) => (
                <List.Item
                  key={i}
                  title={`${item.tot_item_qty} x ${item.item_name}`}
                  description={() => (
                    <View>
                      <Text style={{ color: theme.colors.green }}>
                        Price: ₹{item.unit_price}
                      </Text>
                      <Text style={{ color: theme.colors.purple }}>
                        Category: {item.category_name}
                      </Text>
                    </View>
                  )}
                  right={() => <Text>₹{item.tot_item_price}</Text>}
                />
              ))}
            </>
          )
            : <SurfacePaper
              borderRadiusEnabled
              backgroundColor={theme.colors.onPrimary}
              elevation={2}
              paddingEnabled
              smallWidthEnabled
              style={{ padding: 15 }}>
              <Text
                variant="titleLarge"
                style={{
                  alignSelf: "center",
                  textAlign: "center",
                  color: theme.colors.primary,
                }}>
                {/* No items found in this category. */}
                No items found.
              </Text>
            </SurfacePaper>
          }
        </ScrollView>

        {productwiseSaleReport.length > 0 && (
          <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
            <Text variant="bodyLarge" style={styles.footerText}>
              TOTAL: ₹{totalNetAmount?.toFixed(2)}
            </Text>
          </View>
        )}






      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { alignItems: "center" },
  submitContainer: {
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: normalize(25),
    paddingBottom: normalize(10),
  },
  listContainer: {
    paddingBottom: normalize(10),
  },
  footer: {
    paddingVertical: normalize(10),
    borderTopWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontWeight: "bold",
  },
  dropdown: {
    marginBottom: normalize(10),
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
