<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_without_access_control_permission_cannot_open_rbac_page(): void
    {
        $viewer = $this->user('VIEWER-01');
        $viewer->assignRole('viewer');

        $this->actingAs($viewer)
            ->get('/system/access-control')
            ->assertForbidden();
    }

    public function test_super_admin_can_open_rbac_page_and_change_user_role(): void
    {
        $admin = $this->user('ADMIN-01');
        $admin->assignRole('super-admin');
        $viewer = $this->user('VIEWER-02');
        $viewer->assignRole('viewer');

        $this->actingAs($admin)
            ->get('/system/access-control')
            ->assertOk();

        $this->actingAs($admin)
            ->put("/system/access-control/users/{$viewer->id}/role", ['role' => 'hr'])
            ->assertRedirect();

        $this->assertTrue($viewer->fresh()->hasRole('hr'));
    }

    public function test_super_admin_can_create_and_delete_another_user(): void
    {
        $admin = $this->user('ADMIN-02');
        $admin->assignRole('super-admin');

        $this->actingAs($admin)->post('/system/access-control/users', [
            'nik' => 'OPS-001',
            'email' => 'ops-001@example.test',
            'role' => 'operations',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();

        $created = User::where('nik', 'OPS-001')->firstOrFail();
        $this->assertTrue($created->hasRole('operations'));

        $this->actingAs($admin)
            ->delete("/system/access-control/users/{$created->id}")
            ->assertRedirect('/system/access-control');
        $this->assertDatabaseMissing('users', ['id' => $created->id]);
    }

    public function test_super_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->user('ADMIN-03');
        $admin->assignRole('super-admin');

        $this->actingAs($admin)
            ->delete("/system/access-control/users/{$admin->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    private function user(string $nik): User
    {
        return User::query()->create([
            'nik' => $nik,
            'email' => strtolower($nik).'@example.test',
            'password' => Hash::make('password'),
        ]);
    }
}
