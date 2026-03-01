<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interaction extends Model
{
    use HasFactory;

    const TYPE_EMAIL = 'email';
    const TYPE_CALL = 'call';
    const TYPE_MEETING = 'meeting';
    const TYPE_NOTE = 'note';
    const TYPE_TASK = 'task';

    const TYPES = [
        self::TYPE_EMAIL,
        self::TYPE_CALL,
        self::TYPE_MEETING,
        self::TYPE_NOTE,
        self::TYPE_TASK,
    ];

    const CHANNEL_PHONE = 'phone';
    const CHANNEL_EMAIL = 'email';
    const CHANNEL_IN_PERSON = 'in-person';
    const CHANNEL_CHAT = 'chat';
    const CHANNEL_VIDEO = 'video';

    protected $fillable = [
        'customer_id',
        'user_id',
        'lead_id',
        'type',
        'channel',
        'subject',
        'body',
        'scheduled_at',
        'completed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'metadata' => 'array',
        ];
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

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    // Scopes
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeUpcoming($query)
    {
        return $query->whereNotNull('scheduled_at')
            ->whereNull('completed_at')
            ->where('scheduled_at', '>=', now());
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('scheduled_at')
            ->whereNull('completed_at')
            ->where('scheduled_at', '<', now());
    }
}
