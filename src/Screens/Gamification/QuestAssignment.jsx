// [GAMIFICATION LOGIC STARTS] - Admin Quest Assignment Screen
import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../../Address/baseURL";
import { Message } from "../../Components/Message";
import Backbtn from "../../Components/Backbtn";

function QuestAssignment() {
  const userType = localStorage.getItem("user_type");
  const localCompId = localStorage.getItem("comp_id");
  const localBrId = localStorage.getItem("br_id");

  const [formData, setFormData] = useState({
    company: userType === "M" ? localCompId : "",
    branch: userType === "M" ? localBrId : "",
    quest: "",
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [questsList, setQuestsList] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savedAssignments, setSavedAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const fetchAssignments = () => {
    setLoadingAssignments(true);
    axios
      .get(`${url}/admin/quest_assignment_list`)
      .then((res) => {
        let data = res?.data?.msg || [];
        if (!Array.isArray(data)) {
          data = data ? [data] : [];
        }
        setSavedAssignments(data);
      })
      .catch((err) => {
        console.error("Error fetching assignments:", err);
      })
      .finally(() => setLoadingAssignments(false));
  };

  useEffect(() => {
    fetchAssignments();
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

    // Fetch real Quests from backend
    setLoadingQuests(true);
    axios
      .get(`${url}/admin/quest_list`)
      .then((res) => {
        console.log("Quest list raw response:", res.data);
        const data = res?.data?.msg;
        console.log("Quest list msg:", data);
        if (Array.isArray(data)) {
          setQuestsList(data);
        } else if (data && typeof data === "object") {
          setQuestsList([data]);
        } else {
          setQuestsList([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching quests:", err);
      })
      .finally(() => setLoadingQuests(false));
  }, []);

  // Fetch branches based on selected company
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
    }
  }, [formData.company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "company") {
      setFormData((prev) => ({ ...prev, company: value, branch: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.branch || !formData.quest) {
      Message("error", "Please select Company, Branch, and Quest.");
      return;
    }

    console.log("Assigning Quest:", formData);
    const userId = localStorage.getItem("user_id") || "admin";
    const payload = {
      id: editingId,
      comp_id: formData.company,
      compId: formData.company,
      br_id: formData.branch,
      brId: formData.branch,
      quest_id: formData.quest,
      questId: formData.quest,
      user_id: userId,
      created_by: userId,
    };

    setIsSubmitting(true);
    axios
      .post(`${url}/admin/assign_quest`, payload)
      .then((res) => {
        if (res.data?.suc === 1) {
          Message("success", editingId ? "Quest assignment updated!" : "Quest assigned successfully!");
          fetchAssignments();
          setEditingId(null);
          setFormData({
            company: userType === "M" ? localCompId : "",
            branch: userType === "M" ? localBrId : "",
            quest: "",
          });
        } else {
          Message("error", res.data?.msg || "Failed to assign Quest.");
        }
      })
      .catch((err) => {
        console.error("Error assigning Quest:", err);
        Message("error", "Error assigning Quest.");
      })
      .finally(() => setIsSubmitting(false));
  };

    const deleteAssignment = async (assignmentId) => {
        try {
            const payload = { id: assignmentId };
            const res = await axios.post(`${url}/admin/delete_assignment`, payload);
            if (res.data?.suc === 1) {
                Message('success', 'Assignment deleted successfully');
                fetchAssignments();
            } else {
                Message('error', res.data?.msg || 'Failed to delete assignment');
            }
        } catch (err) {
            console.error('Error deleting assignment:', err);
            Message('error', 'Error deleting assignment');
        }
    };


  return (
    <>
      <Backbtn />
      <section className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Quest Assignment Screen
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-1 sm:gap-6">
              
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

              {/* Select Quest */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Select Quest
                </label>
                {loadingQuests ? (
                  <div className="flex items-center gap-2 p-2.5">
                    <svg className="animate-spin h-4 w-4 text-blue-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading quests...</span>
                  </div>
                ) : (
                  <select
                    name="quest"
                    value={formData.quest}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    required
                  >
                    <option value="">-- Select a Quest --</option>
                    {questsList.map((quest, index) => (
                      <option key={index} value={quest.quest_id}>
                        {quest.quest_name}
                      </option>
                    ))}
                  </select>
                )}
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
                {isSubmitting ? "Assigning..." : editingId ? "Update Assignment" : "Assign Quest"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      company: userType === "M" ? localCompId : "",
                      branch: userType === "M" ? localBrId : "",
                      quest: "",
                    });
                  }}
                  className="inline-flex bg-gray-500 items-center gap-2 px-8 py-2.5 ml-4 text-sm font-medium text-center text-white rounded-full focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-900 hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
          {/* Data Table Section */}
          <div className="mt-16">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-white">
            Assigned Quests
          </h2>
          <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="py-3 px-6">ID</th>
                  <th scope="col" className="py-3 px-6">Company</th>
                  <th scope="col" className="py-3 px-6">Branch</th>
                  <th scope="col" className="py-3 px-6">Quest</th>
                  <th scope="col" className="py-3 px-6">Type</th>
                  <th scope="col" className="py-3 px-6">Assigned By</th>
                  <th scope="col" className="py-3 px-6">Assigned Dt</th>
                  <th scope="col" className="py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingAssignments ? (
                  <tr>
                    <td colSpan="8" className="py-4 text-center">Loading...</td>
                  </tr>
                ) : savedAssignments.length > 0 ? (
                  savedAssignments.map((a, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="py-4 px-6">{a.id}</td>
                      <td className="py-4 px-6">{a.company_name || a.comp_id}</td>
                      <td className="py-4 px-6">{a.branch_name || a.br_id}</td>
                      <td className="py-4 px-6">{a.quest_name || a.quest_id}</td>
                      <td className="py-4 px-6">
                        {a.quest_type === "ITEMS" || a.quest_type === "ITEM" 
                          ? "Items (Per Qty)" 
                          : (a.quest_type === "ITEMS_PER_SHOP" ? "Items (Per Shop)" : a.quest_type)}
                      </td>
                      <td className="py-4 px-6">{a.created_by}</td>
                      <td className="py-4 px-6">{a.created_dt ? new Date(a.created_dt).toLocaleDateString() : ""}</td>
                        <td className="py-4 px-6">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setEditingId(a.id);
                                        setFormData({
                                            company: a.comp_id || (userType === "M" ? localCompId : ""),
                                            branch: a.br_id || (userType === "M" ? localBrId : ""),
                                            quest: a.quest_id || "",
                                        });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteAssignment(a.id)}
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
                    <td colSpan="8" className="py-4 text-center">No assignments found</td>
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

export default QuestAssignment;
// [GAMIFICATION LOGIC ENDS]
