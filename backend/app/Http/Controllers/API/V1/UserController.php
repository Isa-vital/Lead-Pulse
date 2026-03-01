<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->role($request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $users = $query->paginate($request->get('per_page', 15));

        $users->getCollection()->transform(fn($user) => $this->formatUser($user));

        return $this->paginatedResponse($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:admin,manager,sales_rep,support'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $user->assignRole($validated['role']);

        return $this->successResponse($this->formatUser($user), 'User created successfully', 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles');
        return $this->successResponse($this->formatUser($user));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['sometimes', 'string', 'in:admin,manager,sales_rep,support'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $role = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return $this->successResponse($this->formatUser($user->fresh()), 'User updated successfully');
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->errorResponse('You cannot delete your own account', 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->successResponse(null, 'User deleted successfully');
    }

    public function toggleActive(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->errorResponse('You cannot deactivate your own account', 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return $this->successResponse(
            $this->formatUser($user),
            $user->is_active ? 'User activated' : 'User deactivated'
        );
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'role' => $user->getRoleNames()->first(),
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
        ];
    }
}
