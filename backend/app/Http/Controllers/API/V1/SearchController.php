<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Order;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:2']]);

        $query = $request->q;
        $limit = 5;

        $customers = Customer::where('name', 'ilike', "%{$query}%")
            ->orWhere('email', 'ilike', "%{$query}%")
            ->orWhere('company', 'ilike', "%{$query}%")
            ->orWhere('phone', 'ilike', "%{$query}%")
            ->limit($limit)
            ->get(['id', 'name', 'email', 'company']);

        $products = Product::where('name', 'ilike', "%{$query}%")
            ->orWhere('sku', 'ilike', "%{$query}%")
            ->limit($limit)
            ->get(['id', 'name', 'sku', 'price']);

        $orders = Order::where('order_number', 'ilike', "%{$query}%")
            ->limit($limit)
            ->get(['id', 'order_number', 'status', 'total', 'created_at']);

        $leads = Lead::where('title', 'ilike', "%{$query}%")
            ->limit($limit)
            ->get(['id', 'title', 'value']);

        return $this->successResponse([
            'customers' => $customers,
            'products' => $products,
            'orders' => $orders,
            'leads' => $leads,
        ]);
    }
}
