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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ticket_number', 20)->unique();
            $table->string('subject');
            $table->text('description');
            $table->string('category', 50)->default('general'); // general, billing, technical, shipping, product
            $table->string('priority', 20)->default('medium'); // low, medium, high, urgent
            $table->string('status', 20)->default('open'); // open, in_progress, waiting, resolved, closed
            $table->string('channel', 30)->default('email'); // email, phone, chat, whatsapp
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->integer('sla_hours')->default(24);
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
