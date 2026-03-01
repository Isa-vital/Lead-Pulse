<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Campaign::with(['createdBy:id,name']);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $query->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_dir', 'desc'));

        return $this->paginatedResponse($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:email,sms'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'email_template_id' => ['nullable', 'exists:email_templates,id'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'segment_filters' => ['nullable', 'array'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['status'] = 'draft';

        $campaign = Campaign::create($validated);
        $campaign->load('createdBy:id,name');

        ActivityLog::log('created', 'Campaign', $campaign->id);

        return $this->successResponse($campaign, 'Campaign created successfully', 201);
    }

    public function show(Campaign $campaign): JsonResponse
    {
        $campaign->load(['createdBy:id,name', 'emailTemplate', 'recipients' => function ($q) {
            $q->with('customer:id,name,email')->latest()->limit(100);
        }]);

        $campaign->open_rate = $campaign->openRate;
        $campaign->click_rate = $campaign->clickRate;

        return $this->successResponse($campaign);
    }

    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        if (!in_array($campaign->status, ['draft', 'scheduled'])) {
            return $this->errorResponse('Cannot edit a campaign that has been sent', 422);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:email,sms'],
            'subject' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'email_template_id' => ['nullable', 'exists:email_templates,id'],
            'scheduled_at' => ['nullable', 'date'],
            'segment_filters' => ['nullable', 'array'],
        ]);

        $campaign->update($validated);

        ActivityLog::log('updated', 'Campaign', $campaign->id);

        return $this->successResponse($campaign->fresh()->load('createdBy:id,name'), 'Campaign updated successfully');
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        ActivityLog::log('deleted', 'Campaign', $campaign->id);
        $campaign->delete();

        return $this->successResponse(null, 'Campaign deleted successfully');
    }

    public function send(Campaign $campaign): JsonResponse
    {
        if ($campaign->status !== 'draft' && $campaign->status !== 'scheduled') {
            return $this->errorResponse('Campaign cannot be sent in its current status', 422);
        }

        // Build recipient list from segment filters or all active customers
        $customerQuery = Customer::active();

        if (!empty($campaign->segment_filters)) {
            foreach ($campaign->segment_filters as $filter) {
                $field = $filter['field'] ?? '';
                $operator = $filter['operator'] ?? '=';
                $value = $filter['value'] ?? '';

                if ($field === 'tier') $customerQuery->where('tier', $operator, $value);
                if ($field === 'source') $customerQuery->where('source', $operator, $value);
                if ($field === 'min_orders') $customerQuery->has('orders', '>=', (int) $value);
            }
        }

        $customers = $customerQuery->get(['id']);

        $recipients = $customers->map(fn($customer) => [
            'campaign_id' => $campaign->id,
            'customer_id' => $customer->id,
            'status' => 'sent',
            'sent_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        CampaignRecipient::insert($recipients);

        $campaign->update([
            'status' => 'sent',
            'sent_at' => now(),
            'total_recipients' => count($recipients),
            'sent_count' => count($recipients),
        ]);

        ActivityLog::log('sent', 'Campaign', $campaign->id);

        return $this->successResponse($campaign->fresh(), 'Campaign sent successfully');
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total' => Campaign::count(),
            'draft' => Campaign::where('status', 'draft')->count(),
            'sent' => Campaign::where('status', 'sent')->count(),
            'total_sent' => Campaign::sum('sent_count'),
            'total_opened' => Campaign::sum('open_count'),
            'total_clicked' => Campaign::sum('click_count'),
            'avg_open_rate' => round(
                Campaign::where('sent_count', '>', 0)
                    ->selectRaw('AVG(open_count::float / sent_count * 100) as rate')
                    ->value('rate') ?? 0,
                1
            ),
            'avg_click_rate' => round(
                Campaign::where('sent_count', '>', 0)
                    ->selectRaw('AVG(click_count::float / sent_count * 100) as rate')
                    ->value('rate') ?? 0,
                1
            ),
        ];

        return $this->successResponse($stats);
    }
}
