<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Automation extends Model
{
    use HasFactory, SoftDeletes;

    const TRIGGER_TYPES = [
        'cart_abandoned',
        'order_placed',
        'customer_created',
        'customer_inactive',
        'lead_stage_changed',
        'ticket_created',
    ];

    const ACTION_TYPES = [
        'send_email',
        'send_sms',
        'assign_tag',
        'update_tier',
        'create_task',
        'send_notification',
    ];

    protected $fillable = [
        'name',
        'description',
        'trigger_type',
        'action_type',
        'conditions',
        'action_config',
        'delay_minutes',
        'is_active',
        'last_triggered_at',
        'execution_count',
    ];

    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'action_config' => 'array',
            'is_active' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    public function logs()
    {
        return $this->hasMany(AutomationLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTrigger($query, string $triggerType)
    {
        return $query->where('trigger_type', $triggerType);
    }
}
