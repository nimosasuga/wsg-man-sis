<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles') || ! Schema::hasTable('permissions')) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $permissionNames = array_keys(config('rbac.permissions', []));

        foreach ($permissionNames as $name) {
            Permission::findOrCreate($name, 'web');
        }

        foreach (config('rbac.roles', []) as $name => $definition) {
            $role = Role::findOrCreate($name, 'web');
            $permissions = $definition['permissions'] === '*'
                ? $permissionNames
                : array_values(array_unique(array_merge(
                    $role->permissions->pluck('name')->all(),
                    $definition['permissions'],
                )));
            $role->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Hak yang sudah dipakai tidak dihapus saat rollback.
    }
};
