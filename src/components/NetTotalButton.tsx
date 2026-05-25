import { View } from "react-native"
import { TouchableRipple, Text } from "react-native-paper"
import normalize from "react-native-normalize"
import { useContext } from "react"
import { AppStore } from "../context/AppContext"
import { ItemsData } from "../models/api_types"
import { gstFilterationAndTotals } from "../utils/gstFilterTotal"
import useCalculations from "../hooks/useCalculations"
import { AppStoreContext } from "../models/custom_types"

// type NetTotalButtonProps = {
//   backgroundColor: string
//   textColor: string
//   netTotal: number
//   totalDiscount: number
//   addedProductsList?: ItemsData[]
//   onPress?: () => void
//   height?: number | "auto"
//   width?: number
//   disabled?: boolean
//   cgst?: number
//   sgst?: number
// }

// export default function NetTotalButton({
//   disabled = false,
//   backgroundColor,
//   textColor,
//   addedProductsList,
//   netTotal,
//   totalDiscount,
//   width = 320,
//   height = "auto",
//   cgst,
//   sgst,
//   onPress,
// }: NetTotalButtonProps) {
//   const { receiptSettings } = useContext(AppStore)

//   const {
//     netTotalCalculate,
//     netTotalWithGSTCalculate,
//     roundingOffCalculate,
//     grandTotalCalculate,
//     roundingOffWithGSTCalculate,
//     grandTotalWithGSTCalculate
//   } = useCalculations()

//   // addedProductsList?.filter((item, i) => item.discount)
//   let { totalCGST_2_5, totalSGST_2_5, totalCGST_12, totalCGST_18, totalCGST_28, totalSGST_5, totalSGST_12, totalSGST_18, totalSGST_28, totalGST } = gstFilterationAndTotals(addedProductsList)

//   return (
//     receiptSettings?.gst_flag !== "Y" ? (
//       <TouchableRipple
//         disabled={disabled}
//         style={{
//           width: normalize(width),
//           height: height,
//           backgroundColor: backgroundColor,
//           alignSelf: "center",
//           borderRadius: normalize(30),
//           marginTop: normalize(15),
//         }}
//         onPress={onPress}>
//         <View
//           style={{
//             margin: normalize(15),
//             justifyContent: "space-between",
//             alignItems: "center",
//             flexDirection: "row",
//           }}>
//           <View>
//             <Text style={{ color: textColor }}>TOTAL AMOUNT</Text>
//             <Text style={{ color: textColor }}>DISCOUNT</Text>
//             <Text style={{ color: textColor }}>NET TOTAL</Text>
//             <Text style={{ color: textColor }}>ROUNDING OFF</Text>
//             <Text style={{ color: textColor }}>GRAND TOTAL</Text>
//           </View>
//           <View>
//             <Text style={{ color: textColor }}>₹{netTotal?.toFixed(2)}</Text>
//             <Text style={{ color: textColor }}>₹{totalDiscount?.toFixed(2)}</Text>
//             <Text style={{ color: textColor }}>
//               ₹
//               {/* {(netTotal - totalDiscount).toFixed(2)} */}
//               {netTotalCalculate(netTotal, totalDiscount)}
//             </Text>
//             <Text style={{ color: textColor }}>
//               ₹
//               {/* {(Math.round(parseFloat((netTotal - totalDiscount).toFixed(2))) - parseFloat((netTotal - totalDiscount).toFixed(2))).toFixed(2)} */}
//               {roundingOffCalculate(netTotal, totalDiscount)}
//             </Text>
//             <Text style={{ color: textColor }}>
//               ₹
//               {/* {Math.round(parseFloat((netTotal - totalDiscount).toFixed(2)))} */}
//               {grandTotalCalculate(netTotal, totalDiscount)}
//             </Text>
//           </View>
//         </View>
//       </TouchableRipple>
//     ) : (
//       <TouchableRipple
//         disabled={disabled}
//         style={{
//           width: normalize(width),
//           height: height,
//           backgroundColor: backgroundColor,
//           alignSelf: "center",
//           borderRadius: normalize(30),
//           marginTop: normalize(15),
//         }}
//         onPress={onPress}>
//         <View
//           style={{
//             margin: normalize(15),
//             justifyContent: "space-between",
//             alignItems: "center",
//             flexDirection: "row",
//           }}>
//           <View>
//             <Text style={{ color: textColor }}>TOTAL AMOUNT</Text>
//             <Text style={{ color: textColor }}>DISCOUNT</Text>

//             {totalCGST_2_5 > 0 && <Text style={{ color: textColor }}>CGST @2.5%</Text>}
//             {totalSGST_2_5 > 0 && <Text style={{ color: textColor }}>SGST @2.5%</Text>}
//             {totalCGST_12 > 0 && <Text style={{ color: textColor }}>CGST @12%</Text>}
//             {totalSGST_12 > 0 && <Text style={{ color: textColor }}>SGST @12%</Text>}
//             {totalCGST_18 > 0 && <Text style={{ color: textColor }}>CGST @18%</Text>}
//             {totalSGST_18 > 0 && <Text style={{ color: textColor }}>SGST @18%</Text>}
//             {totalCGST_28 > 0 && <Text style={{ color: textColor }}>CGST @28%</Text>}
//             {totalSGST_28 > 0 && <Text style={{ color: textColor }}>SGST @28%</Text>}

//             <Text style={{ color: textColor }}>NET TOTAL</Text>
//             <Text style={{ color: textColor }}>ROUNDING OFF</Text>
//             <Text style={{ color: textColor }}>GRAND TOTAL</Text>
//           </View>
//           <View>
//             <Text style={{ color: textColor }}>₹{netTotal?.toFixed(2)}</Text>
//             <Text style={{ color: textColor }}>₹{totalDiscount?.toFixed(2)}</Text>
//             {/* <Text style={{ color: textColor }}>{cgst}%</Text>
//             <Text style={{ color: textColor }}>{sgst}%</Text> */}

//             {totalCGST_2_5 > 0 && <Text style={{ color: textColor }}>{totalCGST_2_5 && totalCGST_2_5.toFixed(2)}</Text>}
//             {totalSGST_2_5 > 0 && <Text style={{ color: textColor }}>{totalSGST_2_5 && totalSGST_2_5.toFixed(2)}</Text>}
//             {totalCGST_12 > 0 && <Text style={{ color: textColor }}>{totalCGST_12 && totalCGST_12.toFixed(2)}</Text>}
//             {totalSGST_12 > 0 && <Text style={{ color: textColor }}>{totalSGST_12 && totalSGST_12.toFixed(2)}</Text>}
//             {totalCGST_18 > 0 && <Text style={{ color: textColor }}>{totalCGST_18 && totalCGST_18.toFixed(2)}</Text>}
//             {totalSGST_18 > 0 && <Text style={{ color: textColor }}>{totalSGST_18 && totalSGST_18.toFixed(2)}</Text>}
//             {totalCGST_28 > 0 && <Text style={{ color: textColor }}>{totalCGST_28 && totalCGST_28.toFixed(2)}</Text>}
//             {totalSGST_28 > 0 && <Text style={{ color: textColor }}>{totalSGST_28 && totalSGST_28.toFixed(2)}</Text>}

//             <Text style={{ color: textColor }}>
//               {/* {(netTotal - totalDiscount + totalGST).toFixed(2)} */}
//               {netTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}
//             </Text>

//             <Text style={{ color: textColor }}>
//               {/* {(Math.round(parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))).toFixed(2)} */}
//               {roundingOffWithGSTCalculate(netTotal, totalDiscount, totalGST)}
//             </Text>

//             <Text style={{ color: textColor }}>
//               ₹
//               {/* {Math.round(parseFloat((netTotal - totalDiscount + totalGST).toFixed(2))).toFixed(2)} */}
//               {grandTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}
//             </Text>
//           </View>
//         </View>
//       </TouchableRipple>
//     )

//   )
// }

type NetTotalButtonProps = {
  backgroundColor: string
  textColor: string
  netTotal: number
  totalDiscount: number
  addedProductsList?: ItemsData[]
  onPress?: () => void
  height?: number | "auto"
  width?: number
  disabled?: boolean
}

export default function NetTotalButton({
  disabled = false,
  backgroundColor,
  textColor,
  addedProductsList,
  netTotal,
  totalDiscount,
  width = 325,
  height = "auto",
  onPress,
}: NetTotalButtonProps) {
  const { receiptSettings } = useContext<AppStoreContext>(AppStore)

  const {
    netTotalCalculate,
    netTotalWithGSTCalculate,
    roundingOffCalculate,
    grandTotalCalculate,
    roundingOffWithGSTCalculate,
    grandTotalWithGSTCalculate,

    totalAmountWithGSTInclCalculate,
    netTotalWithGSTInclCalculate,
    roundingOffWithGSTInclCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  let gstTotals = gstFilterationAndTotals(
    addedProductsList,
    receiptSettings?.gst_type,
  )
  let { totalGST } = gstTotals // Destructure totalGST for separate handling

  // Filter keys for CGST and SGST display
  const gstKeys = Object.keys(gstTotals).filter(
    key => key.includes("totalCGST") || key.includes("totalSGST"),
  )

  const LABEL_COLOR = "#0D47A1"
  const VALUE_COLOR = "#546E7A"
  const GRAND_TOTAL_COLOR = "#0D47A1"
  const DIVIDER_COLOR = "#E3EEFF"

  const rowStyle = {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: normalize(5),
  }
  const labelStyle = { color: LABEL_COLOR, fontSize: normalize(12), fontWeight: "500" as const, letterSpacing: 0.3 }
  const valueStyle = { color: VALUE_COLOR, fontSize: normalize(12), fontWeight: "600" as const }
  const grandLabelStyle = { color: GRAND_TOTAL_COLOR, fontSize: normalize(14), fontWeight: "700" as const, letterSpacing: 0.4 }
  const grandValueStyle = { color: GRAND_TOTAL_COLOR, fontSize: normalize(14), fontWeight: "800" as const }

  return (
    <TouchableRipple
      disabled={disabled}
      style={{
        width: normalize(width),
        height: height,
        backgroundColor: "#FFFFFF",
        alignSelf: "center",
        borderRadius: normalize(16),
        paddingHorizontal: normalize(10),
        paddingTop: normalize(8),
        paddingBottom: normalize(4),
        marginTop: normalize(8),
      }}
      onPress={onPress}>
      <View>
        {receiptSettings?.gst_flag === "Y" ? (
          <View>
            {receiptSettings?.gst_type === "E" && (
              <View style={rowStyle}>
                <Text style={labelStyle}>TOTAL AMOUNT</Text>
                <Text style={valueStyle}>₹{netTotal?.toFixed(2)}</Text>
              </View>
            )}

            {gstKeys.map(key => (
              <View key={key} style={rowStyle}>
                <Text style={labelStyle}>
                  {key.includes("CGST") ? "CGST" : "SGST"} @
                  {key.replace(/total(CGST|SGST)_/, "").replace("_", ".") + "%"}
                </Text>
                <Text style={valueStyle}>₹{gstTotals[key].toFixed(2)}</Text>
              </View>
            ))}

            {totalDiscount !== 0 && totalDiscount.toString().length !== 0 && (
              <View style={rowStyle}>
                <Text style={labelStyle}>DISCOUNT</Text>
                <Text style={valueStyle}>
                  {/* @ts-ignore */}
                  ₹{parseFloat(totalDiscount).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={rowStyle}>
              <Text style={labelStyle}>NET TOTAL</Text>
              {receiptSettings?.gst_type === "E" ? (
                <Text style={valueStyle}>₹{netTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}</Text>
              ) : (
                <Text style={valueStyle}>₹{netTotalWithGSTInclCalculate(netTotal, totalDiscount)}</Text>
              )}
            </View>

            <View style={rowStyle}>
              <Text style={labelStyle}>ROUNDING OFF</Text>
              {receiptSettings?.gst_type === "E" ? (
                <Text style={valueStyle}>₹{roundingOffWithGSTCalculate(netTotal, totalDiscount, totalGST)}</Text>
              ) : (
                <Text style={valueStyle}>₹{roundingOffWithGSTInclCalculate(netTotal, totalDiscount)}</Text>
              )}
            </View>

            <View style={{ height: 1, backgroundColor: DIVIDER_COLOR, marginVertical: normalize(6) }} />

            <View style={rowStyle}>
              <Text style={grandLabelStyle}>GRAND TOTAL</Text>
              {receiptSettings?.gst_type === "E" ? (
                <Text style={grandValueStyle}>₹{grandTotalWithGSTCalculate(netTotal, totalDiscount, totalGST)}</Text>
              ) : (
                <Text style={grandValueStyle}>₹{grandTotalWithGSTInclCalculate(netTotal, totalDiscount)}</Text>
              )}
            </View>
          </View>
        ) : (
          <View>
            <View style={rowStyle}>
              <Text style={labelStyle}>TOTAL AMOUNT</Text>
              <Text style={valueStyle}>₹{netTotal?.toFixed(2)}</Text>
            </View>

            {totalDiscount !== 0 && totalDiscount.toString().length !== 0 && (
              <View style={rowStyle}>
                <Text style={labelStyle}>DISCOUNT</Text>
                <Text style={valueStyle}>
                  {/* @ts-ignore */}
                  ₹{parseFloat(totalDiscount).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={rowStyle}>
              <Text style={labelStyle}>NET TOTAL</Text>
              <Text style={valueStyle}>₹{netTotalCalculate(netTotal, totalDiscount)}</Text>
            </View>

            <View style={rowStyle}>
              <Text style={labelStyle}>ROUNDING OFF</Text>
              <Text style={valueStyle}>₹{roundingOffCalculate(netTotal, totalDiscount)}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: DIVIDER_COLOR, marginVertical: normalize(6) }} />

            <View style={rowStyle}>
              <Text style={grandLabelStyle}>GRAND TOTAL</Text>
              <Text style={grandValueStyle}>₹{grandTotalCalculate(netTotal, totalDiscount)}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
