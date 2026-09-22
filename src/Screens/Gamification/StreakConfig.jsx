import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function StreakConfig() {
  // Day rewards state
  const [dayRewards, setDayRewards] = useState({
    day1: 10,
    day2: 20,
    day3: 30,
    day4: 40,
    day5: 50,
    day6: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const fetchConfig = () => {
    setLoadingConfig(true);
    axios
      .get(`${url}/admin/streak_config_list?t=${new Date().getTime()}`)
      .then((res) => {
        const data = res?.data?.msg || [];
        if (Array.isArray(data) && data.length > 0) {
          const loadedRewards = {
            day1: 10,
            day2: 20,
            day3: 30,
            day4: 40,
            day5: 50,
            day6: 60,
          };
          data.forEach((item) => {
            const dayNum = item.streak_day;
            if (dayNum >= 1 && dayNum <= 6) {
              loadedRewards[`day${dayNum}`] = parseInt(item.reward_coins) || 0;
            }
          });
          setDayRewards(loadedRewards);
        }
      })
      .catch((err) => {
        console.error("Error fetching streak config:", err);
      })
      .finally(() => setLoadingConfig(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleRewardChange = (e, dayKey) => {
    setDayRewards({
      ...dayRewards,
      [dayKey]: parseInt(e.target.value) || 0,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Streak Configuration:", { dayRewards });

    const userId = localStorage.getItem("user_id") || "admin";
    const payload = {
      day1: dayRewards.day1,
      day2: dayRewards.day2,
      day3: dayRewards.day3,
      day4: dayRewards.day4,
      day5: dayRewards.day5,
      day6: dayRewards.day6,
      user_id: userId,
      created_by: userId,
    };

    setIsSubmitting(true);
    axios
      .post(`${url}/admin/add_streak_config`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          Message("success", "Streak Configuration saved successfully!");
          // Refresh config after save
          fetchConfig();
        } else {
          Message("error", res.data?.msg || "Failed to save Streak Configuration.");
        }
      })
      .catch((err) => {
        console.error("Error saving streak configuration:", err);
        Message("error", "Error saving Streak Configuration.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <>
      <Backbtn />
      <section className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="py-8 px-4 mx-auto max-w-3xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Streak Configuration Screen
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Day Rewards Section */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700 flex items-center justify-between">
                <span>Daily Rewards</span>
                {loadingConfig && (
                  <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Loading saved config...
                  </span>
                )}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((dayNum) => (
                  <div key={`day${dayNum}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
                    <label className="text-sm font-medium text-gray-900 dark:text-white w-1/3">
                      Day {dayNum}
                    </label>
                    <input
                      type="number"
                      name={`day${dayNum}`}
                      value={dayRewards[`day${dayNum}`]}
                      onChange={(e) => handleRewardChange(e, `day${dayNum}`)}
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-2/3 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      min="0"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>



            {/* Submit Button */}
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex bg-blue-900 items-center gap-2 px-8 py-2.5 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                )}
                {isSubmitting ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default StreakConfig;
