import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock, User, MapPin, Truck, Box, DollarSign, Hash, FileText } from "lucide-react";
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

export default function OperationDetail({ title, type, detail = {}, backUrl, relatedBaps = [] }) {
    if (type === "primary") {
        return <AdminLayout><Head title={`${title} - ${detail.nopol || detail.id_key || ""}`} /><div className="space-y-5"><PrimaryDetail detail={detail} relatedBaps={relatedBaps} backUrl={backUrl} /></div></AdminLayout>;
    }

    return <LegacyOperationDetail title={title} type={type} detail={detail} backUrl={backUrl} />;
}
