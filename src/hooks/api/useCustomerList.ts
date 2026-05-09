import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import {
  CustomerListCredentials,
  CustomerListResponse,
} from "../../models/api_types"

export default function useCustomerList() {
  const fetchCustomerList = async (creds: CustomerListCredentials) => {
    return new Promise<PromiseLike<CustomerListResponse>>((resolve, reject) => {
      axios
        .post(`${ADDRESSES.CUSTOMER_LIST}`, creds)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
  return { fetchCustomerList }
}
