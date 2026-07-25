<?php

use App\Models\User;
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
        $guard = 'web';
        $permissionNames = array_keys(config('rbac.permissions', []));

        foreach ($permissionNames as $name) {
            Permission::findOrCreate($name, $guard);
        }

        foreach (config('rbac.roles', []) as $name => $definition) {
            $role = Role::findOrCreate($name, $guard);
            $permissions = $definition['permissions'] === '*'
                ? $permissionNames
                : $definition['permissions'];
            $role->syncPermissions($permissions);
        }

        $superAdmin = Role::findByName('super-admin', $guard);
        User::query()->get()->each(function (User $user) use ($superAdmin) {
            if ($user->roles()->doesntExist()) {
                $user->assignRole($superAdmin);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Data akses tidak dihapus agar rollback tidak mengunci akun yang sudah aktif.
    }
};
