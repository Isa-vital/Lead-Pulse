<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\PipelineStage;
use App\Models\ActivityLog;
use App\Models\User;
use App\Notifications\LeadAssigned;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lead::with(['customer:id,name,email,company', 'stage', 'assignee:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('name', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($request->filled('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('status')) {
            match ($request->status) {
                'open' => $query->open(),
                'won' => $query->won(),
                'lost' => $query->lost(),
                default => null,
            };
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['title', 'value', 'probability', 'expected_close', 'created_at'];

        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $leads = $query->paginate($request->get('per_page', 50));

        return $this->paginatedResponse($leads);
    }

    /**
     * Get leads grouped by pipeline stage (for Kanban board).
     */
    public function board(): JsonResponse
    {
        $stages = PipelineStage::ordered()
            ->with(['leads' => function ($q) {
                $q->open()
                    ->with(['customer:id,name,company', 'assignee:id,name'])
                    ->orderBy('created_at', 'desc');
            }])
            ->withCount(['leads' => function ($q) {
                $q->open();
            }])
            ->get();

        $data = $stages->map(fn($stage) => [
            'id' => $stage->id,
            'name' => $stage->name,
            'slug' => $stage->slug,
            'color' => $stage->color,
            'is_won' => $stage->is_won,
            'is_lost' => $stage->is_lost,
            'leads_count' => $stage->leads_count,
            'total_value' => $stage->leads->sum('value'),
            'leads' => $stage->leads->map(fn($lead) => [
                'id' => $lead->id,
                'title' => $lead->title,
                'value' => $lead->value,
                'probability' => $lead->probability,
                'weighted_value' => $lead->weighted_value,
                'expected_close' => $lead->expected_close?->toDateString(),
                'source' => $lead->source,
                'customer' => $lead->customer ? [
                    'id' => $lead->customer->id,
                    'name' => $lead->customer->name,
                    'company' => $lead->customer->company,
                ] : null,
                'assignee' => $lead->assignee ? [
                    'id' => $lead->assignee->id,
                    'name' => $lead->assignee->name,
                ] : null,
                'created_at' => $lead->created_at->toISOString(),
            ]),
        ]);

        return $this->successResponse($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'stage_id' => ['nullable', 'exists:pipeline_stages,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'value' => ['required', 'numeric', 'min:0'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close' => ['nullable', 'date'],
            'source' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        // Default to first pipeline stage
        if (!isset($validated['stage_id'])) {
            $validated['stage_id'] = PipelineStage::default()->first()?->id
                ?? PipelineStage::ordered()->first()?->id;
        }

        $validated['probability'] = $validated['probability'] ?? 10;
        $validated['assigned_to'] = $validated['assigned_to'] ?? $request->user()->id;

        $lead = Lead::create($validated);
        $lead->load(['customer:id,name,email,company', 'stage', 'assignee:id,name']);

        // Notify assignee
        if ($lead->assigned_to) {
            try {
                $assignee = User::find($lead->assigned_to);
                $assignee?->notify(new LeadAssigned($lead));
            } catch (\Throwable $e) {
            }
        }

        ActivityLog::log('created', 'Lead', $lead->id);

        return $this->successResponse($lead, 'Lead created successfully', 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        $lead->load([
            'customer',
            'stage',
            'assignee:id,name',
            'interactions' => function ($q) {
                $q->with('user:id,name')->latest()->limit(20);
            },
        ]);

        return $this->successResponse($lead);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'stage_id' => ['sometimes', 'exists:pipeline_stages,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close' => ['nullable', 'date'],
            'source' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'custom_fields' => ['nullable', 'array'],
        ]);

        $oldAssignee = $lead->assigned_to;
        $lead->update($validated);
        $lead->load(['customer:id,name,email,company', 'stage', 'assignee:id,name']);

        // Notify new assignee if changed
        if (isset($validated['assigned_to']) && $validated['assigned_to'] !== $oldAssignee && $lead->assigned_to) {
            try {
                $assignee = User::find($lead->assigned_to);
                $assignee?->notify(new LeadAssigned($lead));
            } catch (\Throwable $e) {
            }
        }

        ActivityLog::log('updated', 'Lead', $lead->id);

        return $this->successResponse($lead, 'Lead updated successfully');
    }

    /**
     * Move lead to a different pipeline stage (drag & drop).
     */
    public function moveStage(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'stage_id' => ['required', 'exists:pipeline_stages,id'],
        ]);

        $stage = PipelineStage::findOrFail($request->stage_id);

        if ($stage->is_won) {
            $lead->markAsWon();
        } elseif ($stage->is_lost) {
            $lead->markAsLost($request->get('lost_reason'));
        } else {
            $lead->update(['stage_id' => $stage->id]);
        }

        $lead->load(['customer:id,name,email,company', 'stage', 'assignee:id,name']);

        ActivityLog::log('stage_changed', 'Lead', $lead->id, [
            'stage' => $stage->name,
        ]);

        return $this->successResponse($lead, "Lead moved to {$stage->name}");
    }

    public function destroy(Lead $lead): JsonResponse
    {
        ActivityLog::log('deleted', 'Lead', $lead->id);
        $lead->delete();

        return $this->successResponse(null, 'Lead deleted successfully');
    }

    /**
     * Get pipeline stages for dropdowns.
     */
    public function stages(): JsonResponse
    {
        $stages = PipelineStage::ordered()->get();
        return $this->successResponse($stages);
    }
}
