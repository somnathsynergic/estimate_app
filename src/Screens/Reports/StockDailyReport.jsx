import React from "react";
import { reportHeaders } from "../../Assets/Data/TemplateConstants";
import { useLocation } from "react-router-dom";
import ReportTemplate from "./ReportTemplate";

function StockDailyReport() {
  const locationpath = useLocation();
  var template =
    locationpath.pathname.split("/")[
    locationpath.pathname.split("/").length - 1
    ];
  var templateData = reportHeaders[template] || {
    title: "Stock Daily Summary",
    headers: [
      { name: "item_name", value: "Item" },
      { name: "opening_packet", value: "Opening" },
      { name: "issued_packet", value: "Issued" },
      { name: "billed_packet", value: "Billed" },
      { name: "returned_packet", value: "Returned" },
      { name: "closing_packet", value: "Closing" },
    ],
    span: 0,
  };
  return (
    <ReportTemplate
      templateData={templateData}
      template={template}
      _url={"/admin/stock/daily-summary"}
      flag={888}
    />
  );
}

export default StockDailyReport;
