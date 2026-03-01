<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color', 7)->default('#6366f1');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            $table->timestamps();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('stage_id')->constrained('pipeline_stages');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->decimal('value', 12, 2)->default(0);
            $table->integer('probability')->default(50);
            $table->date('expected_close')->nullable();
            $table->string('source', 100)->nullable();
            $table->jsonb('tags')->default('[]');
            $table->jsonb('custom_fields')->default('{}');
            $table->text('lost_reason')->nullable();
            $table->timestamp('won_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('stage_id');
            $table->index('assigned_to');
            $table->index('expected_close');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
        Schema::dropIfExists('pipeline_stages');
    }
};
