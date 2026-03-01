<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use HasFactory, SoftDeletes;

    const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
    const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
    const CATEGORIES = ['general', 'billing', 'technical', 'shipping', 'product'];

    protected $fillable = [
        'customer_id',
        'assigned_to',
        'order_id',
        'ticket_number',
        'subject',
        'description',
        'category',
        'priority',
        'status',
        'channel',
        'first_response_at',
        'resolved_at',
        'sla_hours',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'first_response_at' => 'datetime',
            'resolved_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SupportTicket $ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = self::generateTicketNumber();
            }
        });
    }

    public static function generateTicketNumber(): string
    {
        $sequence = self::whereDate('created_at', today())->count() + 1;
        return sprintf('TKT-%s-%04d', now()->format('Ymd'), $sequence);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function replies()
    {
        return $this->hasMany(TicketReply::class, 'ticket_id');
    }

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class, 'ticket_id');
    }

    public function getIsOverdueAttribute(): bool
    {
        if (in_array($this->status, ['resolved', 'closed'])) return false;
        return $this->created_at->addHours($this->sla_hours)->isPast();
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotIn('status', ['resolved', 'closed'])
            ->whereRaw("created_at + (sla_hours || ' hours')::interval < now()");
    }
}
