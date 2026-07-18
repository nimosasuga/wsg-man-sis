import React from "react";
import { ProfitFlowPage } from "./Primary";

export default function Rental({ rows = [] }) {
    return (
        <ProfitFlowPage
            rows={rows}
            config={{
                name: "Profit Rental",
                shortName: "Rental",
                detailBase: "/profit-unit/rental/table",
                numberLabel: "Nopol",
                routeLabel: "Regional",
                filterFields: [
                    ["TAHUN", "Tahun"],
                    ["BULAN", "Bulan"],
                    ["AREA", "Area"],
                    ["TIPE", "Tipe Unit"],
                    ["NOPOL", "Nopol"],
                ],
            }}
        />
    );
}
