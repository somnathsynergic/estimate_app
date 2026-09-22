// [GAMIFICATION LOGIC STARTS] - Admin Quest Creation Screen
import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function QuestCreation() {
  const [formData, setFormData] = useState({
    questName: "",
    questType: "ITEMS",
    targetItem: "",
    targetQty: 1,
    startDate: "",
    endDate: "",
  });

  const [itemsList, setItemsList] = useState([]);
  const [targetItemSearch, setTargetItemSearch] = useState("");
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  // kept only for backward compatibility; display is handled by targetItemSearch
  // const [itemSearch, setItemSearch] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savedQuests, setSavedQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(false);


  const fetchQuests = () => {
    setLoadingQuests(true);
    axios
      .get(`${url}/admin/quest_list`)
      .then((res) => {
        let data = res?.data?.msg || [];
        if (!Array.isArray(data)) {
          data = data ? [data] : [];
        }
        setSavedQuests(data);
      })
      .catch((err) => {
        console.error("Error fetching quests:", err);
      })
      .finally(() => setLoadingQuests(false));
  };

  useEffect(() => {
    fetchQuests();
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
    
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "select-multiple") {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Quest:", formData);

    const userId = localStorage.getItem("user_id") || "admin";
    const payload = {
      id: editingId,
      endDate: formData.endDate,
      questName: formData.questName,
      questType: formData.questType,
      startDate: formData.startDate,
      targetItem: (formData.questType === "ITEMS" || formData.questType === "ITEM" || formData.questType === "ITEMS_PER_SHOP") ? formData.targetItem : null,
      targetQty: formData.targetQty,
      user_id: userId,
      created_by: userId,
    };

    setIsSubmitting(true);
    axios
      .post(`${url}/admin/add_quest`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          Message("success", editingId ? "Quest updated successfully!" : "Quest created successfully!");
          fetchQuests();
          setEditingId(null);
          setFormData({
            questName: "",
            questType: "ITEMS",
            targetItem: "",
            targetQty: 1,
            startDate: "",
            endDate: "",
          });
        } else {
          Message("error", res.data?.msg || "Failed to create Quest.");
        }
      })
      .catch((err) => {
        console.error("Error creating Quest:", err);
        Message("error", "Error creating Quest.");
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (id, force = false) => {
    const confirmMsg = force 
      ? "This quest is assigned to users. Are you sure you want to force delete it and remove those records?" 
      : "Are you sure you want to delete this quest?";

    if (window.confirm(confirmMsg)) {
      axios
        .post(`${url}/admin/delete_quest`, { id, force })
        .then((res) => {
          if (res.data?.suc === 1) {
            Message("success", "Quest deleted successfully!");
            fetchQuests();
          } else if (res.data?.msg?.includes("assigned") && !force) {
            handleDelete(id, true);
          } else {
            Message("error", res.data?.msg || "Failed to delete Quest.");
          }
        })
        .catch((err) => {
          console.error("Error deleting Quest:", err);
          Message("error", "Error deleting Quest.");
        });
    }
  };

  return (
    <>
      <Backbtn />
      <section className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="py-8 px-4 mx-auto max-w-4xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Quest Creation Screen
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              
              {/* Quest Name */}
              <div className="sm:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Quest Name
                </label>
                <input
                  type="text"
                  name="questName"
                  value={formData.questName}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="e.g. Sell 10 items today"
                  required
                />
              </div>

              {/* Quest Type */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Quest Type
                </label>
                <select
                  name="questType"
                  value={formData.questType}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                >
                  <option value="ITEMS">Items (Per Qty)</option>
                  <option value="ITEMS_PER_SHOP">Items (Per Shop)</option>
                  <option value="UNIQUE_SHOPS">Unique Shops</option>
                  <option value="POWER_SHOPS">Power Shops</option>
                </select>
              </div>

              {/* Target Item (rendered conditionally) */}
              {(formData.questType === "ITEMS" || formData.questType === "ITEM" || formData.questType === "ITEMS_PER_SHOP") && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Target Item
                  </label>
                  {loadingItems ? (
                    <div className="flex items-center gap-2 p-2.5">
                      <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span className="text-sm text-gray-500">Loading items...</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative" onBlur={() => { setTimeout(() => setIsItemDropdownOpen(false), 200); }}>
                        <input
                          type="text"
                          value={targetItemSearch}
                          onChange={(e) => {
                            setTargetItemSearch(e.target.value);
                            setIsItemDropdownOpen(true);
                          }}
                          onFocus={() => setIsItemDropdownOpen(true)}
                          placeholder="Search items..."
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                          required
                        />

                        {isItemDropdownOpen && targetItemSearch.trim().length > 0 && (
                          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                            {itemsList.filter((item) =>
                              (item?.item_name || "").toLowerCase().includes(targetItemSearch.trim().toLowerCase())
                            ).length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No items found</div>
                            ) : (
                              itemsList
                                .filter((item) =>
                                  (item?.item_name || "").toLowerCase().includes(targetItemSearch.trim().toLowerCase())
                                )
                                .slice(0, 100)
                                .map((item) => (
                                  <button
                                    key={item.item_id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, targetItem: item.item_id }));
                                      setTargetItemSearch(item.item_name || "");
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
                  )}
                </div>
              )}

              {/* Target Qty */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Target Qty
                </label>
                <input
                  type="number"
                  name="targetQty"
                  value={formData.targetQty}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  min="1"
                  required
                />
              </div>

              {/* Removed Reward Coins */}

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
                {isSubmitting ? "Saving..." : editingId ? "Update Quest" : "Create Quest"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      questName: "",
                      questType: "ITEMS",
                      targetItem: "",
                      targetQty: 1,
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
            Saved Quests
          </h2>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 px-6">ID</th>
                  <th scope="col" className="py-3 px-6">Quest Name</th>
                  <th scope="col" className="py-3 px-6">Type</th>
                  <th scope="col" className="py-3 px-6">Target Item</th>
                  <th scope="col" className="py-3 px-6">Target Qty</th>
                  <th scope="col" className="py-3 px-6">Created Dt</th>
                  <th scope="col" className="py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingQuests ? (
                  <tr>
                    <td colSpan="8" className="py-4 text-center">Loading...</td>
                  </tr>
                ) : savedQuests.length > 0 ? (
                  savedQuests.map((q, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="py-4 px-6">{q.quest_id}</td>
                      <td className="py-4 px-6">{q.quest_name}</td>
                      <td className="py-4 px-6">
                        {q.quest_type === "ITEMS" || q.quest_type === "ITEM" 
                          ? "Items (Per Qty)" 
                          : (q.quest_type === "ITEMS_PER_SHOP" ? "Items (Per Shop)" : q.quest_type)}
                      </td>
                      <td className="py-4 px-6">{q.item_name || "N/A"}</td>
                      <td className="py-4 px-6">{q.target_qty}</td>
                      <td className="py-4 px-6">{q.created_dt ? new Date(q.created_dt).toLocaleDateString() : ""}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setEditingId(q.quest_id);
                              setFormData({
                                questName: q.quest_name || "",
                                questType: q.quest_type || "ITEMS",
                                targetItem: q.item_id || "",
                                targetQty: q.target_qty || 1,
                                startDate: q.start_dt ? q.start_dt.split('T')[0] : "",
                                endDate: q.end_dt ? q.end_dt.split('T')[0] : "",
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.quest_id)}
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
                    <td colSpan="8" className="py-4 text-center">No quests found</td>
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

export default QuestCreation;
// [GAMIFICATION LOGIC ENDS]
