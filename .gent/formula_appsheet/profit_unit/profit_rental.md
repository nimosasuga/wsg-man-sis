RECORD PROFIT RENTAL
>Data tabel diambil dari form_download_dashboard_manajemen
    Row filter condition: [id_key]="PROFIT RENTAL"
>>VIRTUAL KOLOM
>>>PROFIT RENTAL UNIT
    formula: 
    SUM(
    SELECT(
      operasional_rental_unit_input[TARIF_SEWA_UNIT_BLN],
      AND(
        OR(ISBLANK([_THISROW].[tipe_unit]), [TIPE] = [_THISROW].[tipe_unit]),
        OR(ISBLANK([_THISROW].[area]), [AREA] = [_THISROW].[area]),
        OR(ISBLANK([_THISROW].[dari_bulan]), [BULAN] = [_THISROW].[dari_bulan]),
        OR(ISBLANK([_THISROW].[dari_week]), [WEEK] = [_THISROW].[dari_week]),
        OR(ISBLANK([_THISROW].[dari_hari]), [TANGGAL] = [_THISROW].[dari_hari]),
        OR(ISBLANK([_THISROW].[dari_tahun]), [TAHUN] = [_THISROW].[dari_tahun])
      )
    )
  )


