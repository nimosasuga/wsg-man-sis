<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $permissionNames = array_keys(config('rbac.permissions', []));

        foreach ($permissionNames as $name) {
            Permission::findOrCreate($name, 'web');
        }

        foreach (config('rbac.roles', []) as $name => $definition) {
            $role = Role::findOrCreate($name, 'web');
            $role->syncPermissions($definition['permissions'] === '*' ? $permissionNames : $definition['permissions']);
        }

        $superAdmin = Role::findByName('super-admin', 'web');
        User::query()->get()->each(fn (User $user) => $user->roles()->doesntExist() ? $user->assignRole($superAdmin) : null);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
