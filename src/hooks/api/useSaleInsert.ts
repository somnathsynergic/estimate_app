import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { LoginDataMessage, SaleInsertData } from "../../models/api_types"
import { FilteredItem } from "../../models/custom_types"
import { loginStorage } from "../../storage/appStorage"

export default function useSaleInsert() {
  // const sendSaleDetails = async (
  //     companyId: string,
  //     branchId: string,
  //     itemId: string,
  //     price: string,
  //     discountAmt: string,
  //     quantity: string,
  //     cgstAmt?: string,
  //     sgstAmt?: string
  // ) => {
  //     return new Promise<SaleInsertData>((resolve, reject) => {
  //         axios.post(`${ADDRESSES.SALE_INSERT}`, {
  //             comp_id: companyId,
  //             br_id: branchId,
  //             item_id: itemId,
  //             price: price,
  //             discount_amt: discountAmt,
  //             qty: quantity,
  //             cgst_amt: cgstAmt,
  //             sgst_amt: sgstAmt,
  //         }, {}).then(res => {
  //             resolve(res.data)
  //         }).catch(err => {
  //             reject(err)
  //         })
  //     })
  // }
  const sendSaleDetails = async (productsWithCredentials: FilteredItem[]) => {
    // console.log("===========***********==========", productsWithCredentials)
    const loginStore = JSON.parse(loginStorage.getString("login-data") || '{}') as LoginDataMessage
    const targetUrl = loginStore?.stock_flag === 'N' ? ADDRESSES.SALE_INSERT_NOSTOCK : ADDRESSES.SALE_INSERT;
    return new Promise<SaleInsertData>((resolve, reject) => {
      axios
        .post(`${targetUrl}`, productsWithCredentials)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  return { sendSaleDetails }
}
