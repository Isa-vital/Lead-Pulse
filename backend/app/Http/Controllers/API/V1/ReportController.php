<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function revenue(Request $request): JsonResponse
    {
        $period = $request->get('period', 30);
        $groupBy = $request->get('group_by', 'day'); // day, week, month

        $format = match ($groupBy) {
            'week' => 'YYYY-IW',
            'month' => 'YYYY-MM',
            default => 'YYYY-MM-DD',
        };

        $data = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->subDays($period))
            ->selectRaw("to_char(created_at, '{$format}') as period, SUM(total) as revenue, COUNT(*) as orders, AVG(total) as avg_order_value")
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $totals = Order::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->subDays($period))
            ->selectRaw('SUM(total) as total_revenue, COUNT(*) as total_orders, AVG(total) as avg_value')
            ->first();

        return $this->successResponse([
            'chart' => $data,
            'summary' => [
                'total_revenue' => round($totals->total_revenue ?? 0, 2),
                'total_orders' => $totals->total_orders ?? 0,
                'avg_order_value' => round($totals->avg_value ?? 0, 2),
            ],
        ]);
    }

    public function salesPerformance(Request $request): JsonResponse
    {
        $period = $request->get('period', 30);
        $startDate = now()->subDays($period);

        // Sales reps performance
        $reps = DB::table('orders')
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->where('orders.created_at', '>=', $startDate)
            ->where('orders.status', '!=', 'cancelled')
            ->whereNull('orders.deleted_at')
            ->selectRaw('users.id, users.name, COUNT(orders.id) as orders_count, SUM(orders.total) as revenue')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('revenue')
            ->get();

        // Leads by assignee
        $leadPerformance = DB::table('leads')
            ->join('users', 'leads.assigned_to', '=', 'users.id')
            ->where('leads.created_at', '>=', $startDate)
            ->whereNull('leads.deleted_at')
            ->selectRaw('users.id, users.name, COUNT(leads.id) as total_leads, SUM(CASE WHEN leads.won_at IS NOT NULL THEN 1 ELSE 0 END) as won_leads, SUM(leads.value) as pipeline_value')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('pipeline_value')
            ->get();

        return $this->successResponse([
            'sales_reps' => $reps,
            'lead_performance' => $leadPerformance,
        ]);
    }

    public function customerAnalytics(Request $request): JsonResponse
    {
        $period = $request->get('period', 30);
        $startDate = now()->subDays($period);

        // New customers over time
        $newCustomers = Customer::where('created_at', '>=', $startDate)
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top sources
        $sources = Customer::whereNotNull('source')
            ->selectRaw('source, COUNT(*) as count')
            ->groupBy('source')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Customer segments by LTV
        $segments = [
            ['label' => 'High Value ($1000+)', 'count' => Customer::where('lifetime_value', '>=', 1000)->count()],
            ['label' => 'Medium Value ($100-999)', 'count' => Customer::whereBetween('lifetime_value', [100, 999.99])->count()],
            ['label' => 'Low Value ($1-99)', 'count' => Customer::whereBetween('lifetime_value', [1, 99.99])->count()],
            ['label' => 'No Purchases', 'count' => Customer::where('lifetime_value', '<=', 0)->count()],
        ];

        return $this->successResponse([
            'new_customers_chart' => $newCustomers,
            'top_sources' => $sources,
            'segments' => $segments,
            'total_customers' => Customer::count(),
            'avg_lifetime_value' => round(Customer::avg('lifetime_value'), 2),
        ]);
    }

    public function productPerformance(Request $request): JsonResponse
    {
        $period = $request->get('period', 30);
        $startDate = now()->subDays($period);

        // Top selling products
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.created_at', '>=', $startDate)
            ->where('orders.status', '!=', 'cancelled')
            ->whereNull('orders.deleted_at')
            ->selectRaw('products.id, products.name, products.sku, SUM(order_items.quantity) as units_sold, SUM(order_items.total) as revenue')
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        // Low stock
        $lowStock = Product::active()
            ->lowStock()
            ->select('id', 'name', 'sku', 'stock', 'low_stock_threshold')
            ->orderBy('stock')
            ->limit(10)
            ->get();

        // Category breakdown
        $categories = DB::table('products')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('products.is_active', true)
            ->whereNull('products.deleted_at')
            ->selectRaw("COALESCE(categories.name, 'Uncategorized') as category, COUNT(products.id) as count, AVG(products.price) as avg_price")
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->get();

        return $this->successResponse([
            'top_products' => $topProducts,
            'low_stock' => $lowStock,
            'categories' => $categories,
        ]);
    }
}
