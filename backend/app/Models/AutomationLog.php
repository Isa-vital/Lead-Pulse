<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationLog extends Model
{
    use HasFactory;

    const STATUSES = ['success', 'failed', 'skipped'];

    protected $fillable = [
        'automation_id',
        'customer_id',
        'status',
        'result',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
        ];
    }

    public function automation()
    {
        return $this->belongsTo(Automation::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
