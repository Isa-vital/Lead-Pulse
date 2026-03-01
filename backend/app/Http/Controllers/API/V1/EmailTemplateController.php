<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('subject', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $templates = $query->orderBy('name')->paginate($request->get('per_page', 50));

        return $this->paginatedResponse($templates);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:email_templates,name'],
            'subject' => ['required', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string'],
            'is_active' => ['boolean'],
        ]);

        $template = EmailTemplate::create($validated);

        return $this->successResponse($template, 'Email template created', 201);
    }

    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return $this->successResponse($emailTemplate);
    }

    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:email_templates,name,' . $emailTemplate->id],
            'subject' => ['sometimes', 'string', 'max:500'],
            'body' => ['sometimes', 'string'],
            'variables' => ['nullable', 'array'],
            'variables.*' => ['string'],
            'is_active' => ['boolean'],
        ]);

        $emailTemplate->update($validated);

        return $this->successResponse($emailTemplate, 'Email template updated');
    }

    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->delete();

        return $this->successResponse(null, 'Email template deleted');
    }

    /**
     * Preview a template with sample data.
     */
    public function preview(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $sampleData = [];
        foreach ($emailTemplate->variables ?? [] as $var) {
            $sampleData[$var] = $request->get($var, "[{$var}]");
        }

        $rendered = $emailTemplate->render($sampleData);

        return $this->successResponse([
            'subject' => $rendered['subject'],
            'body' => $rendered['body'],
        ]);
    }

    /**
     * Duplicate a template.
     */
    public function duplicate(EmailTemplate $emailTemplate): JsonResponse
    {
        $copy = $emailTemplate->replicate();
        $copy->name = $emailTemplate->name . ' (Copy)';
        $copy->save();

        return $this->successResponse($copy, 'Template duplicated', 201);
    }
}
