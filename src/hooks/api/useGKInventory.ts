import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { loginStorage } from "../../storage/appStorage"
import { LoginDataMessage, GKFulfillRequest, GKPushIssue } from "../../models/api_types"

export default function useGKInventory() {
  const loginData = JSON.parse(loginStorage.getString("login-data") || "{}") as LoginDataMessage
  const userId = loginData.user_id

  const fetchPendingRequests = async () => {
    return new Promise<any>((resolve, reject) => {
      axios.post(ADDRESSES.GK_PENDING_REQUESTS, { "comp_id": loginData?.comp_id, "br_id": loginData.br_id })
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  const issueStock = async (payload: GKFulfillRequest) => {
    return new Promise<any>((resolve, reject) => {
      axios.post(ADDRESSES.GK_FULFILL, payload)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  const pushIssueStock = async (payload: GKPushIssue) => {
    return new Promise<any>((resolve, reject) => {
      axios.post(ADDRESSES.GK_PUSH_ISSUE, payload)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  const purchaseStock = async (payload: any) => {
    return new Promise<any>((resolve, reject) => {
      axios.post(`${ADDRESSES.STOCK}/purchase`, payload)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }

  return { fetchPendingRequests, issueStock, pushIssueStock, purchaseStock, userId }
}
