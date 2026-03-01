<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Cart::with(['customer:id,name,email', 'items.product:id,name,price']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_dir', 'desc'));

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function show(Cart $cart): JsonResponse
    {
        $cart->load(['customer', 'items.product']);

        return $this->successResponse($cart);
    }

    public function update(Request $request, Cart $cart): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:active,abandoned,recovered,converted'],
        ]);

        if ($validated['status'] === 'recovered') {
            $validated['recovered_at'] = now();
        }

        $cart->update($validated);

        return $this->successResponse($cart->fresh()->load(['customer:id,name,email']), 'Cart updated successfully');
    }

    public function sendReminder(Cart $cart): JsonResponse
    {
        if ($cart->status !== 'abandoned') {
            return $this->errorResponse('Can only send reminders for abandoned carts', 422);
        }

        $cart->update([
            'reminder_sent_at' => now(),
            'reminder_count' => $cart->reminder_count + 1,
        ]);

        return $this->successResponse($cart->fresh(), 'Reminder sent successfully');
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total_abandoned' => Cart::where('status', 'abandoned')->count(),
            'total_recovered' => Cart::where('status', 'recovered')->count(),
            'total_converted' => Cart::where('status', 'converted')->count(),
            'abandoned_value' => Cart::where('status', 'abandoned')->sum('total'),
            'recovered_value' => Cart::where('status', 'recovered')->sum('total'),
            'recovery_rate' => round(
                Cart::whereIn('status', ['abandoned', 'recovered'])->count() > 0
                    ? (Cart::where('status', 'recovered')->count() / Cart::whereIn('status', ['abandoned', 'recovered'])->count()) * 100
                    : 0,
                1
            ),
            'recoverable' => Cart::recoverable()->count(),
        ];

        return $this->successResponse($stats);
    }
}
