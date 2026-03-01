<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cart extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = ['active', 'abandoned', 'recovered', 'converted'];

    protected $fillable = [
        'customer_id',
        'status',
        'total',
        'reminder_sent_at',
        'reminder_count',
        'recovered_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'reminder_sent_at' => 'datetime',
            'recovered_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function scopeAbandoned($query)
    {
        return $query->where('status', 'abandoned');
    }

    public function scopeRecoverable($query)
    {
        return $query->where('status', 'abandoned')
            ->where('reminder_count', '<', 3)
            ->where('created_at', '>', now()->subDays(30));
    }
}
