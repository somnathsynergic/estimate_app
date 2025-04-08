import React, { useEffect, useState } from "react";
import DatatableAdv from "../../../Components/DatatableAdv";
import { useNavigate } from "react-router-dom";
import { Message } from "../../../Components/Message";
import useAPI from "../../../Hooks/useApi";
import HeaderLayout from "../../../Components/HeaderLayout";
import axios from "axios";
import { url } from "../../../Address/baseURL";
import DynamicTailwindTable from "../../../Components/DynamicTailwindTable";
import { DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";

function ItemDetailsViewBranchwise() {
  const navigation = useNavigate();

  const [originalData, setOriginalData] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);
  const [called, setCalled] = useState(false);
  const { response, callApi } = useAPI();
  const [resp, setRestp] = useState();
  const [isReport, setIsReport] = useState(false);
  const [dataSet, setDataSet] = useState();
  const [search, setSearch] = useState();
  const [outlets, setOutlets] = useState(() => []);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  var comp;

  useEffect(() => {
    console.log(response);
    setDataSet(response?.data?.msg);

    if (response?.data?.msg?.length <= 0) {
      // Message("error", "No data!");
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
    axios
      .get(
        `${url}/admin/S_Admin/select_outlet?comp_id=${+localStorage.getItem(
          "comp_id"
        )}`
      )
      .then((res) => {
        setOutlets(res?.data?.msg);
        console.log(res);
      })
      .catch((err) => {
        Message("error", err);
      });
  }, []);

  useEffect(() => {
    setDataSet(
      response?.data?.msg?.filter((e) =>
        e.item_name.toLowerCase().includes(search?.toString().toLowerCase())
      )
    );
  }, [search]);

  useEffect(() => {
    if (!selectedOutlet) return; // Do nothing if null or undefined

    const comp = localStorage.getItem("comp_id");
    if (comp) {
      callApi("/admin/item_rate_list", 1, {
        comp_id: +comp,
        br_id: +selectedOutlet,
      });
    }
  }, [selectedOutlet]);

  // useEffect(() => {
  //   comp = localStorage.getItem("comp_id");
  //   callApi("/admin/item_list", 1, { comp_id: +comp, br_id: +selectedOutlet });
  // }, [selectedOutlet]);

  const onPress = (data) => {
    navigation(
      "/home/master/itemdetailsbranchwise/adddetailsbranchwise/" +
        data.id +
        "/" +
        selectedOutlet
    );
  };

  const deleteItems = async () => {
    const payload = selectedRows.map((item) => ({
      item_id: item.id,
    }));
    await axios
      .post(`${url}/admin/delete_prod_global`, {
        Items: payload,
        br_id: +selectedOutlet,
        // user: localStorage.getItem("user_id"),
      })
      .then((res) => {
        Message("success", "Deleted successfully.");
        console.log("DELETE=========", res);
        // location.reload();
      })
      .catch((err) => {
        console.log("---=+++++=====", err);
      });
  };

  return (
    <div className="py-1 w-full ">
      <HeaderLayout
        title={"Item Details"}
        btnText={"Add item"}
        onPress={() => onPress({ id: 0 })}
      />
      <section class="bg-gray-50 dark:bg-gray-900 p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div className="my-4 w-full">
            <label
              htmlFor="outlet"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Select Outlet
            </label>
            <select
              id="comp_id"
              name="comp_id"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              onChange={(e) => setSelectedOutlet(e.target.value)}
              // onBlur={() => null}
              value={selectedOutlet}>
              <option selected value={undefined}>
                Select outlet
              </option>

              {outlets?.map((items, i) => (
                <option key={i} value={items?.id}>
                  {items?.branch_name}
                </option>
              ))}
            </select>
            {called && !+localStorage.getItem("comp_id") ? (
              <div className="text-red-500 text-sm">Outlet is required</div>
            ) : null}
          </div>
        </div>
        {/* <div class="mx-auto w-full">
          <div class="bg-blue-900 dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <DatatableAdv
                disabled={!selectedOutlet}
                onPress={(data) => onPress(data)}
                setSearch={(val) => setSearch(val)}
                flag={1}
                title={"Item Details"}
                // btnText={"Add item"}
                // onclick={() => onPress({ id: 0 })}
                headers={[
                  { name: "id", value: "#" },
                  // { name: "hsn_code", value: "HSN Code" },
                  { name: "item_name", value: "Name" },
                ]}
                data={dataSet}
              />
            </div>
          </div>
        </div> */}

        <div className="mx-auto w-auto p-5">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-2xl text-blue-900 font-bold py-3">
              Item Details Shopwise
            </div>
            <div className="flex justify-end items-center p-4">
              <Popconfirm
                title="Delete product?"
                description={`Are you sure to delete this product? This action cannot be undone.`}
                icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                onConfirm={async () => {
                  setCalled(true);
                  await deleteItems();
                  setSelectedRows([]);
                }}>
                <button
                  type="button"
                  className="flex items-center text-white bg-red-900 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedRows.length}>
                  <DeleteOutlined className="mr-2" />
                  DELETE PRODUCT
                </button>
              </Popconfirm>
            </div>
          </div>
          <DynamicTailwindTable
            data={dataSet}
            headersMap={{ id: "#", item_name: "Name" }}
            colRemove={[1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]}
            pageSize={100}
            checkbox={true}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            searchable={true}
            search={search}
            setSearch={setSearch}
            onPress={(data) => onPress(data)}
          />
        </div>
      </section>
    </div>
  );
}

export default ItemDetailsViewBranchwise;
