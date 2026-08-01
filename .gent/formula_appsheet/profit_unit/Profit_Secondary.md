PROFIT RECORD SECONDARY
> Data tabel diambil dari form_download_dashboard_manajemen
    Row filter condition: [id_key]="PROFIT SECONDARY"
>>Virtual kolom
>>>TOTAL TARIF PENAGIHAN SECONDARY
    formula:
    SUM(
  SELECT(
    operasional_primary_input[PROFIT],
    AND(
      OR(ISBLANK([_THISROW].[tipe_unit]), [JENIS] = [_THISROW].[tipe_unit]),
      OR(ISBLANK([_THISROW].[area]), [AREA] = [_THISROW].[area]),
      OR(ISBLANK([_THISROW].[dari_bulan]), [BULAN] = [_THISROW].[dari_bulan]),
      OR(ISBLANK([_THISROW].[dari_week]), [WEEK] = [_THISROW].[dari_week]),
      OR(
        ISBLANK([_THISROW].[dari_hari]),
        [tanggal_muat] = [_THISROW].[dari_hari]
      ),
      OR(ISBLANK([_THISROW].[dari_tahun]), [TAHUN] = [_THISROW].[dari_tahun]),
      OR(ISBLANK([_THISROW].[katagori]), [KATAGORI] = [_THISROW].[katagori])
    )
  )
)

>>>TOTAL BIAYA OPERASIONAL SECONDARY
    formula: 
    SUM(
    SELECT(
      operasional_secondary_input[total_biaya_operasional],
      AND(
        OR(ISBLANK([_THISROW].[tipe_unit]), [tipe_unit] = [_THISROW].[tipe_unit]),
        OR(ISBLANK([_THISROW].[area]), [area] = [_THISROW].[area]),
        OR(ISBLANK([_THISROW].[dari_bulan]), [bulan] = [_THISROW].[dari_bulan]),
        OR(ISBLANK([_THISROW].[dari_week]), [week] = [_THISROW].[dari_week]),
        OR(ISBLANK([_THISROW].[dari_hari]), [tanggal] = [_THISROW].[dari_hari]),
        OR(ISBLANK([_THISROW].[dari_tahun]), [tahun] = [_THISROW].[dari_tahun]),
        OR([project]="ON DEMAND - FULL SERVICE",[project]="RENTAL")
      )
    )
  )

>>>TOTAL PROFIT SECONDARY
    formula:
    SUM(
    SELECT(
      operasional_secondary_input[PROFIT TRIP],
      AND(
        OR(ISBLANK([_THISROW].[tipe_unit]), [tipe_unit] = [_THISROW].[tipe_unit]),
        OR(ISBLANK([_THISROW].[area]), [area] = [_THISROW].[area]),
        OR(ISBLANK([_THISROW].[dari_bulan]), [bulan] = [_THISROW].[dari_bulan]),
        OR(ISBLANK([_THISROW].[dari_week]), [week] = [_THISROW].[dari_week]),
        OR(ISBLANK([_THISROW].[dari_hari]), [tanggal] = [_THISROW].[dari_hari]),
        OR(ISBLANK([_THISROW].[dari_tahun]), [tahun] = [_THISROW].[dari_tahun]),
        OR([project]="ON DEMAND - FULL SERVICE",[project]="RENTAL")
      )
    )
  )
