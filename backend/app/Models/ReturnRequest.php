<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnRequest extends Model
{
    use HasFactory;

    protected $table = 'returns';

    const STATUSES = ['requested', 'approved', 'received', 'refunded', 'rejected'];

    protected $fillable = [
        'order_id',
        'customer_id',
        'processed_by',
        'return_number',
        'status',
        'reason',
        'description',
        'refund_amount',
        'refund_method',
        'approved_at',
        'received_at',
        'refunded_at',
        'items',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'refund_amount' => 'decimal:2',
            'approved_at' => 'datetime',
            'received_at' => 'datetime',
            'refunded_at' => 'datetime',
            'items' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ReturnRequest $return) {
            if (empty($return->return_number)) {
                $return->return_number = self::generateReturnNumber();
            }
        });
    }

    public static function generateReturnNumber(): string
    {
        $sequence = self::whereDate('created_at', today())->count() + 1;
        return sprintf('RET-%s-%04d', now()->format('Ymd'), $sequence);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
