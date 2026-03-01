<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    const CHANNELS = ['web', 'whatsapp', 'messenger'];
    const DIRECTIONS = ['inbound', 'outbound'];

    protected $fillable = [
        'customer_id',
        'user_id',
        'ticket_id',
        'channel',
        'direction',
        'message',
        'attachments',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'attachments' => 'array',
            'is_read' => 'boolean',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeInbound($query)
    {
        return $query->where('direction', 'inbound');
    }
}
