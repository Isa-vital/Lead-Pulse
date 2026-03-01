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
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('return_number', 20)->unique();
            $table->string('status', 20)->default('requested'); // requested, approved, received, refunded, rejected
            $table->string('reason', 50); // defective, wrong_item, not_as_described, no_longer_needed, delivery_issue, other
            $table->text('description')->nullable();
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->string('refund_method', 30)->nullable(); // original_payment, store_credit, bank_transfer
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->jsonb('items')->default('[]'); // [{product_id, quantity, reason}]
            $table->text('admin_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
