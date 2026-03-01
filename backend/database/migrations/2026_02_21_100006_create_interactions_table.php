<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 50);
            $table->string('channel', 50)->nullable();
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();

            $table->index('customer_id');
            $table->index(['type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interactions');
    }
};
