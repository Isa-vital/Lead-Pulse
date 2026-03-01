<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category:id,name');

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowed = ['name', 'price', 'stock', 'created_at', 'sku'];

        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $products = $query->paginate($request->get('per_page', 15));

        return $this->paginatedResponse($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'images' => ['nullable', 'array'],
            'attributes' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['cost'] = $validated['cost'] ?? 0;
        $validated['low_stock_threshold'] = $validated['low_stock_threshold'] ?? 5;

        $product = Product::create($validated);
        $product->load('category:id,name');

        ActivityLog::log('created', 'Product', $product->id);

        return $this->successResponse($product, 'Product created successfully', 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'orderItems' => function ($q) {
            $q->with('order:id,order_number,created_at')->latest()->limit(10);
        }]);

        return $this->successResponse($product);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'sku' => ['sometimes', 'string', 'max:100', 'unique:products,sku,' . $product->id],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'images' => ['nullable', 'array'],
            'attributes' => ['nullable', 'array'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $product->update($validated);
        $product->load('category:id,name');

        ActivityLog::log('updated', 'Product', $product->id);

        return $this->successResponse($product, 'Product updated successfully');
    }

    public function destroy(Product $product): JsonResponse
    {
        ActivityLog::log('deleted', 'Product', $product->id);
        $product->delete();

        return $this->successResponse(null, 'Product deleted successfully');
    }
}
