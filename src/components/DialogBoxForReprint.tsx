import { PropsWithChildren } from "react"
import { Dialog, Portal, Text, TouchableRipple } from "react-native-paper"
import Clipboard from "@react-native-clipboard/clipboard"
import { Alert, Share, ToastAndroid, View } from "react-native"
import ScrollableListContainer from "./ScrollableListContainer"
import AddedProductList from "./AddedProductList"
import NetTotalForRePrints from "./NetTotalForRePrints"
import ButtonPaper from "./ButtonPaper"
import normalize from "react-native-normalize"

import { ShowBillData } from "../models/api_types"
import { usePaperColorScheme } from "../theme/theme"

type DialogBoxProps = {
  visible: boolean
  hide: () => void
  title?: string
  btnFail?: string
  btnSuccess?: string
  icon?: string
  iconSize?: number
  titleStyle?: {}
  buttonSuccessIcon?: string
  dismissable?: boolean
  currentReceiptNo?: string
  billedSaleData?: ShowBillData[]
  cancelledBillStatus?: string
  netTotalButtonColors?: Array<string>
  handleCancelBill?: (rcptNo: string) => void

  onDialogFailure?: () => void
  onDialogSuccecss?: () => void
}

export default function DialogBoxForReprint({
  children,
  visible,
  icon,
  iconSize,
  title,
  titleStyle,
  hide,
  dismissable = false,
  cancelledBillStatus,
  currentReceiptNo = "",
  billedSaleData = [],
  netTotalButtonColors = [],
  handleCancelBill,
  onDialogFailure,
  onDialogSuccecss
}: PropsWithChildren<DialogBoxProps>) {
  const theme = usePaperColorScheme()

  const copyToClipboard = (value: string) => {
    Clipboard.setString(value)
    ToastAndroid.show(`Copied: ${value}`, ToastAndroid.SHORT)
  }

  const onShare = async () => {
    try {
      const header = []
      header.push(`RCPT. NO. ${currentReceiptNo}`)
      const createdDt = billedSaleData[0]?.created_dt
        ? new Date(billedSaleData[0].created_dt).toLocaleString('en-GB')
        : ''
      header.push(`Date: ${createdDt}`)
      const modeMap: Record<string, string> = {
        C: 'Cash',
        D: 'Card',
        U: 'UPI',
        R: 'Credit'
      }
      const payMode = billedSaleData[0]?.pay_mode
      header.push(`Payment Mode: ${modeMap[payMode ?? ''] || 'Pay Off'}`)

      const items: string[] = []
      let netTotal = 0
      billedSaleData.forEach(item => {
        const lineTotal = item.price * item.qty
        netTotal += lineTotal
        items.push(
          `${item.item_name} x${item.qty} @ ${item.price} = ${lineTotal}`
        )
      })

      const message = [
        ...header,
        '',
        'Items:',
        ...items,
        '',
        `Net Total: ${netTotal}`
      ].join('\n')

      await Share.share({ message })
    } catch (error: any) {
      Alert.alert(error.message)
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={hide}
        theme={theme}
        dismissable={dismissable}
      >
        {icon && <Dialog.Icon icon={icon} size={iconSize} />}
        {title && <Dialog.Title style={titleStyle}>{title}</Dialog.Title>}
        <Dialog.Content>
          {/* Receipt and date display */}
          <View style={{ paddingBottom: 5 }}>
            <TouchableRipple onPress={() => copyToClipboard(currentReceiptNo)}>
              <Text
                style={{ textAlign: "center", color: theme.colors.primary }}
                variant="bodyLarge"
              >
                RCPT. NO. {currentReceiptNo}
              </Text>
            </TouchableRipple>
            <Text
              style={{ textAlign: "center", color: theme.colors.secondary }}
              variant="bodyLarge"
            >
              {new Date(billedSaleData[0]?.created_dt).toLocaleString("en-GB")}
            </Text>
          </View>

          {/* Product list */}
          <ScrollableListContainer
            backgroundColor={theme.colors.surfaceVariant}
            height={250}
            width={300}
          >
            {billedSaleData.map((item, i) => (
              <AddedProductList
                key={i}
                disabled
                itemName={item.item_name}
                quantity={item.qty}
                unitPrice={item.price}
                discount={0}
                discountType={item.discount_type}
                gstFlag={item.gst_flag}
              />
            ))}
          </ScrollableListContainer>

          {/* Net total display */}
          <NetTotalForRePrints
            width={300}
            backgroundColor={netTotalButtonColors[0] || theme.colors.pinkContainer}
            addedProductsList={billedSaleData}
            netTotal={billedSaleData.reduce((sum, i) => sum + i.price * i.qty, 0)}
            textColor={netTotalButtonColors[1] || theme.colors.onPinkContainer}
            totalDiscount={0}
            disabled
          />

          {/* Actions */}
          <View style={{ paddingTop: normalize(10) }}>
            <ButtonPaper
              icon="cancel"
              mode="contained-tonal"
              onPress={() => handleCancelBill?.(currentReceiptNo)}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              disabled={cancelledBillStatus === 'Y'}
            >
              CANCEL ESTIMATE
            </ButtonPaper>
          </View>
          <View
            style={{
              justifyContent: 'space-between',
              flexDirection: 'row',
              paddingTop: 10
            }}
          >
            <ButtonPaper mode="text" onPress={onDialogFailure} textColor={theme.colors.error}>
              Okay
            </ButtonPaper>
            <ButtonPaper mode="text" onPress={onShare} textColor={theme.colors.primary}>
              Share
            </ButtonPaper>
          </View>
        </Dialog.Content>
      </Dialog>
    </Portal>
  )
}
