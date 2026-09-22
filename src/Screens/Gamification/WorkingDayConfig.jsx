import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function WorkingDayConfig() {
  const userType = localStorage.getItem("user_type");
  const localCompId = localStorage.getItem("comp_id");
  const localBrId = localStorage.getItem("br_id");

  const [formData, setFormData] = useState({
    company: userType === "M" ? localCompId : "",
    branch: userType === "M" ? localBrId : "",
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // 0 = Monday, 6 = Sunday
  const [workingDays, setWorkingDays] = useState({
    "0": "Y",
    "1": "Y",
    "2": "Y",
    "3": "Y",
    "4": "Y",
    "5": "Y",
    "6": "Y",
  });

  const dayLabels = {
    "0": "Monday",
    "1": "Tuesday",
    "2": "Wednesday",
    "3": "Thursday",
    "4": "Friday",
    "5": "Saturday",
    "6": "Sunday",
  };

  useEffect(() => {
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

  useEffect(() => {
    if (formData.company) {
      setLoadingBranches(true);
      axios
        .get(`${url}/admin/S_Admin/select_outlet?comp_id=${formData.company}`)
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
      setFormData((prev) => ({ ...prev, branch: "" }));
    }
  }, [formData.company]);

  useEffect(() => {
    if (formData.company && formData.branch) {
      fetchWorkingDayConfig();
    } else {
      // Reset to default
      setWorkingDays({
        "0": "Y", "1": "Y", "2": "Y", "3": "Y", "4": "Y", "5": "Y", "6": "Y"
      });
    }
  }, [formData.company, formData.branch]);

  const fetchWorkingDayConfig = () => {
    setLoadingConfig(true);
    axios
      .get(`${url}/admin/working_day_list?comp_id=${formData.company}&br_id=${formData.branch}`)
      .then((res) => {
        if (res.data?.suc === 1 && Array.isArray(res.data?.msg)) {
          const config = res.data.msg;
          const newDays = {};
          config.forEach((item) => {
            newDays[item.weekday_no] = item.is_working_day;
          });
          setWorkingDays((prev) => ({ ...prev, ...newDays }));
        }
      })
      .catch((err) => {
        console.error("Error fetching working days:", err);
      })
      .finally(() => setLoadingConfig(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "company") {
      setFormData((prev) => ({ ...prev, company: value, branch: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDayToggle = (dayKey) => {
    setWorkingDays((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey] === "Y" ? "N" : "Y",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.branch) {
      Message("error", "Please select Company and Branch.");
      return;
    }

    const userId = localStorage.getItem("user_id") || "admin";
    const payload = {
      comp_id: formData.company,
      br_id: formData.branch,
      days: workingDays,
      user_id: userId,
      created_by: userId,
    };

    setIsSubmitting(true);
    axios
      .post(`${url}/admin/add_working_day`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          Message("success", "Working day configuration saved successfully!");
          fetchWorkingDayConfig();
        } else {
          Message("error", res.data?.msg || "Failed to save configuration.");
        }
      })
      .catch((err) => {
        console.error("Error saving working day config:", err);
        Message("error", "Error saving configuration.");
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <>
      <Backbtn />
      <section className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Null and Void Working Day Configuration
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Select the days that are considered "Working Days" for a branch. Unchecking a day makes it a holiday ("Null and Void"), meaning an employee will not lose their streak if they fail to complete a quest on that day.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-1 sm:gap-6 mb-6">
              
              {/* Select Estimate (Company) */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select Estimate (Company)
                </label>
                {loadingCompanies ? (
                  <div className="flex items-center gap-2 p-2.5">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading companies...</span>
                  </div>
                ) : (
                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required
                    disabled={userType === "M"}
                  >
                    <option value="">-- Select an Estimate --</option>
                    {companies.map((company, index) => (
                      <option key={index} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Branch */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select Branch
                </label>
                {loadingBranches ? (
                  <div className="flex items-center gap-2 p-2.5">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading branches...</span>
                  </div>
                ) : (
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required
                    disabled={!formData.company || userType === "M"}
                  >
                    <option value="">-- Select a Branch --</option>
                    {branches.map((branch, index) => (
                      <option key={index} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Days Checkboxes */}
            {formData.branch && (
              <div className="bg-gray-50 p-4 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Configure Working Days</span>
                  {loadingConfig && (
                    <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                      <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Loading...
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(dayLabels).map((dayKey) => (
                    <div key={dayKey} className="flex items-center">
                      <input
                        id={`day-${dayKey}`}
                        type="checkbox"
                        checked={workingDays[dayKey] === "Y"}
                        onChange={() => handleDayToggle(dayKey)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor={`day-${dayKey}`}
                        className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                      >
                        {dayLabels[dayKey]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={isSubmitting || !formData.branch}
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

export default WorkingDayConfig;
