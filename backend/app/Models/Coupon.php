<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    const TYPES = ['percentage', 'fixed_amount', 'free_shipping'];

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'value',
        'min_order_amount',
        'max_discount_amount',
        'usage_limit',
        'usage_per_customer',
        'times_used',
        'starts_at',
        'expires_at',
        'is_active',
        'conditions',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'conditions' => 'array',
        ];
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsUsablAttribute(): bool
    {
        if (!$this->is_active) return false;
        if ($this->is_expired) return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->usage_limit && $this->times_used >= $this->usage_limit) return false;
        return true;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }
}
