<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'stage_id',
        'assigned_to',
        'title',
        'value',
        'probability',
        'expected_close',
        'source',
        'tags',
        'custom_fields',
        'lost_reason',
        'won_at',
        'lost_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'probability' => 'integer',
            'expected_close' => 'date',
            'tags' => 'array',
            'custom_fields' => 'array',
            'won_at' => 'datetime',
            'lost_at' => 'datetime',
        ];
    }

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function stage()
    {
        return $this->belongsTo(PipelineStage::class, 'stage_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function interactions()
    {
        return $this->hasMany(Interaction::class);
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->whereNull('won_at')->whereNull('lost_at');
    }

    public function scopeWon($query)
    {
        return $query->whereNotNull('won_at');
    }

    public function scopeLost($query)
    {
        return $query->whereNotNull('lost_at');
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    // Accessors
    public function getWeightedValueAttribute(): float
    {
        return round($this->value * ($this->probability / 100), 2);
    }

    // Methods
    public function markAsWon(): void
    {
        $wonStage = PipelineStage::where('is_won', true)->first();
        $this->update([
            'stage_id' => $wonStage?->id ?? $this->stage_id,
            'won_at' => now(),
            'probability' => 100,
        ]);
    }

    public function markAsLost(string $reason = null): void
    {
        $lostStage = PipelineStage::where('is_lost', true)->first();
        $this->update([
            'stage_id' => $lostStage?->id ?? $this->stage_id,
            'lost_at' => now(),
            'lost_reason' => $reason,
            'probability' => 0,
        ]);
    }
}
