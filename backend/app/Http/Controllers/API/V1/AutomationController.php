<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Automation;
use App\Models\AutomationLog;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Automation::withCount('logs');

        if ($request->filled('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->filled('trigger_type')) {
            $query->where('trigger_type', $request->trigger_type);
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'trigger_type' => ['required', 'in:cart_abandoned,order_placed,customer_created,customer_inactive,lead_stage_changed,ticket_created'],
            'action_type' => ['required', 'in:send_email,send_sms,assign_tag,update_tier,create_task,send_notification'],
            'conditions' => ['nullable', 'array'],
            'action_config' => ['nullable', 'array'],
            'delay_minutes' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $automation = Automation::create($validated);

        ActivityLog::log('created', 'Automation', $automation->id);

        return $this->successResponse($automation, 'Automation created successfully', 201);
    }

    public function show(Automation $automation): JsonResponse
    {
        $automation->loadCount('logs');
        $automation->load(['logs' => function ($q) {
            $q->with('customer:id,name')->latest()->limit(20);
        }]);

        return $this->successResponse($automation);
    }

    public function update(Request $request, Automation $automation): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'trigger_type' => ['sometimes', 'in:cart_abandoned,order_placed,customer_created,customer_inactive,lead_stage_changed,ticket_created'],
            'action_type' => ['sometimes', 'in:send_email,send_sms,assign_tag,update_tier,create_task,send_notification'],
            'conditions' => ['nullable', 'array'],
            'action_config' => ['nullable', 'array'],
            'delay_minutes' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $automation->update($validated);

        ActivityLog::log('updated', 'Automation', $automation->id);

        return $this->successResponse($automation->fresh(), 'Automation updated successfully');
    }

    public function destroy(Automation $automation): JsonResponse
    {
        ActivityLog::log('deleted', 'Automation', $automation->id);
        $automation->delete();

        return $this->successResponse(null, 'Automation deleted successfully');
    }

    public function toggle(Automation $automation): JsonResponse
    {
        $automation->update(['is_active' => !$automation->is_active]);

        $status = $automation->is_active ? 'activated' : 'deactivated';

        return $this->successResponse($automation->fresh(), "Automation {$status} successfully");
    }

    public function logs(Automation $automation, Request $request): JsonResponse
    {
        $query = $automation->logs()->with('customer:id,name,email')->latest();

        return $this->paginatedResponse($query->paginate($request->get('per_page', 20)));
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total' => Automation::count(),
            'active' => Automation::where('is_active', true)->count(),
            'total_executions' => Automation::sum('execution_count'),
            'successful_executions' => AutomationLog::where('status', 'success')->count(),
            'failed_executions' => AutomationLog::where('status', 'failed')->count(),
        ];

        return $this->successResponse($stats);
    }
}
