<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyPoint;
use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoyaltyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LoyaltyPoint::with(['customer:id,name,email', 'order:id,order_number']);

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $query->orderBy('created_at', 'desc');

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'points' => ['required', 'integer'],
            'type' => ['required', 'in:earned,redeemed,bonus,expired,adjustment'],
            'description' => ['nullable', 'string', 'max:255'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);

        if ($validated['type'] === 'redeemed' && $customer->points_balance < abs($validated['points'])) {
            return $this->errorResponse('Insufficient points balance', 422);
        }

        $pointsChange = in_array($validated['type'], ['redeemed', 'expired'])
            ? -abs($validated['points'])
            : abs($validated['points']);

        $validated['points'] = $pointsChange;
        $validated['balance_after'] = $customer->points_balance + $pointsChange;

        DB::transaction(function () use ($validated, $customer, $pointsChange) {
            LoyaltyPoint::create($validated);
            $customer->increment('points_balance', $pointsChange);
        });

        return $this->successResponse(null, 'Points recorded successfully', 201);
    }

    public function customerBalance(Customer $customer): JsonResponse
    {
        $data = [
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'points_balance' => $customer->points_balance,
            'total_earned' => LoyaltyPoint::where('customer_id', $customer->id)->where('type', 'earned')->sum('points'),
            'total_redeemed' => abs(LoyaltyPoint::where('customer_id', $customer->id)->where('type', 'redeemed')->sum('points')),
            'recent_transactions' => LoyaltyPoint::where('customer_id', $customer->id)
                ->with('order:id,order_number')
                ->latest()
                ->limit(10)
                ->get(),
        ];

        return $this->successResponse($data);
    }

    public function leaderboard(): JsonResponse
    {
        $customers = Customer::where('points_balance', '>', 0)
            ->orderBy('points_balance', 'desc')
            ->limit(20)
            ->get(['id', 'name', 'email', 'points_balance', 'tier']);

        return $this->successResponse($customers);
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total_points_issued' => LoyaltyPoint::whereIn('type', ['earned', 'bonus'])->sum('points'),
            'total_points_redeemed' => abs(LoyaltyPoint::where('type', 'redeemed')->sum('points')),
            'active_members' => Customer::where('points_balance', '>', 0)->count(),
            'average_balance' => round(Customer::where('points_balance', '>', 0)->avg('points_balance') ?? 0),
        ];

        return $this->successResponse($stats);
    }
}
