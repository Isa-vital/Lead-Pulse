<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('points');
            $table->string('type', 30); // earned, redeemed, bonus, expired, adjustment
            $table->string('description');
            $table->integer('balance_after')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Add points_balance to customers
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('points_balance')->default(0)->after('tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('points_balance');
        });

        Schema::dropIfExists('loyalty_points');
    }
};
