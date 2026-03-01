<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_PROCESSING,
        self::STATUS_SHIPPED,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    protected $fillable = [
        'customer_id',
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'tax',
        'discount',
        'total',
        'shipping_address',
        'notes',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'shipping_address' => 'array',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->order_number)) {
                $order->order_number = self::generateOrderNumber();
            }
        });
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $sequence = self::whereDate('created_at', today())->count() + 1;
        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at', 'desc');
    }

    // Scopes
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Methods
    public function calculateTotals(): void
    {
        $subtotal = $this->items->sum('total');
        $this->update([
            'subtotal' => $subtotal,
            'total' => $subtotal + $this->tax - $this->discount,
        ]);
    }

    public function canTransitionTo(string $status): bool
    {
        $transitions = [
            self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
            self::STATUS_CONFIRMED => [self::STATUS_PROCESSING, self::STATUS_CANCELLED],
            self::STATUS_PROCESSING => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
            self::STATUS_SHIPPED => [self::STATUS_DELIVERED],
            self::STATUS_DELIVERED => [self::STATUS_REFUNDED],
            self::STATUS_CANCELLED => [],
            self::STATUS_REFUNDED => [],
        ];

        return in_array($status, $transitions[$this->status] ?? []);
    }
}
