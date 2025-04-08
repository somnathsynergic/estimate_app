import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Message } from "../../../Components/Message";
import useAPI from "../../../Hooks/useApi";
import HeaderLayout from "../../../Components/HeaderLayout";
import DynamicTailwindTable from "../../../Components/DynamicTailwindTable";
import { DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Popconfirm } from "antd";
import axios from "axios";
import { url } from "../../../Address/baseURL";
import {
  AddOutlined,
  PlusOneOutlined,
  DeleteForeverOutlined,
} from "@mui/icons-material";

function ItemDetailsView() {
  const navigation = useNavigate();
  const [called, setCalled] = useState(false);
  const { response, callApi } = useAPI();
  const location = window.location;

  const [originalData, setOriginalData] = useState([]);
  const [dataSet, setDataSet] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);

  const [isReport, setIsReport] = useState(false);

  useEffect(() => {
    console.log(response);
    const msg = response?.data?.msg || [];
    setOriginalData(msg);
    setDataSet(msg);

    if (msg.length <= 0) {
      // Message("error", "No data!");
      setIsReport(false);
    } else {
      if (called) {
        setOriginalData(msg);
        setDataSet(msg);
        setIsReport(true);
        setCalled(false);
      }
    }
  }, [response]);

  useEffect(() => {
    if (originalData && originalData.length > 0) {
      setDataSet(
        originalData.filter((e) =>
          e.item_name.toLowerCase().includes(search.toString().toLowerCase())
        )
      );
    }
  }, [search, originalData]);

  useEffect(() => {
    const comp = localStorage.getItem("comp_id");
    callApi("/admin/item_rate_list", 1, { comp_id: +comp, br_id: 0 });
  }, []);

  // useEffect(() => {
  //   const comp = localStorage.getItem("comp_id");
  //   callApi("/admin/item_list", 1, { comp_id: +comp });
  // }, []);

  const onPress = (data) => {
    navigation("/home/master/itemdetails/adddetails/" + data.id);
  };

  console.log("SELECTED ROWS", selectedRows);

  const deleteItems = async () => {
    const payload = selectedRows.map((item) => ({
      item_id: item.id,
    }));

    await axios
      .post(`${url}/admin/delete_prod_global`, {
        Items: payload,
        br_id: 0,
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
    <div className="py-1 w-full">
      <HeaderLayout
        title={"Item Details"}
        btnText={"Add item"}
        onPress={() => onPress({ id: 0 })}
      />
      <section className="bg-gray-50 dark:bg-gray-900 p-3">
        <div className="mx-auto w-auto p-5">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-2xl text-blue-900 font-bold py-3">
              Item Details
            </div>
            <div className="flex justify-end items-center align-middle p-4">
              <button
                type="button"
                className="flex items-center text-white bg-blue-900 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPress({ id: 0 })}>
                <AddOutlined className="mr-2" />
                ADD PRODUCT
              </button>
              <Popconfirm
                title="Delete products?"
                description={`Are you sure to delete these? This action cannot be undone.`}
                icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                onConfirm={async () => {
                  setCalled(true);
                  deleteItems();
                  setSelectedRows([]);
                }}>
                <button
                  type="button"
                  className="flex items-center text-white bg-red-900 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedRows.length}>
                  <DeleteForeverOutlined className="mr-2" />
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

export default ItemDetailsView;
