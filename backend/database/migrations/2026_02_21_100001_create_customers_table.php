<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('company')->nullable();
            $table->jsonb('address')->default('{}');
            $table->jsonb('tags')->default('[]');
            $table->string('source', 100)->nullable();
            $table->decimal('lifetime_value', 12, 2)->default(0);
            $table->jsonb('custom_fields')->default('{}');
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Add tsvector column and trigger for full-text search
        DB::statement("ALTER TABLE customers ADD COLUMN search_vector tsvector");
        DB::statement("CREATE INDEX idx_customers_search ON customers USING GIN(search_vector)");
        DB::statement("
            CREATE OR REPLACE FUNCTION customers_search_update() RETURNS trigger AS \$\$
            BEGIN
                NEW.search_vector :=
                    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C') ||
                    setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'D');
                RETURN NEW;
            END
            \$\$ LANGUAGE plpgsql;
        ");
        DB::statement("
            CREATE TRIGGER customers_search_vector_update
            BEFORE INSERT OR UPDATE ON customers
            FOR EACH ROW EXECUTE FUNCTION customers_search_update();
        ");

        // GIN indexes for JSONB and tags
        DB::statement("CREATE INDEX idx_customers_tags ON customers USING GIN(tags)");
        DB::statement("CREATE INDEX idx_customers_address ON customers USING GIN(address)");
        DB::statement("CREATE INDEX idx_customers_custom_fields ON customers USING GIN(custom_fields)");
    }

    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS customers_search_vector_update ON customers");
        DB::statement("DROP FUNCTION IF EXISTS customers_search_update()");
        Schema::dropIfExists('customers');
    }
};
