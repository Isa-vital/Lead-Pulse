<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $table = 'activity_log';

    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ActivityLog $log) {
            $log->created_at = now();
        });
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function model()
    {
        return $this->morphTo('model', 'model_type', 'model_id');
    }

    // Scopes
    public function scopeForModel($query, string $type, int $id)
    {
        return $query->where('model_type', $type)->where('model_id', $id);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, int $limit = 50)
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }

    // Static helper
    public static function log(
        string $action,
        string $modelType,
        int $modelId,
        array $changes = [],
        ?int $userId = null
    ): self {
        return self::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'changes' => $changes,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
