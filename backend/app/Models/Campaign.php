<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{
    use HasFactory, SoftDeletes;

    const TYPES = ['email', 'sms'];
    const STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'cancelled'];

    protected $fillable = [
        'created_by',
        'email_template_id',
        'name',
        'type',
        'subject',
        'content',
        'status',
        'scheduled_at',
        'sent_at',
        'total_recipients',
        'sent_count',
        'open_count',
        'click_count',
        'bounce_count',
        'unsubscribe_count',
        'segment_filters',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'segment_filters' => 'array',
        ];
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function emailTemplate()
    {
        return $this->belongsTo(EmailTemplate::class);
    }

    public function recipients()
    {
        return $this->hasMany(CampaignRecipient::class);
    }

    public function getOpenRateAttribute(): float
    {
        if ($this->sent_count == 0) return 0;
        return round(($this->open_count / $this->sent_count) * 100, 1);
    }

    public function getClickRateAttribute(): float
    {
        if ($this->sent_count == 0) return 0;
        return round(($this->click_count / $this->sent_count) * 100, 1);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
