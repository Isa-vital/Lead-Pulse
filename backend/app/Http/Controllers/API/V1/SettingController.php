<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings grouped.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group')->map(function ($items) {
            return $items->pluck('value', 'key');
        });

        return $this->successResponse($settings);
    }

    /**
     * Update settings in bulk.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
            'settings.*.group' => ['nullable', 'string'],
        ]);

        foreach ($validated['settings'] as $setting) {
            Setting::setValue(
                $setting['key'],
                $setting['value'],
                $setting['group'] ?? 'general'
            );
        }

        ActivityLog::log('updated', 'Setting', null);

        // Return fresh settings
        $settings = Setting::all()->groupBy('group')->map(function ($items) {
            return $items->pluck('value', 'key');
        });

        return $this->successResponse($settings, 'Settings updated successfully');
    }

    /**
     * Get activity log.
     */
    public function activityLog(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user:id,name')
            ->latest();

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        $logs = $query->paginate($request->get('per_page', 25));

        return $this->paginatedResponse($logs);
    }
}
