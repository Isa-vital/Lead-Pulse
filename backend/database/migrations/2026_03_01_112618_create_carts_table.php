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
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('active'); // active, abandoned, recovered, converted
            $table->decimal('total', 12, 2)->default(0);
            $table->integer('reminder_count')->default(0);
            $table->timestamp('last_reminder_at')->nullable();
            $table->timestamp('abandoned_at')->nullable();
            $table->timestamp('recovered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
