PROFIT RECORD PRIMARY
>Data tabel diambil dari form_download_dashboard_manajemen
    Row filter condition: [id_key]="PROFIT PRIMARY"
>>Virtual Kolom
>>>TOTAL TARIF PRIMARY
    formula:
    SUM(
  SELECT(
    operasional_primary_input[total_tarif],
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
>>>TOTAL BIAYA PRIMARY
    formula:
    SUM(
  SELECT(
    operasional_primary_input[total_biaya],
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
>>>TOTAL PROFIT PRIMARY
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
