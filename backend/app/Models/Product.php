<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'cost',
        'stock',
        'low_stock_threshold',
        'images',
        'attributes',
        'tags',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost' => 'decimal:2',
            'images' => 'array',
            'attributes' => 'array',
            'tags' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'low_stock_threshold');
    }

    public function scopeSearch($query, string $term)
    {
        return $query->whereRaw(
            "search_vector @@ plainto_tsquery('english', ?)",
            [$term]
        );
    }

    // Accessors
    public function getProfitMarginAttribute(): float
    {
        if ($this->price <= 0) return 0;
        return round((($this->price - $this->cost) / $this->price) * 100, 2);
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->low_stock_threshold;
    }
}
