<?php

return [
    'permissions' => [
        'dashboard.view' => 'Lihat Dashboard',
        'biaya.view' => 'Lihat Biaya',
        'biaya.manage' => 'Kelola Data Biaya',
        'profit-unit.view' => 'Lihat Profit Unit',
        'profit-unit.manage' => 'Kelola Data Profit Unit',
        'inventory.view' => 'Lihat Daftar Unit dan Asset',
        'inventory.manage' => 'Kelola Daftar Unit dan Asset',
        'on-the-road.view' => 'Lihat On The Road',
        'on-the-road.manage' => 'Kelola Data On The Road',
        'approval.view' => 'Lihat Need Approval',
        'approval.manage' => 'Kelola Need Approval',
        'employees.view' => 'Lihat Daftar Karyawan',
        'employees.manage' => 'Kelola Daftar Karyawan',
        'service.view' => 'Lihat Riwayat Service',
        'service.manage' => 'Kelola Riwayat Service',
        'system.view' => 'Lihat System Activity Log',
        'system.manage' => 'Kelola Data Sistem',
        'finance-documents.view' => 'Lihat Dokumen Finance',
        'finance-documents.manage' => 'Kelola Dokumen Finance',
        'access-control.manage' => 'Kelola Role dan Hak Akses',
    ],

    'roles' => [
        'super-admin' => [
            'label' => 'Super Admin',
            'permissions' => '*',
        ],
        'management' => [
            'label' => 'Manajemen',
            'permissions' => [
                'dashboard.view', 'biaya.view', 'profit-unit.view', 'inventory.view',
                'on-the-road.view', 'approval.view', 'employees.view', 'service.view',
                'system.view', 'finance-documents.view',
            ],
        ],
        'finance' => [
            'label' => 'Finance',
            'permissions' => [
                'dashboard.view', 'biaya.view', 'profit-unit.view', 'approval.view',
                'finance-documents.view', 'biaya.manage', 'profit-unit.manage',
                'finance-documents.manage',
            ],
        ],
        'operations' => [
            'label' => 'Operasional',
            'permissions' => [
                'dashboard.view', 'inventory.view', 'on-the-road.view',
                'service.view', 'service.manage', 'inventory.manage', 'on-the-road.manage',
            ],
        ],
        'hr' => [
            'label' => 'HR',
            'permissions' => [
                'dashboard.view', 'employees.view', 'employees.manage', 'system.view',
            ],
        ],
        'viewer' => [
            'label' => 'Viewer',
            'permissions' => [
                'dashboard.view', 'biaya.view', 'profit-unit.view', 'inventory.view',
                'on-the-road.view', 'approval.view', 'employees.view', 'service.view',
            ],
        ],
    ],
];
