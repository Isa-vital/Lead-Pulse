<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_dir', 'desc'));

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:percentage,fixed_amount,free_shipping'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_per_customer' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
            'conditions' => ['nullable', 'array'],
        ]);

        $coupon = Coupon::create($validated);

        ActivityLog::log('created', 'Coupon', $coupon->id);

        return $this->successResponse($coupon, 'Coupon created successfully', 201);
    }

    public function show(Coupon $coupon): JsonResponse
    {
        return $this->successResponse($coupon);
    }

    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'unique:coupons,code,' . $coupon->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'in:percentage,fixed_amount,free_shipping'],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_per_customer' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
            'conditions' => ['nullable', 'array'],
        ]);

        $coupon->update($validated);

        ActivityLog::log('updated', 'Coupon', $coupon->id);

        return $this->successResponse($coupon->fresh(), 'Coupon updated successfully');
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        ActivityLog::log('deleted', 'Coupon', $coupon->id);
        $coupon->delete();

        return $this->successResponse(null, 'Coupon deleted successfully');
    }
}
