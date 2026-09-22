import axios from "axios"
import { ADDRESSES } from "../../config/api_list"
import { loginStorage } from "../../storage/appStorage"
import { LoginDataMessage } from "../../models/api_types"

export default function useGamification() {
  const loginData = JSON.parse(loginStorage.getString("login-data") || "{}") as LoginDataMessage
  const userId = loginData.user_id

  const fetchDashboard = async () => {
    return new Promise<any>((resolve, reject) => {
      axios
        .get(`${ADDRESSES.GAMIFICATION_DASHBOARD}/${userId}`)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  const fetchLeaderboard = async () => {
    return new Promise<any>((resolve, reject) => {
      const brId = loginData.br_id;
      axios
        .get(`${ADDRESSES.GAMIFICATION_LEADERBOARD}?br_id=${brId}`)
        .then(res => {
          let data = res.data;
          console.log(data)
          // Local fallback filter just in case backend ignores the br_id query param
          if (data && data.status === 1 && Array.isArray(data.data)) {
            if (brId && data.data.length > 0 && 'br_id' in data.data[0]) {
              data.data = data.data.filter((l: any) => l.br_id == brId);
            }
          }
          resolve(data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  const fetchCoinHistory = async () => {
    return new Promise<any>((resolve, reject) => {
      axios
        .get(`${ADDRESSES.GAMIFICATION_COIN_HISTORY}/${userId}`)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  return { fetchDashboard, fetchLeaderboard, fetchCoinHistory, userId }
}
