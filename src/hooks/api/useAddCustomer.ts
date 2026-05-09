import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { AddCustomerCredentials, BasicResponse } from "../../models/api_types"

export default function useAddCustomer() {
    const addCustomer = async (customerData: AddCustomerCredentials) => {
        console.log('customerData', customerData)
        return new Promise<BasicResponse>((resolve, reject) => {
            axios
                .post(`${ADDRESSES.ADD_CUSTOMER}`, customerData)
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
    return { addCustomer }
}
