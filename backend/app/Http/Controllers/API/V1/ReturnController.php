<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ReturnRequest::with(['customer:id,name,email', 'order:id,order_number', 'processedBy:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('return_number', 'ilike', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_dir', 'desc'));

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'reason' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.amount' => ['required', 'numeric', 'min:0'],
        ]);

        $validated['status'] = 'requested';
        $validated['refund_amount'] = collect($validated['items'])->sum(fn($item) => $item['quantity'] * $item['amount']);

        $return = ReturnRequest::create($validated);
        $return->load(['customer:id,name,email', 'order:id,order_number']);

        ActivityLog::log('created', 'ReturnRequest', $return->id);

        return $this->successResponse($return, 'Return request created successfully', 201);
    }

    public function show(ReturnRequest $return): JsonResponse
    {
        $return->load(['customer', 'order.items.product', 'processedBy']);

        return $this->successResponse($return);
    }

    public function update(Request $request, ReturnRequest $return): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:requested,approved,received,refunded,rejected'],
            'refund_method' => ['nullable', 'string', 'max:50'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        $validated['processed_by'] = $request->user()->id;

        $statusDateMap = [
            'approved' => 'approved_at',
            'received' => 'received_at',
            'refunded' => 'refunded_at',
        ];

        if (isset($statusDateMap[$validated['status']])) {
            $validated[$statusDateMap[$validated['status']]] = now();
        }

        $return->update($validated);

        ActivityLog::log('updated', 'ReturnRequest', $return->id);

        return $this->successResponse($return->fresh()->load(['customer:id,name,email', 'order:id,order_number']), 'Return updated successfully');
    }

    public function destroy(ReturnRequest $return): JsonResponse
    {
        ActivityLog::log('deleted', 'ReturnRequest', $return->id);
        $return->delete();

        return $this->successResponse(null, 'Return request deleted successfully');
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total' => ReturnRequest::count(),
            'requested' => ReturnRequest::where('status', 'requested')->count(),
            'approved' => ReturnRequest::where('status', 'approved')->count(),
            'refunded' => ReturnRequest::where('status', 'refunded')->count(),
            'rejected' => ReturnRequest::where('status', 'rejected')->count(),
            'total_refunded' => ReturnRequest::where('status', 'refunded')->sum('refund_amount'),
        ];

        return $this->successResponse($stats);
    }
}
