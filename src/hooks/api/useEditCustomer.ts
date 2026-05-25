import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { EditCustomerCredentials, BasicResponse } from "../../models/api_types"

export default function useEditCustomer() {
    const editCustomer = async (customerData: EditCustomerCredentials) => {
        console.log('editCustomerData', customerData)
        const res = await axios.post(`${ADDRESSES.EDIT_CUSTOMER}`, customerData);
        return res.data as BasicResponse;
    }
    return { editCustomer }
}
