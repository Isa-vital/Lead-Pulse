<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'address',
        'tags',
        'source',
        'lifetime_value',
        'custom_fields',
        'notes',
        'is_active',
        'tier',
        'points_balance',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
            'tags' => 'array',
            'custom_fields' => 'array',
            'lifetime_value' => 'decimal:2',
            'is_active' => 'boolean',
            'last_activity_at' => 'datetime',
        ];
    }

    // Relationships
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function interactions()
    {
        return $this->hasMany(Interaction::class);
    }

    public function supportTickets()
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function loyaltyPoints()
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->whereRaw(
            "search_vector @@ plainto_tsquery('english', ?)",
            [$term]
        );
    }

    public function scopeWithTag($query, string $tag)
    {
        return $query->whereRaw("? = ANY(tags)", [$tag]);
    }

    // Accessors
    public function getOrderCountAttribute(): int
    {
        return $this->orders()->count();
    }

    // Methods
    public function recalculateLifetimeValue(): void
    {
        $this->update([
            'lifetime_value' => $this->orders()
                ->where('status', '!=', 'cancelled')
                ->sum('total'),
        ]);
    }
}
