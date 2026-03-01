<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PipelineStage;
use App\Models\Setting;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRolesAndPermissions();
        $this->seedAdminUser();
        $this->seedPipelineStages();
        $this->seedDefaultSettings();
    }

    private function seedRolesAndPermissions(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'orders.view',
            'orders.create',
            'orders.edit',
            'orders.delete',
            'orders.manage_status',
            'leads.view',
            'leads.create',
            'leads.edit',
            'leads.delete',
            'leads.assign',
            'interactions.view',
            'interactions.create',
            'interactions.edit',
            'interactions.delete',
            'reports.view',
            'reports.export',
            'settings.view',
            'settings.edit',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        $admin = Role::findOrCreate('admin');
        $admin->givePermissionTo(Permission::all());

        $manager = Role::findOrCreate('manager');
        $manager->givePermissionTo([
            'customers.view',
            'customers.create',
            'customers.edit',
            'products.view',
            'products.create',
            'products.edit',
            'orders.view',
            'orders.create',
            'orders.edit',
            'orders.manage_status',
            'leads.view',
            'leads.create',
            'leads.edit',
            'leads.assign',
            'interactions.view',
            'interactions.create',
            'interactions.edit',
            'reports.view',
            'reports.export',
            'users.view',
        ]);

        $salesRep = Role::findOrCreate('sales_rep');
        $salesRep->givePermissionTo([
            'customers.view',
            'customers.create',
            'customers.edit',
            'products.view',
            'orders.view',
            'orders.create',
            'leads.view',
            'leads.create',
            'leads.edit',
            'interactions.view',
            'interactions.create',
            'interactions.edit',
            'reports.view',
        ]);

        $support = Role::findOrCreate('support');
        $support->givePermissionTo([
            'customers.view',
            'customers.edit',
            'products.view',
            'orders.view',
            'orders.manage_status',
            'interactions.view',
            'interactions.create',
        ]);
    }

    private function seedAdminUser(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@leadpulse.com'],
            [
                'name' => 'System Admin',
                'password' => 'password',
                'is_active' => true,
            ]
        );
        $admin->assignRole('admin');

        $manager = User::firstOrCreate(
            ['email' => 'manager@leadpulse.com'],
            [
                'name' => 'Jane Manager',
                'password' => 'password',
                'is_active' => true,
            ]
        );
        $manager->assignRole('manager');

        $salesRep = User::firstOrCreate(
            ['email' => 'sales@leadpulse.com'],
            [
                'name' => 'John Sales',
                'password' => 'password',
                'is_active' => true,
            ]
        );
        $salesRep->assignRole('sales_rep');
    }

    private function seedPipelineStages(): void
    {
        $stages = [
            ['name' => 'New Lead', 'slug' => 'new-lead', 'color' => '#8b5cf6', 'sort_order' => 1, 'is_default' => true],
            ['name' => 'Contacted', 'slug' => 'contacted', 'color' => '#3b82f6', 'sort_order' => 2],
            ['name' => 'Qualified', 'slug' => 'qualified', 'color' => '#06b6d4', 'sort_order' => 3],
            ['name' => 'Proposal', 'slug' => 'proposal', 'color' => '#f59e0b', 'sort_order' => 4],
            ['name' => 'Negotiation', 'slug' => 'negotiation', 'color' => '#f97316', 'sort_order' => 5],
            ['name' => 'Won', 'slug' => 'won', 'color' => '#22c55e', 'sort_order' => 6, 'is_won' => true],
            ['name' => 'Lost', 'slug' => 'lost', 'color' => '#ef4444', 'sort_order' => 7, 'is_lost' => true],
        ];

        foreach ($stages as $stage) {
            PipelineStage::firstOrCreate(['slug' => $stage['slug']], $stage);
        }
    }

    private function seedDefaultSettings(): void
    {
        $settings = [
            ['group' => 'general', 'key' => 'company_name', 'value' => 'Lead Pulse'],
            ['group' => 'general', 'key' => 'company_email', 'value' => 'info@leadpulse.com'],
            ['group' => 'general', 'key' => 'currency', 'value' => 'USD'],
            ['group' => 'general', 'key' => 'date_format', 'value' => 'Y-m-d'],
            ['group' => 'general', 'key' => 'timezone', 'value' => 'UTC'],
            ['group' => 'notifications', 'key' => 'low_stock_alert', 'value' => true],
            ['group' => 'notifications', 'key' => 'new_order_alert', 'value' => true],
            ['group' => 'notifications', 'key' => 'lead_assignment_alert', 'value' => true],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
