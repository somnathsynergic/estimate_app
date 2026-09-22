import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function CoinRuleConfig() {
  const [formData, setFormData] = useState({
    ruleName: "",
    ruleType: "ITEM",
    item: "",
    coinValue: 0,
    calculationType: "PER_QTY",
    startDate: "",
    endDate: "",
  });

  const [itemsList, setItemsList] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savedRules, setSavedRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);


  const fetchRules = () => {
    setLoadingRules(true);
    axios
      .get(`${url}/admin/coin_rule_list`)
      .then((res) => {
        let data = res?.data?.msg || [];
        if (!Array.isArray(data)) {
          data = data ? [data] : [];
        }
        setSavedRules(data);
      })
      .catch((err) => {
        console.error("Error fetching rules:", err);
      })
      .finally(() => setLoadingRules(false));
  };

  useEffect(() => {
    fetchRules();
    const compId = localStorage.getItem("comp_id") || 1;
    setLoadingItems(true);
    axios
      .get(`${url}/admin/S_Admin/item_detail?comp_id=${compId}`)
      .then((res) => {
        setItemsList(res?.data?.msg || []);
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
      })
      .finally(() => setLoadingItems(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let updatedData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    if (name === "ruleType") {
      if (value === "UNIQUE_SHOP") {
        updatedData.calculationType = "UNIQUE_SHOP";
      } else if (value === "POWER_SHOP") {
        updatedData.calculationType = "POWER_SHOP";
      } else if (value === "PER_SHOP") {
        updatedData.calculationType = "PER_SHOP";
      } else if (value === "ITEM") {
        updatedData.calculationType = "PER_QTY";
      }
    }
    setFormData(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Coin Rule:", formData);

    const userId = localStorage.getItem("user_id") || "admin";
    const payload = {
      id: editingId,
      calculationType: formData.calculationType,
      coinValue: String(formData.coinValue),
      endDate: formData.endDate,
      item: (formData.ruleType === "ITEM" || formData.ruleType === "PER_SHOP" || formData.ruleType === "POWER_SHOP") ? String(formData.item) : null,
      ruleName: formData.ruleName,
      ruleType: formData.ruleType,
      startDate: formData.startDate,
      user_id: userId,
      created_by: userId,
    };

    setIsSubmitting(true);
    axios
      .post(`${url}/admin/add_coin_rule`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          Message("success", editingId ? "Coin Rule updated successfully!" : "Coin Rule saved successfully!");
          fetchRules();
          setEditingId(null);
          setFormData({
            ruleName: "",
            ruleType: "ITEM",
            item: "",
            coinValue: 0,
            calculationType: "PER_QTY",
            startDate: "",
            endDate: "",
          });
        } else {
          Message("error", res.data?.msg || "Failed to save Coin Rule.");
        }
      })
      .catch((err) => {
        console.error("Error saving Coin Rule:", err);
        Message("error", "Error saving Coin Rule configuration.");
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this coin rule?")) {
      axios
        .post(`${url}/admin/delete_coin_rule`, { id })
        .then((res) => {
          if (res.data?.suc === 1) {
            Message("success", "Coin Rule deleted successfully!");
            fetchRules();
          } else {
            Message("error", res.data?.msg || "Failed to delete Coin Rule.");
          }
        })
        .catch((err) => {
          console.error("Error deleting Coin Rule:", err);
          Message("error", "Error deleting Coin Rule.");
        });
    }
  };

  return (
    <>
      <Backbtn />
      <section className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="py-8 px-4 mx-auto max-w-4xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Coin Rule Configuration
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              
              {/* Rule Name */}
              <div className="sm:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Rule Name
                </label>
                <input
                  type="text"
                  name="ruleName"
                  value={formData.ruleName}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="e.g. Weekend Double Coins"
                  required
                />
              </div>

              {/* Rule Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Rule Type
                </label>
                <select
                  name="ruleType"
                  value={formData.ruleType}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                >
                  <option value="ITEM">ITEM</option>
                  <option value="UNIQUE_SHOP">UNIQUE_SHOP</option>
                  <option value="POWER_SHOP">POWER_SHOP</option>
                  <option value="PER_SHOP">PER_SHOP</option>
                </select>
              </div>

              {/* Item / Target SKUs (rendered conditionally) */}
              {(formData.ruleType === "ITEM" || formData.ruleType === "PER_SHOP" || formData.ruleType === "POWER_SHOP") && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {formData.ruleType === "POWER_SHOP" ? "Target SKUs (Threshold)" : "Item"}
                  </label>
                  {formData.ruleType === "ITEM" || formData.ruleType === "PER_SHOP" ? (
                    loadingItems ? (
                      <div className="flex items-center gap-2 p-2.5">
                        <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span className="text-sm text-gray-500">Loading items...</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative" onBlur={(e) => {
                          setTimeout(() => setIsItemDropdownOpen(false), 200);
                        }}>
                          <input
                            type="text"
                            value={itemSearch}
                            onChange={(e) => {
                              setItemSearch(e.target.value);
                              setIsItemDropdownOpen(true);
                              setFormData((prev) => ({ ...prev, item: "" }));
                            }}
                            onFocus={() => setIsItemDropdownOpen(true)}
                            placeholder="Search items..."
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            required
                          />

                          {isItemDropdownOpen && itemSearch.trim().length > 0 && (
                            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                              {itemsList.filter((item) =>
                                (item?.item_name || "").toLowerCase().includes(itemSearch.trim().toLowerCase())
                              ).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No items found</div>
                              ) : (
                                itemsList
                                  .filter((item) =>
                                    (item?.item_name || "").toLowerCase().includes(itemSearch.trim().toLowerCase())
                                  )
                                  .slice(0, 100)
                                  .map((item) => (
                                    <button
                                      key={item.item_id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        setFormData((prev) => ({ ...prev, item: item.item_id }));
                                        setItemSearch(item.item_name || "");
                                        setIsItemDropdownOpen(false);
                                      }}
                                    >
                                      {item.item_name}
                                    </button>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )
                  ) : (
                    <input
                      type="number"
                      name="item"
                      value={formData.item}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="e.g. 10"
                      min="1"
                      required
                    />
                  )}
                </div>
              )}

              {/* Coin Value */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Coin Value
                </label>
                <input
                  type="number"
                  name="coinValue"
                  value={formData.coinValue}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Enter coin amount"
                  required
                />
              </div>

              {/* Calculation Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Calculation Type
                </label>
                <select
                  name="calculationType"
                  value={formData.calculationType}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                >
                  <option value="PER_QTY">PER_QTY</option>
                  <option value="PER_SHOP">PER_SHOP</option>
                  <option value="UNIQUE_SHOP">UNIQUE_SHOP</option>
                  <option value="POWER_SHOP">POWER_SHOP</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  required
                />
              </div>

            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex bg-blue-900 items-center gap-2 px-8 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                )}
                {isSubmitting ? "Saving..." : editingId ? "Update Rule" : "Save Rule"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      ruleName: "",
                      ruleType: "ITEM",
                      item: "",
                      coinValue: 0,
                      calculationType: "PER_QTY",
                      startDate: "",
                      endDate: "",
                    });
                  }}
                  className="inline-flex bg-gray-500 items-center gap-2 px-8 py-2.5 mt-4 sm:mt-6 ml-4 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-900 hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          {/* Data Table Section */}
          <div className="mt-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Saved Coin Rules
          </h2>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 px-6">ID</th>
                  <th scope="col" className="py-3 px-6">Rule Name</th>
                  <th scope="col" className="py-3 px-6">Item/Target</th>
                  <th scope="col" className="py-3 px-6">Calc Type</th>
                  <th scope="col" className="py-3 px-6">Coin Value</th>
                  <th scope="col" className="py-3 px-6">Start Date</th>
                  <th scope="col" className="py-3 px-6">End Date</th>
                  <th scope="col" className="py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRules ? (
                  <tr>
                    <td colSpan="7" className="py-4 text-center">Loading...</td>
                  </tr>
                ) : savedRules.length > 0 ? (
                  savedRules.map((rule, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="py-4 px-6">{rule.id}</td>
                      <td className="py-4 px-6">{rule.rule_name}</td>
                      <td className="py-4 px-6">
                        {rule.calculation_type === "POWER_SHOP" 
                          ? `${rule.item_id || 10} SKUs` 
                          : (rule.item_name || "N/A")}
                      </td>
                      <td className="py-4 px-6">{rule.calculation_type}</td>
                      <td className="py-4 px-6">{rule.coin_value}</td>
                      <td className="py-4 px-6">{rule.start_dt ? new Date(rule.start_dt).toLocaleDateString() : ""}</td>
                      <td className="py-4 px-6">{rule.end_dt ? new Date(rule.end_dt).toLocaleDateString() : ""}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setEditingId(rule.id);
                                        setFormData({
                                ruleName: rule.rule_name || "",
                                ruleType: (rule.calculation_type === "UNIQUE_SHOP" || rule.calculation_type === "POWER_SHOP" || rule.calculation_type === "PER_SHOP") ? rule.calculation_type : "ITEM",
                                item: rule.item_id || "",
                                coinValue: rule.coin_value || 0,
                                calculationType: rule.calculation_type || "PER_QTY",
                                startDate: rule.start_dt ? rule.start_dt.split('T')[0] : "",
                                endDate: rule.end_dt ? rule.end_dt.split('T')[0] : "",
                              });
                              setItemSearch(rule.item_name || "");
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="font-medium text-red-600 dark:text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-4 text-center">No rules found</td>
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

export default CoinRuleConfig;
