import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { FilterMatchMode } from "primereact/api";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from "@mui/material/Tooltip";

const DatatableAdv = ({
  headers,
  data,
  flag,
  onPress,
  title,
  btnText,
  searchBy,
  onclick,
  setSearch,
  disabled = false,
  checkbox, // if true, shows checkboxes in the table
  // controlled selection for checkboxes from the parent
  selectedRows,
  setSelectedRows,
}) => {
  const dt = useRef(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // Template for the Icon column
  const iconTemplate = () => {
    return flag === 1 ? (
      <EditIcon className="text-blue-900" />
    ) : (
      <VisibilityIcon className="text-blue-900" />
    );
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // For single selection mode when checkbox is false, call this function
  const onRowSelect = (event) => {
    onPress(event.data);
  };

  // Handler for the header checkbox to toggle selection of all rows.
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all rows
      setSelectedRows(data ? [...data] : []);
    } else {
      // Unselect all rows
      setSelectedRows([]);
    }
  };

  return (
    <>
      {title && (
        <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
          <div className="w-full">
            <div className="flex items-center justify-evenly gap-2">
              <h2 className="text-xl font-bold bg-blue-900 text-nowrap text-white dark:text-white sm:block hidden">
                {title}
              </h2>
              <label htmlFor="simple-search" className="sr-only">
                Search
              </label>
              <div className="relative w-full mr-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="simple-search"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block sm:w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder={searchBy ? `Search by ${searchBy}` : "Search"}
                  required
                  onChange={(text) => setSearch(text.target.value)}
                />
              </div>
              {btnText && (
                <div className="w-full md:w-auto sm:block flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                  <Tooltip title={btnText}>
                    <button
                      type="button"
                      onClick={() => onclick()}
                      className="sm:block hidden items-center justify-center text-blue-900 bg-white hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">
                      <AddIcon /> {btnText}
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="card w-full">
          <DataTable
            value={data}
            showGridlines
            stripedRows
            stickyHeader
            scrollable
            paginator
            rows={10}
            rowsPerPageOptions={[4, 10, 25, 50, data?.length]}
            tableStyle={{ minWidth: "100%", fontSize: "14px" }}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            paginatorRight={
              <Button
                type="button"
                icon="pi pi-download"
                text
                onClick={() => {
                  import("xlsx").then((xlsx) => {
                    const worksheet = xlsx.utils.json_to_sheet(data);
                    const workbook = {
                      Sheets: { data: worksheet },
                      SheetNames: ["data"],
                    };
                    const excelBuffer = xlsx.write(workbook, {
                      bookType: "xlsx",
                      type: "array",
                    });
                    import("file-saver").then((module) => {
                      if (module && module.default) {
                        const EXCEL_TYPE =
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
                        const EXCEL_EXTENSION = ".xlsx";
                        const excelData = new Blob([excelBuffer], {
                          type: EXCEL_TYPE,
                        });
                        module.default.saveAs(
                          excelData,
                          "products_export_" +
                            new Date().getTime() +
                            EXCEL_EXTENSION
                        );
                      }
                    });
                  });
                }}
              />
            }
            // Use controlled selection via props when checkboxes are enabled, otherwise use single selection mode.
            selection={checkbox ? selectedRows : undefined}
            onSelectionChange={
              checkbox
                ? (e) => setSelectedRows(e.value)
                : !disabled
                ? (e) => onPress(e.data)
                : undefined
            }
            dataKey="id"
            onRowSelect={!disabled && !checkbox ? onRowSelect : undefined}
            metaKeySelection={!checkbox} // disable metaKeySelection for multiple selection
          >
            {/* Render the optional checkbox column when the checkbox prop is true */}
            {checkbox && (
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "2em", padding: 0 }}
                bodyStyle={{ padding: "0.5em" }}
                header={
                  <input
                    type="checkbox"
                    style={{ width: "1rem", height: "1rem" }}
                    checked={
                      data &&
                      selectedRows &&
                      data.length > 0 &&
                      selectedRows.length === data.length
                    }
                    onChange={toggleSelectAll}
                  />
                }
              />
            )}

            {headers.map((item, index) => (
              <Column
                key={index}
                field={item.name}
                header={item.value}
                headerClassName="text-blue-900 bg-blue-300"
                style={{ width: "10%" }}
              />
            ))}
            {/* Optional action column example - uncomment if needed */}
            {/* {flag === 1 && (
              <Column
                body={iconTemplate}
                header={"Action"}
                headerClassName="text-blue-900 bg-blue-300"
                style={{ width: "10%" }}
                frozen
              />
            )} */}
          </DataTable>
        </div>

        {/* Secondary DataTable (hidden in your original implementation) */}
        <div className="card hidden w-full shadow-2xl">
          <DataTable
            value={data}
            showGridlines
            stripedRows
            scrollable
            paginator
            rows={data?.length}
            rowsPerPageOptions={[3, 5, 10, 25, 50]}
            tableStyle={{ minWidth: "100%" }}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} to {last} of {totalRecords}"
            ref={dt}>
            {headers &&
              headers.map((item, index) => (
                <Column
                  key={index}
                  field={item.name}
                  header={item.name}
                  headerClassName="bg-blue-900 text-white"
                  style={{ width: "10%" }}
                />
              ))}
          </DataTable>
        </div>
      </div>
    </>
  );
};

export default DatatableAdv;
