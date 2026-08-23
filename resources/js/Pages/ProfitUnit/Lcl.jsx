import React from "react";
import { ProfitFlowPage } from "./Primary";

export default function Lcl({ rows = [], filterOptions = {}, filters = {} }) {
    return (
        <ProfitFlowPage
            rows={rows}
            initialFilters={filters}
            filterOptions={filterOptions}
            config={{
                name: "Profit LCL",
                shortName: "LCL",
                filterRoute: "/profit-unit/lcl",
                serverSyncedFilters: ["TAHUN", "BULAN", "AREA", "DEPARTURE", "WEEK"],
                detailBase: "/profit-unit/lcl/table",
                numberLabel: "No. STT",
                routeLabel: "Rute Pengiriman",
                revenueLabel: "Sum Tarif",
                costLabel: "Sum Biaya",
                profitLabel: "Total Profit Akhir",
                summaryCards: [
                    { label: "Sum Biaya", key: "cost" },
                    { label: "Sum Tarif", key: "revenue" },
                    { label: "Sum Profit", key: "profit" },
                ],
                showWeeklyFlow: true,
                filterFields: [
                    ["TAHUN", "Tahun"],
                    ["BULAN", "Bulan"],
                    ["AREA", "Area"],
                    ["DEPARTURE", "Keberangkatan Kapal"],
                    ["WEEK", "Minggu"],
                ],
            }}
        />
    );
}
