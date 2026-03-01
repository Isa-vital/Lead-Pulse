<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Segment extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'rules',
        'match_type',
        'customer_count',
        'is_active',
        'last_calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'rules' => 'array',
            'is_active' => 'boolean',
            'last_calculated_at' => 'datetime',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Build the customer query for this segment's rules.
     */
    public function buildCustomerQuery()
    {
        $query = Customer::query();

        foreach ($this->rules ?? [] as $rule) {
            $method = $this->match_type === 'all' ? 'where' : 'orWhere';
            $field = $rule['field'] ?? '';
            $operator = $rule['operator'] ?? '=';
            $value = $rule['value'] ?? '';

            switch ($field) {
                case 'tier':
                    $query->$method('tier', $operator, $value);
                    break;
                case 'lifetime_value':
                    $query->$method('lifetime_value', $operator, (float) $value);
                    break;
                case 'source':
                    $query->$method('source', $operator, $value);
                    break;
                case 'is_active':
                    $query->$method('is_active', '=', (bool) $value);
                    break;
                case 'tag':
                    $query->{$method}(function ($q) use ($value) {
                        $q->whereJsonContains('tags', $value);
                    });
                    break;
                case 'orders_count':
                    $query->{$method . 'Has'}('orders', $operator, (int) $value);
                    break;
                case 'last_order_days':
                    $query->{$method}(function ($q) use ($operator, $value) {
                        $q->whereHas('orders', function ($oq) use ($operator, $value) {
                            $oq->where('created_at', $operator === '>' ? '<' : '>', now()->subDays((int) $value));
                        });
                    });
                    break;
                case 'created_days_ago':
                    $query->$method('created_at', $operator === '>' ? '<' : '>', now()->subDays((int) $value));
                    break;
            }
        }

        return $query;
    }

    /**
     * Recalculate the customer count.
     */
    public function recalculate(): void
    {
        $this->update([
            'customer_count' => $this->buildCustomerQuery()->count(),
            'last_calculated_at' => now(),
        ]);
    }
}
