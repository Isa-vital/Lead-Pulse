<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('tier', 20)->default('regular')->after('is_active'); // regular, silver, gold, vip
            $table->timestamp('last_activity_at')->nullable()->after('tier');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['tier', 'last_activity_at']);
        });
    }
};
