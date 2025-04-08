import React from "react";
import { Pagination } from "antd";

const DynamicTailwindTable = ({
  data = [],
  headerBgColor = "bg-blue-900",
  pageSize = 50,
  columnTotal = [],
  colRemove = [],
  headersMap = null,
  dateTimeExceptionCols = [],
  checkbox = false,
  selectedRows = [],
  setSelectedRows = () => {},
  searchable = false,
  search = "",
  setSearch = () => {},
  onPress = () => {},
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const originalHeaders = data && data.length > 0 ? Object.keys(data[0]) : [];

  const filteredHeadersWithIndex = originalHeaders
    .map((header, index) => ({ header, index }))
    .filter((item) => !colRemove.includes(item.index));

  const totals = {};
  columnTotal.forEach((origIndex) => {
    if (origIndex >= 0 && origIndex < originalHeaders.length) {
      const headerKey = originalHeaders[origIndex];
      totals[origIndex] = data.reduce((acc, row) => {
        const value = parseFloat(row[headerKey]);
        return !isNaN(value) ? acc + value : acc;
      }, 0);
    }
  });

  const currentData =
    data && data.length > 0
      ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatCellValue = (value, colIndex) => {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (typeof value === "string" && isoRegex.test(value)) {
      if (dateTimeExceptionCols.includes(colIndex)) {
        return new Date(value).toLocaleDateString("en-GB");
      }
      return new Date(value).toLocaleString("en-GB");
    }
    return value;
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows([...data]);
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRowSelection = (e, row) => {
    e.stopPropagation();
    const isChecked = e.target.checked;
    if (isChecked) {
      setSelectedRows([...selectedRows, row]);
    } else {
      setSelectedRows(selectedRows.filter((r) => r.id !== row.id));
    }
  };

  const totalColumns = checkbox
    ? filteredHeadersWithIndex.length + 1
    : filteredHeadersWithIndex.length;

  return (
    <>
      {searchable && (
        <div className="flex justify-start items-center">
          <input
            type="text"
            placeholder="Search"
            className="border border-gray-300 rounded-lg p-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div
        className="relative overflow-auto shadow-md sm:rounded-lg mt-5 max-h-[600px]
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-transparent
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead
            className={`text-xs uppercase text-slate-50 sticky top-0 ${headerBgColor}`}>
            <tr>
              {checkbox && (
                <th className="px-4 py-3" style={{ width: "2em" }}>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-md border border-gray-300 cursor-pointer"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )}
              {filteredHeadersWithIndex.map((item, i) => (
                <th key={i} className="px-6 py-3 font-semibold">
                  {headersMap
                    ? headersMap[item.header] || item.header
                    : item.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-6 py-3 text-center text-gray-500">
                  No matching records found
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    rowIndex % 2 === 0 ? "bg-blue-50 text-slate-900" : ""
                  } hover:cursor-pointer hover:opacity-65`}
                  onClick={() => onPress(row)}>
                  {checkbox && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-md border border-gray-300 cursor-pointer"
                        checked={!!selectedRows.find((r) => r.id === row.id)}
                        onChange={(e) => toggleRowSelection(e, row)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {filteredHeadersWithIndex.map((item, colIndex) => (
                    <td key={colIndex} className="px-6 py-3">
                      {row[item.header] !== undefined
                        ? formatCellValue(row[item.header], item.index)
                        : "---"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="sticky bottom-0">
            <tr className="text-slate-50 bg-blue-900">
              {checkbox && <td className="px-4 py-3">Total</td>}
              {filteredHeadersWithIndex.map((item, i) => (
                <td key={i} className="px-6 py-3">
                  {i === 0 && !checkbox
                    ? "Total"
                    : columnTotal.includes(item.index) &&
                      totals[item.index] !== undefined
                    ? totals[item.index].toFixed(2)
                    : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-end my-4">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={data.length}
          onChange={handlePageChange}
          showSizeChanger={false}
        />
      </div>
    </>
  );
};

export default DynamicTailwindTable;
