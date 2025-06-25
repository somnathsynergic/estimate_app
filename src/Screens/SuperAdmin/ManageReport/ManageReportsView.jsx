import React, { useEffect, useState } from "react";
import DatatableAdv from "../../../Components/DatatableAdv";
import { useNavigate } from "react-router-dom";
import { Message } from "../../../Components/Message";
import useAPI from "../../../Hooks/useApi";
import HeaderLayout from "../../../Components/HeaderLayout";
import axios from "axios";
import { url } from "../../../Address/baseURL";

function ManageReportsView() {
  const navigation = useNavigate();
  const [called, setCalled] = useState(false);
  const { response, callApi } = useAPI();
  const [resp, setRestp] = useState();
  const [isReport, setIsReport] = useState(false);
  const [compId, setCompId] = useState(null);
  const [outlets, setOutlets] = useState(() => []);
  const [shops, setShops] = useState(() => []);
  const [dataSet, setDataSet] = useState();
  const [search, setSearch] = useState();
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  var comp;

  useEffect(() => {
    console.log(response?.data?.msg, 'response');
    setDataSet(response?.data?.msg);

    if (response?.data?.msg?.length <= 0) {
      Message("error", "No data!");
      setIsReport(false);
    } else {
      if (called) {
        setDataSet(response?.data?.msg);
        setIsReport(true);
        setCalled(false);
      }
    }
  }, [response]);

  useEffect(() => {
    // callApi(`/admin/S_Admin/select_location`, 0);
    axios
      .get(`${url}/admin/S_Admin/select_shop?id=0`)
      .then((res) => {
        setShops(res?.data?.msg);
        console.log(res);
      })
      .catch((err) => {
        Message("error", err);
      });
  }, []);

  useEffect(() => {
    // callApi(`/admin/S_Admin/select_location`, 0);
    if (compId)
      axios
        .get(`${url}/admin/S_Admin/select_outlet?comp_id=${compId}`)
        .then((res) => {
          setOutlets(res?.data?.msg);
          console.log(res);
        })
        .catch((err) => {
          Message("error", err);
        });
  }, [compId]);

  useEffect(() => {
    // comp = localStorage.getItem("comp_id");
    // console.log(compId, selectedOutlet, 'compId and selectedOutlet');
    let payload = {br_id: selectedOutlet}

    if (compId && selectedOutlet)
      // callApi(
      //   `/admin/S_Admin/select_user_by_shop?comp_id=${compId}&br_id=${selectedOutlet}`,
      //   0
      // );
      callApi("/admin/S_Admin/user_report", 1, payload);
      console.log(response?.data?.msg, 'response in useEffect');
  }, [compId, selectedOutlet]);

  // useEffect(() => {
  //   // comp = localStorage.getItem("comp_id");
  //   callApi(`/admin/S_Admin/select_user?id=${0}`, 0);
  // }, []);

  const onPress = (data) => {
    console.log(data);
    // navigation("/home/superadmin/manageusers/manageuser/" + data.id);
  };

  useEffect(() => {
    setDataSet(
      response?.data?.msg?.filter(
        (e) =>
          e.user_name
            .toLowerCase()
            .includes(search?.toString().toLowerCase()) ||
          e.user_id
            ?.toString()
            .toLowerCase()
            .includes(search?.toString().toLowerCase())
      )
    );
  }, [search]);



  return (
    <div className="py-1 w-full ">
      <HeaderLayout
        title={"Manage Reports"}
        // btnText={"Add User"}
        // onPress={() => onPress({ id: 0 })}
      />
      <section class="dark:bg-gray-900 p-3 ">
        <div class="my-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <label
              htmlFor="brand"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Select Shop
            </label>
            <select
              id="comp_id"
              name="comp_id"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              onChange={(e) => setCompId(e.target.value)}
              // onBlur={() => null}
              value={compId}>
              <option selected value={undefined}>
                Select Shop
              </option>

              {shops?.map((items, i) => (
                <option key={i} value={items?.id}>
                  {items?.company_name}
                </option>
              ))}
            </select>
            {called && !compId ? (
              <div className="text-red-500 text-sm">Shop Name is required</div>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="brand"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Select Outlet
            </label>
            <select
              id="br_id"
              name="br_id"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              onChange={(e) => setSelectedOutlet(e.target.value)}
              // onBlur={() => null}
              value={selectedOutlet}>
              <option selected value={undefined}>
                Select outlet
              </option>

              {outlets ?.filter((item) => item.created_dt !== null)
              .map((item, i) => (
              <option key={i} value={item.id}>
              {item.branch_name}
              </option>
              ))}
            </select>
            {called && !compId ? (
              <div className="text-red-500 text-sm">Outlet is required</div>
            ) : null}
          </div>
        </div>
        <div class="mx-auto w-full">
          <div class="bg-blue-900 dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              {/* {JSON.stringify(selectedOutlet, null, 2)}
                {outlets.length > 0 && (
                outlets.map((items, i) => (
                items?.id === selectedOutlet && (
                <p key={i} value={items?.id}>
                {items?.branch_name}
                </p>
                )
                ))
                )} */}
              
              <DatatableAdv
                onPress={(data) => onPress(data)}
                rowClickDisabled = {true}
                enablePagination={false}
                setSearch={(val) => setSearch(val)}
                title={"Manage Reports "}
                // btnText={"Add User"}
                btnExportTxt={"Download"}
                pageName={'manageReport'}
                // onclick={() => onPress({ id: 0 })}
                flag={1}
                headers={[
                  { name: "id", value: "#" },
                  // { name: "comp_id", value: "Company ID" },
                  // { name: "br_id", value: "Branch ID" },
                  { name: "user_name", value: "User Name" },
                  { name: "user_id", value: "User ID" },
                  { name: "device_id", value: "Device ID" },
                  { name: "active_flag", value: "Active Flag" },
                  { name: "created_dt", value: "Create Date" },
                ]}
                data={dataSet}
                // onToggleSwitch={(checked, row) => {
                // const newStatus = checked ? "Y" : "N";

                // // Update local state
                // setDataSet((prev) =>
                // prev.map((item) =>
                // item.id === row.id ? { ...item, active_flag: newStatus } : item
                // )
                // );
                // }}
              />
            </div>
          </div>
        </div>
      </section>
      {/*  */}
    </div>
  );
}

export default ManageReportsView;
