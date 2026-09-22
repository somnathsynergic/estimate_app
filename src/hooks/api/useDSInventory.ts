import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { loginStorage } from "../../storage/appStorage"
import { LoginDataMessage, DSStockRequest, DSStockClaim } from "../../models/api_types"

export default function useDSInventory() {
  const loginData = JSON.parse(loginStorage.getString("login-data") || "{}") as LoginDataMessage
  const userId = loginData.user_id

  const requestStock = async (payload: DSStockRequest) => {
    return new Promise<any>((resolve, reject) => {
      axios.post(ADDRESSES.DS_REQUEST_STOCK, payload)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  const returnStock = async (payload: DSStockClaim) => {
    return new Promise<any>((resolve, reject) => {
      // console.log(payload)
      axios.post(ADDRESSES.DS_RETURN_STOCK, payload)
        .then(res => resolve(res.data))
        .catch(err => { reject(err) })
    })
  }

  const fetchDashboard = async () => {
    return new Promise<any>((resolve, reject) => {
      axios.get(`${ADDRESSES.DS_LIVE_INVENTORY}?user_id=${userId}`)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  const fetchLastApprovedRequests = async (payload: { user_id: string; comp_id: number; br_id: number }) => {
    return new Promise<any>((resolve, reject) => {
      console.log('Fetching last approved requests with payload', payload);
      const query = `?user_id=${payload.user_id}&comp_id=${payload.comp_id}&br_id=${payload.br_id}`;
      // axios.get(`${ADDRESSES.DS_LAST_APPROVED_REQUEST_LIST}${query}`)
      axios.post(`${ADDRESSES.DS_LAST_APPROVED_REQUEST_LIST}`, payload)
        .then(res => resolve(res.data))
        .catch(err => {
          console.error('fetchLastApprovedRequests error', err);
          reject(err);
        });
    });
  };

  return { requestStock, returnStock, fetchDashboard, fetchLastApprovedRequests, userId }
}
