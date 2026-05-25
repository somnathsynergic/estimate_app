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
      axios
        .get(ADDRESSES.GAMIFICATION_LEADERBOARD)
        .then(res => {
          resolve(res.data)
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
