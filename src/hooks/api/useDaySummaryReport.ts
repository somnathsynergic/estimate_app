import axios from "axios";
import { ADDRESSES } from "../../config/api_list";

export default function useDaySummaryReport() {
  const fetchDaySummary = async (creds: { user_id: string | number; date: string }) => {
    const url = `${ADDRESSES.DS_DAILY_SUMMARY}?user_id=${creds.user_id}&date=${creds.date}`;
    return axios
      .get(url)
      .then(res => res.data)
      .catch(err => {
        // Propagate error to caller
        throw err;
      });
  };

  return { fetchDaySummary };
}
