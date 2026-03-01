<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user (admin only)
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:admin,manager,sales_rep,support'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $user->assignRole($validated['role']);

        return $this->successResponse([
            'user' => $this->formatUser($user),
        ], 'User registered successfully', 201);
    }

    /**
     * Login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return $this->errorResponse('Your account has been deactivated.', 403);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Create token
        $token = $user->createToken('api-token')->plainTextToken;

        return $this->successResponse([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return $this->successResponse([
            'user' => $this->formatUser($user->fresh()),
        ], 'Profile updated successfully');
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        return $this->successResponse(null, 'Password changed successfully');
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
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
        ];
    }
}
