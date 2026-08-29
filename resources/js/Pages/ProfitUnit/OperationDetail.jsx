import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock, User, MapPin, Route, Truck, Box, DollarSign, Hash, FileText, Fuel, BedDouble, Activity, ClipboardList } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

function InfoItem({ label, value, highlight }) {
    const displayValue = value === null || value === undefined || value === "" ? "-" : value;

    return (
        <div className={`rounded-lg border ${highlight ? 'border-cyan-200 bg-cyan-50' : 'border-slate-100 bg-slate-50'} px-4 py-3`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 break-words text-sm font-black ${highlight ? 'text-cyan-800' : 'text-slate-900'}`}>{displayValue}</p>
        </div>
    );
}

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                {Icon && <Icon size={16} className="text-cyan-700" />}
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </div>
    );
}

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");
const hasValue = (value) => value !== null && value !== undefined && value !== "";
const formatOptional = (value, formatter) => hasValue(value) ? formatter(value) : "-";

function PrimarySection({ title, icon: Icon, children, fullWidth = false }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Icon size={16} className="text-cyan-700" />
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className={fullWidth ? "p-5" : "grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3"}>{children}</div>
        </section>
    );
}

const formatDate = (value) => {
    if (!value) return "-";
    const text = String(value).trim();
    const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})|^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (!match) return text;
    const [, year, month, day, legacyDay, legacyMonth, legacyYear] = match;
    const dd = String(day || legacyDay).padStart(2, "0");
    const mm = String(month || legacyMonth).padStart(2, "0");
    const yyyy = String(year || legacyYear);
    return `${dd}/${mm}/${yyyy}`;
};

const primaryMoneyFields = [
    ["Tarif Vendor", "tarif_vendor"], ["Biaya Buruh Muat", "biaya_buruh_muat"], ["Biaya Buruh Bongkar", "biaya_buruh_bongkar"],
    ["Biaya Dooring", "biaya_dooring"], ["Biaya Kapal", "biaya_kapal"], ["Biaya BBM", "biaya_bbm"],
    ["Biaya Transport", "biaya_transport"], ["Biaya Lain-lain", "biaya_lain_lain"], ["Total Biaya", "total_biaya"],
];

function RelatedBapTable({ rows = [] }) {
    const columns = [
        ["KEY PRIMARY INPUT", "key_primary_input"], ["NO. BAP", "no_bap"], ["RUTE ASAL", "rute_asal"], ["RUTE TUJUAN", "rute_tujuan"],
        ["TANGGAL MUAT", "tanggal_muat", formatDate], ["TANGGAL BERANGKAT", "tanggal_berangkat", formatDate], ["TANGGAL TIBA", "tanggal_tiba", formatDate],
        ["JENIS", "jenis"], ["TOTAL QTY MUATAN", "total_qty_muatan", formatNum], ["NOPOL", "nopol"], ["NO. SI", "no_si"], ["NO. PO", "no_po"],
        ["NAMA TOKO", "nama_toko"], ["QTY BARANG", "qty_barang", formatNum], ["TOTAL TARIF", "total_tarif", formatRp], ["TAGIHAN", "tagihan", formatRp],
        ["PPN", "ppn", formatRp], ["TOTAL INVOICE", "total_invoice", formatRp], ["HARGA / QTY", "harga_per_qty", formatRp],
        ["TOTAL BIAYA BARANG", "total_biaya_barang", formatRp], ["JMLH INVOICE", "jumlah_invoice", formatRp], ["AREA", "area"], ["WEEK", "week"], ["QTY UNIT", "qty_unit", formatNum],
    ];
    const cellClass = (index, header = false) => [
        "border-b border-slate-100 px-3 py-3 align-top font-semibold text-slate-700",
        header ? "bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500" : "bg-white text-xs",
        index < 2 ? "sticky z-20 shadow-[8px_0_12px_-12px_rgba(15,23,42,0.45)]" : "",
        index === 0 ? "left-0 min-w-[150px]" : "",
        index === 1 ? "left-[150px] min-w-[150px]" : "",
        index >= 14 && index <= 20 ? "whitespace-nowrap tabular-nums" : "",
        [2, 3, 12, 21].includes(index) ? "min-w-[180px] whitespace-normal break-words" : "whitespace-nowrap",
    ].filter(Boolean).join(" ");
    return <PrimarySection title="Related DATA BAP" icon={FileText} fullWidth>
        {rows.length === 0 ? <p className="text-sm font-semibold text-slate-500">Belum ada DATA BAP yang terhubung dengan Primary ini.</p> : <div className="max-w-full overflow-x-auto"><table className="min-w-[3000px] border-collapse text-left"><thead className="sticky top-0 z-30"><tr>{columns.map(([label], index) => <th key={label} className={cellClass(index, true)}>{label}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={row.id_key || rowIndex} className="hover:bg-cyan-50/40">{columns.map(([label, key, formatter], index) => <td key={label} className={cellClass(index)}>{formatter ? formatOptional(row[key], formatter) : (hasValue(row[key]) ? row[key] : "-")}</td>)}</tr>)}</tbody></table></div>}
    </PrimarySection>;
}

function PrimaryDetail({ detail, relatedBaps = {}, backUrl }) {
    return <>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5"><div className="flex min-w-0 items-center gap-3"><Link href={backUrl || "/profit-unit/primary/table"} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"><ArrowLeft size={19} /></Link><div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Profit Unit</p><h1 className="truncate text-xl font-black uppercase text-slate-950">Detail Profit Primary</h1></div></div></section>
        <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200"><div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]"><div className="min-w-0"><div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200"><Truck size={15} /> PRIMARY</div><h2 className="mt-4 break-words text-3xl font-black">{detail.nopol || "-"}</h2><p className="mt-2 break-words text-sm font-semibold text-slate-300">{detail.jenis || "-"} di area {detail.area || "-"}.</p></div><div className="rounded-lg border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-300">Profit</p><p className="mt-2 whitespace-nowrap text-lg font-black">{formatOptional(detail.profit, formatRp)}</p></div><div className="rounded-lg border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-300">Week</p><p className="mt-2 text-lg font-black">{detail.week || "-"}</p></div></div></section>
        <PrimarySection title="NO. SI & PO" icon={FileText}>{[["NO. BAP", "no_bap"], ["NO. PO", "no_po"], ["NO. SI", "no_si"], ["NO. SJ", "no_sj"], ["Vendor", "vendor"]].map(([label, key]) => <InfoItem key={key} label={label} value={detail[key]} />)}</PrimarySection>
        <PrimarySection title="TANGGAL PELAKSANAAN" icon={Clock}>{[["Tanggal Muat", "tanggal_muat"], ["Tanggal Terima", "tanggal_terima"], ["Week", "week"]].map(([label, key]) => <InfoItem key={key} label={label} value={key.includes("tanggal") ? formatDate(detail[key]) : detail[key]} />)}</PrimarySection>
        <PrimarySection title="RUTE PERJALANAN" icon={MapPin}>{[["Area", "area"], ["Nopol / Driver", "nopol_driver"], ["Rute Asal", "rute_asal"], ["Rute Tujuan", "rute_tujuan"]].map(([label, key]) => <InfoItem key={key} label={label} value={detail[key]} />)}</PrimarySection>
        <PrimarySection title="ORDERAN" icon={Box}>{[["Jenis", "jenis"], ["QTY", "qty", formatNum], ["Total", "total", formatNum], ["Tarif", "tarif", formatRp], ["Total Tarif", "total_tarif", formatRp]].map(([label, key, formatter]) => <InfoItem key={key} label={label} value={formatter ? formatOptional(detail[key], formatter) : detail[key]} />)}</PrimarySection>
        <PrimarySection title="BIAYA-BIAYA" icon={DollarSign}>{[...primaryMoneyFields, ["Productivity", "productivity", formatRp], ["Profit", "profit", formatRp, true]].map(([label, key, formatter, highlight]) => <InfoItem key={key} label={label} value={formatter ? formatOptional(detail[key], formatter) : detail[key]} highlight={highlight} />)}</PrimarySection>
        <PrimarySection title="Keterangan" icon={FileText} fullWidth><p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">{detail.keterangan || "-"}</p></PrimarySection>
        <PrimarySection title="Aktivitas" icon={User}>{[["ID Key", "id_key"], ["Dibuat Oleh", "creator"], ["Create Data", "create_data"], ["Status Dokumen", "status_dokument"], ["Tanggal Dokumen Naik", "tanggal_dokument_naik"], ["Editor", "editor"], ["Edit Time", "edit_time"]].map(([label, key]) => <InfoItem key={key} label={label} value={key.includes("tanggal") || key === "edit_time" ? formatDate(detail[key]) : detail[key]} />)}</PrimarySection>
        <RelatedBapTable rows={relatedBaps} />
    </>;
}

function SecondaryDetail({ detail = {}, dailySummary = {}, backUrl }) {
    const money = (key) => formatOptional(detail[key], formatRp);
    const num = (key) => formatOptional(detail[key], formatNum);
    const date = (key) => formatOptional(detail[key], formatDate);
    const txt = (key) => hasValue(detail[key]) ? detail[key] : "-";
    const profit = Number(detail.profit || 0);
    const profitTone = profit >= 0
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-red-200 bg-red-50 text-red-700";

    const Kpi = ({ label, value, tone }) => (
        <div className={`rounded-xl border p-4 shadow-sm ${tone}`}>
            <p className="text-[11px] font-black uppercase tracking-wide opacity-70">{label}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-black tabular-nums">{value}</p>
        </div>
    );

    const ClaimRow = ({ label, value }) => (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2 last:border-0">
            <span className="text-xs font-semibold text-slate-500">{label}</span>
            <span className="whitespace-nowrap text-sm font-black tabular-nums text-slate-800">{value}</span>
        </div>
    );

    return <>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
            <div className="flex min-w-0 items-center gap-3">
                <Link href={backUrl || "/profit-unit/secondary/table"} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"><ArrowLeft size={19} /></Link>
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Profit Unit</p>
                    <h1 className="truncate text-xl font-black uppercase text-slate-950">Secondary Trip Detail</h1>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">No SI: {txt("no_si")}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">No PO: {txt("no_po")}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">Area: {txt("area")}</span>
                <span className={`rounded-md px-2 py-1 ${detail.status_doc_fat === "DITERIMA FAT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>Status Dokumen: {txt("status_doc_fat")}</span>
            </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Kpi label="TAGIHAN" value={money("tagihan")} tone="border-slate-200 bg-white text-blue-700" />
            <Kpi label="BIAYA OPERASIONAL" value={money("total_biaya_operasional")} tone="border-slate-200 bg-white text-amber-700" />
            <Kpi label="PROFIT TRIP" value={money("profit")} tone={profitTone} />
            <Kpi label="TOTAL KLAIM" value={money("total_klaim")} tone="border-slate-200 bg-white text-slate-700" />
            <Kpi label="TOTAL NO KLAIM" value={money("total_no_klaim")} tone="border-slate-200 bg-white text-slate-700" />
        </section>

        <PrimarySection title="Identitas Record" icon={ClipboardList}>
            <InfoItem label="ID Record" value={txt("id_record")} />
            <InfoItem label="ID Key" value={txt("id_key")} />
            <InfoItem label="No PO" value={txt("no_po")} />
            <InfoItem label="No SI" value={txt("no_si")} />
            <InfoItem label="Tanggal" value={date("tanggal")} />
            <InfoItem label="Hari" value={txt("hari")} />
            <InfoItem label="Bulan" value={txt("bulan")} />
            <InfoItem label="Tahun" value={txt("tahun")} />
            <InfoItem label="Week" value={txt("week")} />
            <InfoItem label="Area" value={txt("area")} />
            <InfoItem label="Order Type" value={txt("order_type")} />
            <InfoItem label="Status" value={txt("status")} />
            <InfoItem label="Status Doc FAT" value={txt("status_doc_fat")} />
        </PrimarySection>

        <PrimarySection title="Daily Summary" icon={Activity}>
            <InfoItem label="Date By Road" value={formatOptional(dailySummary.date_by_road, formatDate)} />
            <InfoItem label="Total Tarif Berjalan" value={formatOptional(dailySummary.total_tarif_berjalan, formatRp)} />
            <InfoItem label="Total Biaya Operational" value={formatOptional(dailySummary.total_biaya_operational, formatRp)} />
            <InfoItem label="Total Profit Hari Ini" value={formatOptional(dailySummary.total_profit_hari_ini, formatRp)} />
            <InfoItem label="Total Unit Jalan Hari Ini" value={formatOptional(dailySummary.total_unit_jalan_hari_ini, formatNum)} />
        </PrimarySection>

        <PrimarySection title="Waktu Operasional" icon={Clock}>
            <InfoItem label="Jam Mulai" value={txt("jam_mulai")} />
            <InfoItem label="Jam Selesai" value={txt("jam_selesai")} />
            <InfoItem label="Total Jam" value={txt("total_jam")} />
            <InfoItem label="Lama Cek Data" value={txt("lama_cek_data")} />
            <InfoItem label="Crosscek Date" value={date("crosscek_date")} />
            <InfoItem label="Admin Cross Cek" value={txt("admin_cross_cek")} />
        </PrimarySection>

        <PrimarySection title="Armada & Crew" icon={Truck}>
            <InfoItem label="Nopol" value={txt("nopol")} />
            <InfoItem label="Tipe Unit" value={txt("tipe_unit")} />
            <InfoItem label="Driver" value={txt("driver")} />
            <InfoItem label="Helper" value={txt("helper")} />
            <InfoItem label="Qty" value={num("qty")} />
        </PrimarySection>

        <PrimarySection title="Jarak & Kilometer" icon={Route}>
            <InfoItem label="KM Awal" value={num("km_awal")} />
            <InfoItem label="KM Akhir" value={num("km_akhir")} />
            <InfoItem label="Total KM" value={num("total_km")} />
            <InfoItem label="Odo Isi BBM" value={num("odo_isi_bbm")} />
            <InfoItem label="Selisih BBM" value={num("selisih_bbm")} />
        </PrimarySection>

        <PrimarySection title="Tarif / Tagihan Components" icon={DollarSign}>
            <InfoItem label="Total Tarif" value={money("total_tarif")} />
            <InfoItem label="Tarif Unit" value={money("tarif_unit")} />
            <InfoItem label="Add Cost Long Route" value={money("add_cost_long_route")} />
            <InfoItem label="TKBM" value={money("tkbm")} />
            <InfoItem label="SPSI" value={money("spsi")} />
            <InfoItem label="Parkir Liar & Keamanan" value={money("parkir_liar_keamanan")} />
            <InfoItem label="Penyeberangan Pas Masuk" value={money("penyebrangan_pas_masuk")} />
            <InfoItem label="Rapid Antigen" value={money("rapid_antigen")} />
            <InfoItem label="Allowance" value={money("allowance")} />
            <InfoItem label="Total Subsidi BBM" value={money("total_subsidi_bbm")} />
            <InfoItem label="Subsidi Hotel" value={money("subsidi_hotel")} />
            <InfoItem label="Nilai OVT Absensi" value={money("nilai_ovt")} />
            <InfoItem label="TAGIHAN" value={money("tagihan")} highlight />
        </PrimarySection>

        <PrimarySection title="Biaya Operasional" icon={DollarSign}>
            <InfoItem label="Total Biaya Operasional" value={money("total_biaya_operasional")} />
            <InfoItem label="BBM" value={money("bbm")} />
            <InfoItem label="Nominal Pengisian BBM" value={money("nominal_pengisian_bbm")} />
            <InfoItem label="Biaya Tagihan Hotel" value={money("biaya_tagihan_hotel")} />
            <InfoItem label="Parkir Resmi" value={money("parkir_resmi")} />
            <InfoItem label="Tol" value={money("tol")} />
            <InfoItem label="Kirim Dokumen" value={money("kirim_dokumen")} />
            <InfoItem label="Tarif GS" value={money("tarif_gs")} />
            <InfoItem label="ATK" value={money("atk")} />
            <InfoItem label="Biaya Lainnya" value={money("biaya_lainnya")} />
            <InfoItem label="Tarif Sewa Unit Vendor" value={money("tarif_sewa_unit_vendor")} />
            <InfoItem label="Total Non Klaim BBM" value={money("total_non_klaim_bbm")} />
        </PrimarySection>

        <PrimarySection title="BBM Detail" icon={Fuel}>
            <InfoItem label="BBM" value={money("bbm")} />
            <InfoItem label="Nominal Pengisian BBM" value={money("nominal_pengisian_bbm")} />
            <InfoItem label="Jenis BBM" value={txt("jenis_bbm")} />
            <InfoItem label="Harga / Liter" value={money("harga_perliter")} />
            <InfoItem label="Jumlah Liter" value={num("jumlah_liter")} />
            <InfoItem label="Odo Isi BBM" value={num("odo_isi_bbm")} />
            <InfoItem label="Selisih BBM" value={num("selisih_bbm")} />
            <InfoItem label="Non Claim BBM" value={money("non_claim_bbm")} />
            <InfoItem label="Subsidi BBM" value={money("subsidi_bbm")} />
            <InfoItem label="Subsidi BBM 2" value={money("subsidi_bbm_2")} />
            <InfoItem label="Tambah BBM" value={money("tambah_bbm")} />
            <InfoItem label="BBM 2" value={money("bbm_2")} />
            <InfoItem label="Total Subsidi BBM" value={money("total_subsidi_bbm")} />
        </PrimarySection>

        <PrimarySection title="Hotel Detail" icon={BedDouble}>
            <InfoItem label="Biaya Tagihan Hotel" value={money("biaya_tagihan_hotel")} />
            <InfoItem label="Tarif Hotel" value={money("tarif_hotel")} />
            <InfoItem label="Subsidi Hotel" value={money("subsidi_hotel")} />
            <InfoItem label="Selisih Tagihan Hotel" value={money("selisih_tagihan_hotel")} />
            <p className="col-span-full mt-1 rounded-lg bg-amber-50 px-4 py-3 text-xs font-semibold leading-6 text-amber-900">
                Klaim hotel dibatasi maksimal Rp300.000 (sesuai formula TOTAL KLAIM). Jika selisih tagihan hotel &lt; 0, selisih masuk TOTAL NO KLAIM.
            </p>
        </PrimarySection>

        <PrimarySection title="Overtime / Absensi" icon={User}>
            <InfoItem label="Total Jam OVT Driver" value={num("ovt_jam_driver")} />
            <InfoItem label="Total Jam OVT Helper" value={num("ovt_jam_helper")} />
            <InfoItem label="Claim Total OVT" value={num("claim_total_ovt")} />
            <InfoItem label="Nilai OVT Absensi" value={money("nilai_ovt")} />
        </PrimarySection>

        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <p className="bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-slate-600">Total Claim</p>
                <ClaimRow label="TKBM" value={money("tkbm")} />
                <ClaimRow label="SPSI" value={money("spsi")} />
                <ClaimRow label="Parkir Liar & Keamanan" value={money("parkir_liar_keamanan")} />
                <ClaimRow label="Penyeberangan Pas Masuk" value={money("penyebrangan_pas_masuk")} />
                <ClaimRow label="Rapid Antigen" value={money("rapid_antigen")} />
                <ClaimRow label="Allowance" value={money("allowance")} />
                <ClaimRow label="Hotel Claim (cap 300rb)" value={detail.biaya_tagihan_hotel > 300000 ? formatRp(300000) : money("biaya_tagihan_hotel")} />
                <ClaimRow label="Total Subsidi BBM" value={money("total_subsidi_bbm")} />
                <div className="flex items-center justify-between gap-3 border-t-2 border-slate-200 bg-slate-50 px-4 py-2"><span className="text-xs font-black uppercase text-slate-700">Total</span><span className="whitespace-nowrap text-sm font-black tabular-nums text-slate-900">{money("total_klaim")}</span></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <p className="bg-slate-50 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-slate-600">Total No Claim</p>
                <ClaimRow label="Parkir Resmi" value={money("parkir_resmi")} />
                <ClaimRow label="Tol" value={money("tol")} />
                <ClaimRow label="Kirim Dokumen" value={money("kirim_dokumen")} />
                <ClaimRow label="Tarif GS" value={money("tarif_gs")} />
                <ClaimRow label="ATK" value={money("atk")} />
                <ClaimRow label="Biaya Lainnya" value={money("biaya_lainnya")} />
                <ClaimRow label="Tarif Sewa Unit Vendor" value={money("tarif_sewa_unit_vendor")} />
                <ClaimRow label="Selisih Hotel Negatif" value={detail.selisih_tagihan_hotel < 0 ? money("selisih_tagihan_hotel") : "-"} />
                <ClaimRow label="Total Non Klaim BBM" value={money("total_non_klaim_bbm")} />
                <div className="flex items-center justify-between gap-3 border-t-2 border-slate-200 bg-slate-50 px-4 py-2"><span className="text-xs font-black uppercase text-slate-700">Total</span><span className="whitespace-nowrap text-sm font-black tabular-nums text-slate-900">{money("total_no_klaim")}</span></div>
            </div>
        </section>

        <PrimarySection title="Dokumen, FAT, Admin, Logging" icon={FileText}>
            <InfoItem label="Status Dokument" value={txt("status_dokument")} />
            <InfoItem label="Status Doc FAT" value={txt("status_doc_fat")} />
            <InfoItem label="Edit Time" value={date("edit_time")} />
            <InfoItem label="Editor" value={txt("editor")} />
            <InfoItem label="Admin Cross Cek" value={txt("admin_cross_cek")} />
            <InfoItem label="Crosscek Date" value={date("crosscek_date")} />
            <InfoItem label="Lama Cek Data" value={txt("lama_cek_data")} />
        </PrimarySection>

        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-950"><ClipboardList size={16} className="text-cyan-700" /> Data Mentah / Advanced</summary>
            <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-3">
                <InfoItem label="Row Data" value={txt("row_data")} />
                {Object.keys(detail).filter((k) => !["tagihan", "profit", "total_klaim", "total_no_klaim", "nilai_ovt", "status_doc_fat", "lama_cek_data", "ovt_jam_driver", "ovt_jam_helper", "claim_total_ovt", "editor", "edit_time", "total_biaya_operasional"].includes(k)).map((k) => <InfoItem key={k} label={k} value={txt(k)} />)}
            </div>
        </details>
    </>;
}

function LegacyOperationDetail({ title, type, detail = {}, backUrl }) {
    return (
        <AdminLayout>
            <Head title={`${title} - ${detail.nopol || detail.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={backUrl || `/profit-unit/${type}/table`}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Profit Unit</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">{title}</h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <Truck size={15} />
                                PRIMARY
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{detail.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {detail.jenis || "-"} di area {detail.area || "-"}.
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <DollarSign size={15} />
                                Profit
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(detail.profit)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Hash size={15} />
                                Week
                            </div>
                            <p className="mt-2 text-lg font-black">{detail.week || "-"}</p>
                        </div>
                    </div>
                </section>

                <SectionCard icon={FileText} title="Informasi Record">
                    <InfoItem label="ID KEY" value={detail.id_key} />
                    <InfoItem label="HARI" value={detail.hari} />
                    <InfoItem label="CREATE" value={detail.create} />
                    <InfoItem label="BULAN" value={detail.bulan} />
                    <InfoItem label="TAHUN" value={detail.tahun} />
                    <InfoItem label="WEEK" value={detail.week} />
                    <InfoItem label="CROSSCEK DATE" value={detail.crosscek_date} />
                    <InfoItem label="ADD DATA" value={detail.add_data} />
                    {type !== "secondary" && (
                        <>
                            <InfoItem label="TANGGAL" value={detail.tanggal} />
                            <InfoItem label="TANGGAL MUAT" value={detail.tanggal_muat} />
                            <InfoItem label="TANGGAL TERIMA" value={detail.tanggal_terima} />
                        </>
                    )}
                </SectionCard>

                <SectionCard icon={MapPin} title="Lokasi & Rute">
                    {type === "secondary" ? (
                        <>
                            <InfoItem label="REGION" value={detail.region} />
                            <InfoItem label="AREA" value={detail.area} />
                            <InfoItem label="TIPE UNIT" value={detail.tipe} />
                            <InfoItem label="PROJECT" value={detail.project} />
                            <InfoItem label="POSISI PROJECT" value={detail.posisi_project} />
                            <InfoItem label="RUTE" value={detail.rute} />
                            <InfoItem label="ASSET" value={detail.asset} />
                            <InfoItem label="KETERANGAN" value={detail.keterangan} />
                        </>
                    ) : (
                        <>
                            <InfoItem label="REGIONAL" value={detail.regional} />
                            <InfoItem label="AREA" value={detail.area} />
                            <InfoItem label="TIPE UNIT" value={detail.tipe} />
                            <InfoItem label="PROJECT" value={detail.project} />
                            <InfoItem label="POSISI PROJECT" value={detail.posisi_project} />
                            <InfoItem label="RUTE ASAL" value={detail.rute_asal} />
                            <InfoItem label="RUTE TUJUAN" value={detail.rute_tujuan} />
                        </>
                    )}
                </SectionCard>

                <SectionCard icon={Box} title="Muatan & Dokumen">
                    <InfoItem label="NOPOL & DRIVER" value={detail.nopol} />
                    {type === "secondary" && <InfoItem label="DRIVER" value={detail.driver} />}
                    {type === "secondary" && <InfoItem label="HELPER" value={detail.helper} />}
                    <InfoItem label="VENDOR" value={detail.vendor} />
                    <InfoItem label="QTY" value={formatNum(detail.qty)} />
                    <InfoItem label="JENIS" value={detail.jenis} />
                    <InfoItem label="NO. PO" value={detail.no_po} />
                    <InfoItem label="NO. SI" value={detail.no_si} />
                    <InfoItem label="NO. SJ" value={detail.no_sj} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Keuangan">
                    {type === "secondary" ? (
                        <>
                            <InfoItem label="TARIF UNIT" value={formatRp(detail.tarif_unit)} />
                            <InfoItem label="TAGIHAN" value={formatRp(detail.tagihan)} />
                            <InfoItem label="TOTAL BIAYA OPERASIONAL" value={formatRp(detail.total_biaya_operasional)} />
                            <InfoItem label="PROFIT TRIP" value={formatRp(detail.profit)} highlight />
                        </>
                    ) : (
                        <>
                            <InfoItem label="TOTAL" value={formatRp(detail.total)} />
                            <InfoItem label="TARIF" value={formatRp(detail.tarif)} />
                            <InfoItem label="TOTAL TARIF" value={formatRp(detail.total_tarif)} />
                            <InfoItem label="TOTAL BIAYA" value={formatRp(detail.total_biaya)} />
                            <InfoItem label="PROFIT TRIP" value={formatRp(detail.profit)} highlight />
                        </>
                    )}
                </SectionCard>

                <SectionCard icon={User} title="Aktivitas">
                    <InfoItem label="EDITOR" value={detail.editor} />
                    <InfoItem label="EDIT TIME" value={detail.edit_time} />
                </SectionCard>
            </div>
        </AdminLayout>
    );
}

export default function OperationDetail({ title, type, detail = {}, backUrl, relatedBaps = [], dailySummary = {} }) {
    if (type === "primary") {
        return <AdminLayout><Head title={`${title} - ${detail.nopol || detail.id_key || ""}`} /><div className="space-y-5"><PrimaryDetail detail={detail} relatedBaps={relatedBaps} backUrl={backUrl} /></div></AdminLayout>;
    }

    if (type === "secondary") {
        return <AdminLayout><Head title={`${title} - ${detail.nopol || detail.id_key || ""}`} /><div className="space-y-5"><SecondaryDetail detail={detail} dailySummary={dailySummary} backUrl={backUrl} /></div></AdminLayout>;
    }

    return <LegacyOperationDetail title={title} type={type} detail={detail} backUrl={backUrl} />;
}
