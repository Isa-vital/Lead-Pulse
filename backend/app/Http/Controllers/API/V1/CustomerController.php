<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        // Full-text search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filters
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('tag')) {
            $query->withTag($request->tag);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('min_value')) {
            $query->where('lifetime_value', '>=', $request->min_value);
        }

        if ($request->filled('max_value')) {
            $query->where('lifetime_value', '<=', $request->max_value);
        }

        if ($request->filled('tier')) {
            $query->where('tier', $request->tier);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['name', 'email', 'company', 'lifetime_value', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $customers = $query->paginate($request->get('per_page', 15));

        return $this->paginatedResponse($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'array'],
            'address.street' => ['nullable', 'string'],
            'address.city' => ['nullable', 'string'],
            'address.state' => ['nullable', 'string'],
            'address.zip' => ['nullable', 'string'],
            'address.country' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'source' => ['nullable', 'string', 'max:100'],
            'custom_fields' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'tier' => ['nullable', 'string', 'in:regular,bronze,silver,gold,platinum'],
        ]);

        $customer = Customer::create($validated);

        ActivityLog::log('created', 'Customer', $customer->id);

        return $this->successResponse($customer, 'Customer created successfully', 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['orders' => function ($q) {
            $q->latest()->limit(10);
        }, 'leads' => function ($q) {
            $q->with('stage')->latest()->limit(10);
        }, 'interactions' => function ($q) {
            $q->with('user')->latest()->limit(20);
        }]);

        $customer->append(['order_count']);

        return $this->successResponse($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'source' => ['nullable', 'string', 'max:100'],
            'custom_fields' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'tier' => ['nullable', 'string', 'in:regular,bronze,silver,gold,platinum'],
        ]);

        $changes = $customer->getDirty();
        $customer->update($validated);

        ActivityLog::log('updated', 'Customer', $customer->id, $changes);

        return $this->successResponse($customer->fresh(), 'Customer updated successfully');
    }

    public function destroy(Customer $customer): JsonResponse
    {
        ActivityLog::log('deleted', 'Customer', $customer->id);
        $customer->delete();

        return $this->successResponse(null, 'Customer deleted successfully');
    }

    /**
     * Get customer activity timeline
     */
    public function timeline(Customer $customer): JsonResponse
    {
        $interactions = $customer->interactions()
            ->with('user')
            ->latest()
            ->paginate(20);

        return $this->paginatedResponse($interactions);
    }

    /**
     * Get available customer sources for filters
     */
    public function sources(): JsonResponse
    {
        $sources = Customer::whereNotNull('source')
            ->distinct()
            ->pluck('source');

        return $this->successResponse($sources);
    }

    /**
     * Get all unique tags for filters
     */
    public function tags(): JsonResponse
    {
        $tags = Customer::whereRaw("jsonb_array_length(tags::jsonb) > 0")
            ->selectRaw("DISTINCT jsonb_array_elements_text(tags::jsonb) as tag")
            ->pluck('tag');

        return $this->successResponse($tags);
    }
}
