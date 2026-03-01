<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku', 100)->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->integer('low_stock_threshold')->default(10);
            $table->jsonb('images')->default('[]');
            $table->jsonb('attributes')->default('{}');
            $table->jsonb('tags')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Full-text search
        DB::statement("ALTER TABLE products ADD COLUMN search_vector tsvector");
        DB::statement("CREATE INDEX idx_products_search ON products USING GIN(search_vector)");
        DB::statement("
            CREATE OR REPLACE FUNCTION products_search_update() RETURNS trigger AS \$\$
            BEGIN
                NEW.search_vector :=
                    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
                RETURN NEW;
            END
            \$\$ LANGUAGE plpgsql;
        ");
        DB::statement("
            CREATE TRIGGER products_search_vector_update
            BEFORE INSERT OR UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION products_search_update();
        ");

        // GIN indexes
        DB::statement("CREATE INDEX idx_products_tags ON products USING GIN(tags)");
        DB::statement("CREATE INDEX idx_products_attributes ON products USING GIN(attributes)");
    }

    public function down(): void
    {
        DB::statement("DROP TRIGGER IF EXISTS products_search_vector_update ON products");
        DB::statement("DROP FUNCTION IF EXISTS products_search_update()");
        Schema::dropIfExists('products');
    }
};
