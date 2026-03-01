<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PipelineStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'sort_order',
        'is_default',
        'is_won',
        'is_lost',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
        ];
    }

    // Relationships
    public function leads()
    {
        return $this->hasMany(Lead::class, 'stage_id');
    }

    // Scopes
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
