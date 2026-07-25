<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AccessControlController extends Controller
{
    public function index(): Response
    {
        $roleLabels = collect(config('rbac.roles', []))->map(fn ($role) => $role['label']);

        return Inertia::render('System/AccessControl/Index', [
            'users' => User::query()
                ->with('roles:id,name')
                ->orderBy('nik')
                ->get(['id', 'nik', 'email'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'nik' => $user->nik,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name,
                    'role_label' => $roleLabels[$user->roles->first()?->name] ?? 'Belum ada role',
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('System/AccessControl/Form', [
            'mode' => 'create',
            'roles' => $this->roleOptions(),
            'submitUrl' => route('system.access-control.users.store'),
            'backUrl' => route('system.access-control.index'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateUser($request);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'nik' => $validated['nik'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);
            $user->assignRole($validated['role']);

            return $user;
        });

        return redirect()->route('system.access-control.users.show', $user)
            ->with('success', "Pengguna {$user->nik} berhasil dibuat.");
    }

    public function show(Request $request, User $user): Response
    {
        $user->load('roles.permissions', 'permissions');
        $role = $user->roles->first();

        return Inertia::render('System/AccessControl/Detail', [
            'userRecord' => [
                'id' => $user->id,
                'nik' => $user->nik,
                'email' => $user->email,
                'role' => $role?->name,
                'directPermissions' => $user->permissions->pluck('name')->values(),
                'rolePermissions' => $role?->permissions->pluck('name')->values() ?? [],
                'effectivePermissions' => $user->getAllPermissions()->pluck('name')->values(),
                'isCurrentUser' => $request->user()->is($user),
            ],
            'roles' => $this->roleOptions(),
            'permissions' => $this->permissionOptions(),
            'backUrl' => route('system.access-control.index'),
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('System/AccessControl/Form', [
            'mode' => 'edit',
            'userRecord' => [
                'id' => $user->id,
                'nik' => $user->nik,
                'email' => $user->email,
                'role' => $user->roles()->value('name'),
            ],
            'roles' => $this->roleOptions(),
            'submitUrl' => route('system.access-control.users.update', $user),
            'backUrl' => route('system.access-control.users.show', $user),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $this->validateUser($request, $user);
        $this->guardLastSuperAdmin($user, $validated['role']);

        DB::transaction(function () use ($validated, $user) {
            $attributes = [
                'nik' => $validated['nik'],
                'email' => $validated['email'],
            ];
            if (! empty($validated['password'])) {
                $attributes['password'] = Hash::make($validated['password']);
            }
            $user->update($attributes);
            $user->syncRoles([$validated['role']]);
        });

        return redirect()->route('system.access-control.users.show', $user)
            ->with('success', "Pengguna {$user->nik} berhasil diperbarui.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($request->user()->is($user), 422, 'Anda tidak dapat menghapus akun yang sedang digunakan.');
        $this->guardLastSuperAdmin($user, null);
        $nik = $user->nik;
        $user->delete();

        return redirect()->route('system.access-control.index')
            ->with('success', "Pengguna {$nik} berhasil dihapus.");
    }

    public function updateUserAccess(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(array_keys(config('rbac.permissions', [])))],
        ]);
        $this->guardLastSuperAdmin($user, $validated['role']);

        DB::transaction(function () use ($validated, $user) {
            $user->syncRoles([$validated['role']]);
            $user->syncPermissions($validated['role'] === 'super-admin' ? [] : ($validated['permissions'] ?? []));
        });
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', "Hak akses {$user->nik} berhasil diperbarui.");
    }

    public function updateUserRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $this->guardLastSuperAdmin($user, $validated['role']);

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "Akses {$user->nik} berhasil diperbarui.");
    }

    public function updateRolePermissions(Request $request, Role $role): RedirectResponse
    {
        abort_if($role->name === 'super-admin', 422, 'Hak Super Admin tidak dapat dikurangi.');

        $validated = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', 'in:'.implode(',', array_keys(config('rbac.permissions', [])))],
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('success', "Hak akses {$role->name} berhasil diperbarui.");
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'nik' => ['required', 'string', 'max:255', Rule::unique('users', 'nik')->ignore($user?->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'confirmed', Password::min(8)],
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);
    }

    private function guardLastSuperAdmin(User $user, ?string $nextRole): void
    {
        if ($user->hasRole('super-admin') && $nextRole !== 'super-admin') {
            abort_if(User::role('super-admin')->count() <= 1, 422, 'Super Admin terakhir tidak dapat diubah atau dihapus.');
        }
    }

    private function roleOptions(): array
    {
        $labels = collect(config('rbac.roles', []))->map(fn ($role) => $role['label']);

        return Role::query()->with('permissions:id,name')->orderBy('id')->get(['id', 'name'])
            ->map(fn (Role $role) => [
                'name' => $role->name,
                'label' => $labels[$role->name] ?? $role->name,
                'permissions' => $role->permissions->pluck('name')->values()->all(),
            ])
            ->all();
    }

    private function permissionOptions(): array
    {
        return collect(config('rbac.permissions', []))
            ->map(fn ($label, $name) => ['name' => $name, 'label' => $label])
            ->values()
            ->all();
    }
}
