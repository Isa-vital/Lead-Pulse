<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['customer:id,name,email', 'assignee:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'ilike', "%{$search}%")
                    ->orWhere('subject', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'in:general,billing,technical,shipping,product'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'channel' => ['nullable', 'string', 'max:50'],
        ]);

        $validated['status'] = 'open';
        $validated['sla_hours'] = match ($validated['priority']) {
            'urgent' => 2,
            'high' => 8,
            'medium' => 24,
            'low' => 48,
        };

        $ticket = SupportTicket::create($validated);
        $ticket->load(['customer:id,name,email', 'assignee:id,name']);

        ActivityLog::log('created', 'SupportTicket', $ticket->id);

        return $this->successResponse($ticket, 'Support ticket created successfully', 201);
    }

    public function show(SupportTicket $supportTicket): JsonResponse
    {
        $supportTicket->load([
            'customer',
            'assignee',
            'order',
            'replies' => function ($q) {
                $q->with('user:id,name')->latest();
            },
        ]);

        return $this->successResponse($supportTicket);
    }

    public function update(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:open,in_progress,waiting,resolved,closed'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'category' => ['sometimes', 'in:general,billing,technical,shipping,product'],
        ]);

        if (isset($validated['status']) && $validated['status'] === 'resolved' && !$supportTicket->resolved_at) {
            $validated['resolved_at'] = now();
        }

        if (isset($validated['assigned_to']) && !$supportTicket->first_response_at) {
            $validated['first_response_at'] = now();
        }

        $supportTicket->update($validated);

        ActivityLog::log('updated', 'SupportTicket', $supportTicket->id);

        return $this->successResponse($supportTicket->fresh()->load(['customer:id,name,email', 'assignee:id,name']), 'Ticket updated successfully');
    }

    public function destroy(SupportTicket $supportTicket): JsonResponse
    {
        ActivityLog::log('deleted', 'SupportTicket', $supportTicket->id);
        $supportTicket->delete();

        return $this->successResponse(null, 'Ticket deleted successfully');
    }

    public function reply(Request $request, SupportTicket $supportTicket): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        $validated['ticket_id'] = $supportTicket->id;
        $validated['user_id'] = $request->user()->id;

        $reply = TicketReply::create($validated);

        if (!$supportTicket->first_response_at) {
            $supportTicket->update(['first_response_at' => now()]);
        }

        if ($supportTicket->status === 'open') {
            $supportTicket->update(['status' => 'in_progress']);
        }

        $reply->load('user:id,name');

        return $this->successResponse($reply, 'Reply added successfully', 201);
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total' => SupportTicket::count(),
            'open' => SupportTicket::where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'waiting' => SupportTicket::where('status', 'waiting')->count(),
            'resolved' => SupportTicket::where('status', 'resolved')->count(),
            'overdue' => SupportTicket::overdue()->count(),
            'avg_resolution_hours' => round(
                SupportTicket::whereNotNull('resolved_at')
                    ->selectRaw('AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours')
                    ->value('avg_hours') ?? 0,
                1
            ),
        ];

        return $this->successResponse($stats);
    }
}
