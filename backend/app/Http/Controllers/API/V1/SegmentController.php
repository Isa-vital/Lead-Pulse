<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Segment;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SegmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Segment::query();

        if ($request->filled('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $query->orderBy('created_at', 'desc');

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'rules' => ['required', 'array', 'min:1'],
            'rules.*.field' => ['required', 'string'],
            'rules.*.operator' => ['required', 'string'],
            'rules.*.value' => ['required'],
            'match_type' => ['required', 'in:all,any'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $segment = Segment::create($validated);
        $segment->recalculate();

        ActivityLog::log('created', 'Segment', $segment->id);

        return $this->successResponse($segment->fresh(), 'Segment created successfully', 201);
    }

    public function show(Segment $segment): JsonResponse
    {
        return $this->successResponse($segment);
    }

    public function update(Request $request, Segment $segment): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'rules' => ['sometimes', 'array', 'min:1'],
            'rules.*.field' => ['required', 'string'],
            'rules.*.operator' => ['required', 'string'],
            'rules.*.value' => ['required'],
            'match_type' => ['sometimes', 'in:all,any'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $segment->update($validated);
        $segment->recalculate();

        ActivityLog::log('updated', 'Segment', $segment->id);

        return $this->successResponse($segment->fresh(), 'Segment updated successfully');
    }

    public function destroy(Segment $segment): JsonResponse
    {
        ActivityLog::log('deleted', 'Segment', $segment->id);
        $segment->delete();

        return $this->successResponse(null, 'Segment deleted successfully');
    }

    public function recalculate(Segment $segment): JsonResponse
    {
        $segment->recalculate();

        return $this->successResponse($segment->fresh(), 'Segment recalculated successfully');
    }

    public function customers(Segment $segment, Request $request): JsonResponse
    {
        $customers = $segment->buildCustomerQuery()
            ->select(['id', 'name', 'email', 'company', 'tier', 'lifetime_value', 'points_balance'])
            ->paginate($request->get('per_page', 15));

        return $this->paginatedResponse($customers);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'rules' => ['required', 'array', 'min:1'],
            'match_type' => ['required', 'in:all,any'],
        ]);

        $segment = new Segment([
            'rules' => $request->rules,
            'match_type' => $request->match_type,
        ]);

        $count = $segment->buildCustomerQuery()->count();

        return $this->successResponse(['customer_count' => $count]);
    }
}
