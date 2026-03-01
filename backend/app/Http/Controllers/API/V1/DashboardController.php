<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Order;
use App\Models\Product;
use App\Models\Interaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $period = $request->get('period', 30); // days

        return $this->successResponse([
            'kpis' => $this->getKPIs($period),
            'revenue_chart' => $this->getRevenueChart($period),
            'order_status' => $this->getOrderStatusBreakdown(),
            'pipeline_summary' => $this->getPipelineSummary(),
            'recent_orders' => $this->getRecentOrders(),
            'recent_leads' => $this->getRecentLeads(),
            'top_customers' => $this->getTopCustomers(),
            'upcoming_tasks' => $this->getUpcomingTasks(),
        ]);
    }

    private function getKPIs(int $period): array
    {
        $now = now();
        $startDate = $now->copy()->subDays($period);
        $previousStart = $startDate->copy()->subDays($period);

        // Current period revenue
        $currentRevenue = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', $startDate)
            ->sum('total');

        // Previous period revenue (for comparison)
        $previousRevenue = Order::where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [$previousStart, $startDate])
            ->sum('total');

        $revenueChange = $previousRevenue > 0
            ? round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 1)
            : 0;

        // Orders
        $currentOrders = Order::where('created_at', '>=', $startDate)->count();
        $previousOrders = Order::whereBetween('created_at', [$previousStart, $startDate])->count();
        $ordersChange = $previousOrders > 0
            ? round((($currentOrders - $previousOrders) / $previousOrders) * 100, 1)
            : 0;

        // New customers
        $currentCustomers = Customer::where('created_at', '>=', $startDate)->count();
        $previousCustomers = Customer::whereBetween('created_at', [$previousStart, $startDate])->count();
        $customersChange = $previousCustomers > 0
            ? round((($currentCustomers - $previousCustomers) / $previousCustomers) * 100, 1)
            : 0;

        // Active leads
        $activeLeads = Lead::open()->count();
        $pipelineValue = Lead::open()->sum(DB::raw('value * probability / 100'));

        // Conversion rate
        $totalLeads = Lead::where('created_at', '>=', $startDate)->count();
        $wonLeads = Lead::won()->where('won_at', '>=', $startDate)->count();
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 1) : 0;

        return [
            'revenue' => [
                'value' => round($currentRevenue, 2),
                'change' => $revenueChange,
                'period' => $period,
            ],
            'orders' => [
                'value' => $currentOrders,
                'change' => $ordersChange,
            ],
            'new_customers' => [
                'value' => $currentCustomers,
                'change' => $customersChange,
            ],
            'active_leads' => [
                'value' => $activeLeads,
                'pipeline_value' => round($pipelineValue, 2),
            ],
            'conversion_rate' => [
                'value' => $conversionRate,
                'won' => $wonLeads,
                'total' => $totalLeads,
            ],
            'total_customers' => Customer::count(),
            'total_products' => Product::active()->count(),
            'low_stock_products' => Product::active()->lowStock()->count(),
        ];
    }

    private function getRevenueChart(int $period): array
    {
        $data = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->subDays($period))
            ->selectRaw("DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $data->map(fn($row) => [
            'date' => $row->date,
            'revenue' => round($row->revenue, 2),
            'orders' => $row->orders,
        ])->toArray();
    }

    private function getOrderStatusBreakdown(): array
    {
        return Order::selectRaw("status, COUNT(*) as count, SUM(total) as total")
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'count' => $row->count,
                'total' => round($row->total, 2),
            ])->toArray();
    }

    private function getPipelineSummary(): array
    {
        return Lead::open()
            ->join('pipeline_stages', 'leads.stage_id', '=', 'pipeline_stages.id')
            ->selectRaw("pipeline_stages.name, pipeline_stages.color, COUNT(leads.id) as count, SUM(leads.value) as total_value")
            ->groupBy('pipeline_stages.name', 'pipeline_stages.color', 'pipeline_stages.sort_order')
            ->orderBy('pipeline_stages.sort_order')
            ->get()
            ->map(fn($row) => [
                'stage' => $row->name,
                'color' => $row->color,
                'count' => $row->count,
                'total_value' => round($row->total_value, 2),
            ])->toArray();
    }

    private function getRecentOrders(): array
    {
        return Order::with('customer:id,name,email')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer' => $order->customer?->name,
                'total' => $order->total,
                'status' => $order->status,
                'created_at' => $order->created_at->toISOString(),
            ])->toArray();
    }

    private function getRecentLeads(): array
    {
        return Lead::with(['customer:id,name', 'stage:id,name,color', 'assignee:id,name'])
            ->open()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($lead) => [
                'id' => $lead->id,
                'title' => $lead->title,
                'customer' => $lead->customer?->name,
                'stage' => $lead->stage?->name,
                'stage_color' => $lead->stage?->color,
                'value' => $lead->value,
                'assignee' => $lead->assignee?->name,
                'expected_close' => $lead->expected_close?->toDateString(),
            ])->toArray();
    }

    private function getTopCustomers(): array
    {
        return Customer::orderByDesc('lifetime_value')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'company' => $c->company,
                'lifetime_value' => $c->lifetime_value,
                'order_count' => $c->orders()->count(),
            ])->toArray();
    }

    private function getUpcomingTasks(): array
    {
        return Interaction::with(['customer:id,name', 'user:id,name'])
            ->upcoming()
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'type' => $i->type,
                'subject' => $i->subject,
                'customer' => $i->customer?->name,
                'assignee' => $i->user?->name,
                'scheduled_at' => $i->scheduled_at->toISOString(),
            ])->toArray();
    }
}
