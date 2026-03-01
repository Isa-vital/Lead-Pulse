<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Interaction;
use App\Models\ActivityLog;
use App\Notifications\TaskReminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InteractionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Interaction::with(['customer:id,name', 'user:id,name', 'lead:id,title']);

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->lead_id);
        }

        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        if ($request->filled('status')) {
            match ($request->status) {
                'upcoming' => $query->upcoming(),
                'overdue' => $query->overdue(),
                'completed' => $query->whereNotNull('completed_at'),
                default => null,
            };
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query->orderBy($sortBy, $sortDir);

        $interactions = $query->paginate($request->get('per_page', 20));

        return $this->paginatedResponse($interactions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'lead_id' => ['nullable', 'exists:leads,id'],
            'type' => ['required', 'string', 'in:' . implode(',', Interaction::TYPES)],
            'channel' => ['nullable', 'string', 'in:phone,email,in-person,chat,video'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ]);

        $validated['user_id'] = $request->user()->id;

        $interaction = Interaction::create($validated);
        $interaction->load(['customer:id,name', 'user:id,name', 'lead:id,title']);

        // Send task reminder if scheduled in the future
        if ($interaction->scheduled_at && $interaction->scheduled_at->isFuture()) {
            try {
                $request->user()->notify(new TaskReminder($interaction));
            } catch (\Throwable $e) {
            }
        }

        ActivityLog::log('created', 'Interaction', $interaction->id);

        return $this->successResponse($interaction, 'Interaction logged successfully', 201);
    }

    public function show(Interaction $interaction): JsonResponse
    {
        $interaction->load(['customer', 'user:id,name', 'lead']);

        return $this->successResponse($interaction);
    }

    public function update(Request $request, Interaction $interaction): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:' . implode(',', Interaction::TYPES)],
            'channel' => ['nullable', 'string', 'in:phone,email,in-person,chat,video'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ]);

        $interaction->update($validated);
        $interaction->load(['customer:id,name', 'user:id,name', 'lead:id,title']);

        return $this->successResponse($interaction, 'Interaction updated successfully');
    }

    /**
     * Mark a task/interaction as completed.
     */
    public function complete(Interaction $interaction): JsonResponse
    {
        $interaction->update(['completed_at' => now()]);
        $interaction->load(['customer:id,name', 'user:id,name']);

        return $this->successResponse($interaction, 'Marked as completed');
    }

    public function destroy(Interaction $interaction): JsonResponse
    {
        $interaction->delete();

        return $this->successResponse(null, 'Interaction deleted successfully');
    }
}
