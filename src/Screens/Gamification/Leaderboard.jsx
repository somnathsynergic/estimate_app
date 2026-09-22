import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function Leaderboard() {
  const userType = localStorage.getItem("user_type");
  const localCompId = localStorage.getItem("comp_id");
  const localBrId = localStorage.getItem("br_id");

  const [filterData, setFilterData] = useState({
    date: new Date().toISOString().split("T")[0],
    company: userType === "M" ? localCompId : "",
    branch: userType === "M" ? localBrId : "",
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    // Fetch Companies/Shops
    setLoadingCompanies(true);
    axios
      .get(`${url}/admin/S_Admin/select_shop?id=0`)
      .then((res) => {
        const shops = res?.data?.msg || [];
        if (!shops.some((shop) => +shop.id === 1)) {
          shops.unshift({ id: 1, company_name: "Estimate" });
        }
        setCompanies(shops);
      })
      .catch((err) => {
        console.error("Error fetching companies:", err);
        setCompanies([{ id: 1, company_name: "Estimate" }]);
      })
      .finally(() => setLoadingCompanies(false));
  }, []);

  // Fetch branches based on selected company
  useEffect(() => {
    if (filterData.company) {
      setLoadingBranches(true);
      axios
        .get(`${url}/admin/S_Admin/select_outlet?comp_id=${filterData.company}`)
        .then((res) => {
          setBranches(res?.data?.msg || []);
        })
        .catch((err) => {
          console.error("Error fetching branches:", err);
          setBranches([]);
        })
        .finally(() => setLoadingBranches(false));
    } else {
      setBranches([]);
    }
    if (userType !== "M") {
      setFilterData((prev) => ({ ...prev, branch: "" }));
    }
  }, [filterData.company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchLeaderboard = (showMessages = true) => {
    if (!filterData.date || !filterData.company || !filterData.branch) {
      return;
    }

    setLoadingLeaderboard(true);
    const payload = {
      date: filterData.date,
      comp_id: String(filterData.company),
      br_id: String(filterData.branch),
    };

    axios
      .post(`${url}/admin/admin_leaderboard`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          let data = res.data?.msg || [];
          if (!Array.isArray(data)) {
            data = data ? [data] : [];
          }
          setLeaderboardData(data);
          if (showMessages && data.length === 0) {
            Message("info", "No leaderboard data found for this selection.");
          }
        } else {
          setLeaderboardData([]);
          if (showMessages) {
            Message("error", res.data?.msg || "Failed to fetch leaderboard.");
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching leaderboard:", err);
        setLeaderboardData([]);
        if (showMessages) {
          Message("error", "Error connecting to the leaderboard server.");
        }
      })
      .finally(() => setLoadingLeaderboard(false));
  };

  useEffect(() => {
    fetchLeaderboard(false);
  }, [filterData.date, filterData.company, filterData.branch]);

  const handleFetchLeaderboard = (e) => {
    if (e) e.preventDefault();
    if (!filterData.date || !filterData.company || !filterData.branch) {
      Message("error", "Please select Date, Company, and Branch.");
      return;
    }
    fetchLeaderboard(true);
  };

  return (
    <>
      <Backbtn />
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-blue-900 dark:text-white tracking-tight">
              🏆 Gamification Leaderboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Track and rank salesperson performance by date, company, and branch.
            </p>
          </div>

          {/* Filters Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
            <form onSubmit={handleFetchLeaderboard} className="grid gap-6 md:grid-cols-4 items-end">
              
              {/* Date Selection */}
              <div>
                <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Select Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filterData.date}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  required
                />
              </div>

              {/* Company Selection */}
              <div>
                <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </label>
                {loadingCompanies ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <select
                    name="company"
                    value={filterData.company}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={userType === "M"}
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map((company, index) => (
                      <option key={index} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Branch
                </label>
                {loadingBranches ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <select
                    name="branch"
                    value={filterData.branch}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    disabled={!filterData.company || userType === "M"}
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map((branch, index) => (
                      <option key={index} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={loadingLeaderboard}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-xl p-3 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
                >
                  {loadingLeaderboard ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Refresh</span>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Leaderboard Table / Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-750 flex items-center justify-between">
              <h3 className="font-bold text-lg text-blue-900 dark:text-white">Rankings</h3>
              <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                {leaderboardData.length} Users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="py-4 px-6 text-center w-24">Rank</th>
                    <th scope="col" className="py-4 px-6">User ID</th>
                    <th scope="col" className="py-4 px-6">User Name</th>
                    <th scope="col" className="py-4 px-6 text-right">Coins Earned</th>
                    <th scope="col" className="py-4 px-6 text-center">Max Streak Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loadingLeaderboard ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <svg className="animate-spin h-8 w-8 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Fetching fresh leaderboard stats...</span>
                        </div>
                      </td>
                    </tr>
                  ) : leaderboardData.length > 0 ? (
                    leaderboardData.map((row, index) => {
                      const rank = index + 1;
                      let rankBadge = (
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          #{rank}
                        </span>
                      );
                      if (rank === 1) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 text-lg shadow-sm">
                            🥇
                          </span>
                        );
                      } else if (rank === 2) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-800 text-lg shadow-sm">
                            🥈
                          </span>
                        );
                      } else if (rank === 3) {
                        rankBadge = (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 text-lg shadow-sm">
                            🥉
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={index}
                          className="hover:bg-blue-50/30 dark:hover:bg-gray-750/30 transition duration-150"
                        >
                          <td className="py-4 px-6 text-center font-bold">
                            {rankBadge}
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                            {row.user_id}
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                            {row.user_name}
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold text-blue-900 dark:text-blue-400 text-base">
                            🪙 {row.total_earned}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                              🔥 {row.max_streak} Days
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-400 dark:text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-4xl">📊</span>
                          <span className="text-sm font-medium">
                            No leaderboard records to display. Select filters and click Fetch Rank.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}

export default Leaderboard;
