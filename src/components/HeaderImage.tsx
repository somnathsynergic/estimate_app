import { PropsWithChildren, useContext, useEffect, useState } from "react"
import {
  ImageBackground,
  useColorScheme,
  StyleSheet,
  View,
} from "react-native"
import normalize, { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"
import { IconButton, Text } from "react-native-paper"
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
          list.map((item: any) => ({
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
      {showProductSearch && (
        <View
          style={{
            alignSelf: "center",
            width: "85%",
            marginBottom: normalize(10),
            paddingTop: normalize(10),
          }}>
          <ButtonPaper
            icon="magnify-scan"
            mode="contained"
            buttonColor={theme.colors.purpleContainer}
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
            textColor={theme.colors.onPurpleContainer}>
            SEARCH PRODUCTS
          </ButtonPaper>
        </View>
      )}

      {isBackEnabled && (
        <View>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onBackground}
            size={20}
            onPress={
              !isBackCustom
                ? () => navigation.dispatch(CommonActions.goBack())
                : () => backPressed()
            }
            style={{
              position: "absolute",
              top: SCREEN_HEIGHT / 40,
              right: SCREEN_WIDTH / 3.2,
              zIndex: 10,
            }}
          />
        </View>
      )}

      <ImageBackground
        imageStyle={{ borderRadius: normalize(borderRadius) }}
        blurRadius={blur}
        source={colorScheme !== "dark" ? imgLight : imgDark}
        style={[
          styles.surface,
          showCustomerSelector && styles.surfaceWithSelector,
        ]}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            variant="headlineMedium"
            style={styles.titleText}>
            {children}
          </Text>
          {categoryName ? (
            <Text
              variant="bodySmall"
              style={styles.categoryText}>
              Category: {categoryName}
            </Text>
          ) : null}
        </View>

        {/* Customer selector embedded inside the header card */}
        {showCustomerSelector && (
          <View style={[styles.selectorWrapper, {
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: normalize(12),
          }]}>
            <CustomerSelector
              data={custData}
              value={selectedCustId}
              onChange={item => {
                setSelectedCustId(item.value)
                setCustomer(item)
              }}
              placeholder="Select Customer"
            />
          </View>
        )}
      </ImageBackground>
    </>
  )
}

const styles = StyleSheet.create({
  surface: {
    margin: normalize(20),
    padding: normalize(20),
    height: SCREEN_HEIGHT / 8,
    borderRadius: normalize(30),
    width: SCREEN_WIDTH / 1.13,
    alignItems: "center",
    justifyContent: "center",
  },
  surfaceWithSelector: {
    height: SCREEN_HEIGHT / 5,
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
})
