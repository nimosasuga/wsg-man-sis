import React from "react";
import { ProfitFlowPage } from "./Primary";

export default function Lcl({ rows = [] }) {
    return (
        <ProfitFlowPage
            rows={rows}
            config={{
                name: "Profit LCL",
                shortName: "LCL",
                detailBase: "/profit-unit/lcl/table",
                numberLabel: "No. STT",
                routeLabel: "Rute Pengiriman",
                showWeeklyFlow: true,
                filterFields: [
                    ["TAHUN", "Tahun"],
                    ["BULAN", "Bulan"],
                    ["AREA", "Area"],
                    ["NOPOL", "No. STT"],
                ],
            }}
        />
    );
}
