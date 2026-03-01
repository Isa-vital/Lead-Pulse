<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');

        if ($request->boolean('roots_only', true)) {
            $query->roots();
        }

        if ($request->boolean('with_children')) {
            $query->with(['allChildren' => function ($q) {
                $q->withCount('products')->ordered();
            }]);
        }

        $categories = $query->ordered()->get();

        return $this->successResponse($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        $category = Category::create($validated);

        return $this->successResponse($category, 'Category created successfully', 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return $this->successResponse($category, 'Category updated successfully');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->count() > 0) {
            return $this->errorResponse('Cannot delete category with products', 422);
        }

        $category->delete();

        return $this->successResponse(null, 'Category deleted successfully');
    }
}
