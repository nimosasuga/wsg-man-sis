import React from "react";
import { ProfitFlowPage } from "./Primary";

export default function Secondary({ rows = [] }) {
    return (
        <ProfitFlowPage
            rows={rows}
            config={{
                name: "Profit Secondary",
                shortName: "Secondary",
                detailBase: "/profit-unit/secondary/table",
                numberLabel: "Nopol",
                routeLabel: "Kategori / Order",
                revenueLabel: "Total Tarif Penagihan Secondary",
                costLabel: "Total Biaya Operasional Secondary",
                profitLabel: "Total Profit Secondary",
                showWeeklyFlow: true,
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
