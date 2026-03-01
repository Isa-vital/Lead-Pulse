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
        Schema::create('automations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_type', 50); // order_placed, customer_created, cart_abandoned, lead_won, lead_lost, customer_dormant, order_delivered
            $table->string('action_type', 50); // send_email, send_sms, add_tag, remove_tag, assign_tier, create_task, add_points
            $table->jsonb('trigger_conditions')->default('{}');
            $table->jsonb('action_config')->default('{}');
            $table->integer('delay_minutes')->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('executions_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('automations');
    }
};
