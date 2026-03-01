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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('email_template_id')->nullable()->constrained('email_templates')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type', 20)->default('email'); // email, sms
            $table->string('status', 20)->default('draft'); // draft, scheduled, sending, sent, cancelled
            $table->string('subject')->nullable();
            $table->text('content')->nullable();
            $table->integer('total_recipients')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('open_count')->default(0);
            $table->integer('click_count')->default(0);
            $table->integer('bounce_count')->default(0);
            $table->integer('unsubscribe_count')->default(0);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->jsonb('segment_filters')->default('{}');
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
        Schema::dropIfExists('campaigns');
    }
};
