<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyPoint extends Model
{
    use HasFactory;

    const TYPES = ['earned', 'redeemed', 'bonus', 'expired', 'adjustment'];

    protected $fillable = [
        'customer_id',
        'order_id',
        'points',
        'type',
        'description',
        'balance_after',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
