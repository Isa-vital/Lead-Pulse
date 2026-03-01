<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ActivityLog;
use App\Notifications\OrderConfirmation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer:id,name,email', 'user:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('name', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['order_number', 'total', 'status', 'created_at'];

        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $orders = $query->paginate($request->get('per_page', 15));

        return $this->paginatedResponse($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'shipping_address' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $order = Order::create([
                'customer_id' => $validated['customer_id'],
                'user_id' => $request->user()->id,
                'status' => Order::STATUS_PENDING,
                'subtotal' => 0,
                'tax' => $validated['tax'] ?? 0,
                'discount' => $validated['discount'] ?? 0,
                'total' => 0,
                'shipping_address' => $validated['shipping_address'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = $item['unit_price'] ?? $product->price;
                $total = $item['quantity'] * $unitPrice;

                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total' => $total,
                ]);

                // Reduce stock
                $product->decrement('stock', $item['quantity']);
                $subtotal += $total;
            }

            $order->update([
                'subtotal' => $subtotal,
                'total' => $subtotal + ($validated['tax'] ?? 0) - ($validated['discount'] ?? 0),
            ]);

            // Update customer lifetime value
            $order->customer->recalculateLifetimeValue();

            return $order;
        });

        $order->load(['customer:id,name,email', 'items.product:id,name,sku', 'user:id,name']);

        ActivityLog::log('created', 'Order', $order->id);

        return $this->successResponse($order, 'Order created successfully', 201);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load([
            'customer',
            'user:id,name',
            'items.product:id,name,sku,price,images',
            'statusHistory.user:id,name',
        ]);

        return $this->successResponse($order);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'shipping_address' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order->update($validated);

        if (isset($validated['tax']) || isset($validated['discount'])) {
            $order->calculateTotals();
        }

        $order->load(['customer:id,name,email', 'items.product:id,name,sku', 'user:id,name']);

        return $this->successResponse($order, 'Order updated successfully');
    }

    /**
     * Update order status with state machine validation.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', Order::STATUSES)],
        ]);

        $newStatus = $request->status;

        if (!$order->canTransitionTo($newStatus)) {
            return $this->errorResponse(
                "Cannot transition from '{$order->status}' to '{$newStatus}'",
                422
            );
        }

        $oldStatus = $order->status;
        $order->update(['status' => $newStatus]);

        // If cancelled, restore stock
        if ($newStatus === Order::STATUS_CANCELLED) {
            foreach ($order->items as $item) {
                $item->product?->increment('stock', $item->quantity);
            }
        }

        ActivityLog::log('status_changed', 'Order', $order->id, [
            'from' => $oldStatus,
            'to' => $newStatus,
        ]);

        // Log to order status history (audit trail)
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'notes' => $request->get('notes'),
        ]);

        // Send order confirmation notification
        if ($newStatus === Order::STATUS_CONFIRMED && $order->user) {
            try {
                $order->user->notify(new OrderConfirmation($order));
            } catch (\Throwable $e) {
                // Don't fail the request if notification fails
            }
        }

        $order->load(['customer:id,name,email', 'items.product:id,name,sku', 'user:id,name']);

        return $this->successResponse($order, "Order status updated to {$newStatus}");
    }

    public function destroy(Order $order): JsonResponse
    {
        if (!in_array($order->status, [Order::STATUS_PENDING, Order::STATUS_CANCELLED])) {
            return $this->errorResponse('Can only delete pending or cancelled orders', 422);
        }

        DB::transaction(function () use ($order) {
            // Restore stock for pending orders
            if ($order->status === Order::STATUS_PENDING) {
                foreach ($order->items as $item) {
                    $item->product?->increment('stock', $item->quantity);
                }
            }

            $order->items()->delete();
            $order->delete();

            $order->customer->recalculateLifetimeValue();
        });

        ActivityLog::log('deleted', 'Order', $order->id);

        return $this->successResponse(null, 'Order deleted successfully');
    }

    /**
     * Get order status history (audit trail).
     */
    public function statusHistory(Order $order): JsonResponse
    {
        $history = $order->statusHistory()
            ->with('user:id,name')
            ->get();

        return $this->successResponse($history);
    }
}
