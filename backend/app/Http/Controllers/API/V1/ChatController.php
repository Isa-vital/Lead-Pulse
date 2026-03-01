<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Returns conversations (grouped by customer)
        $query = Customer::whereHas('chatMessages')
            ->withCount(['chatMessages as unread_count' => function ($q) {
                $q->where('is_read', false)->where('direction', 'inbound');
            }])
            ->withMax('chatMessages', 'created_at')
            ->with(['chatMessages' => function ($q) {
                $q->latest()->limit(1);
            }]);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                    ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        $query->orderByDesc('chat_messages_max_created_at');

        return $this->paginatedResponse($query->paginate($request->get('per_page', 20)));
    }

    public function messages(Customer $customer, Request $request): JsonResponse
    {
        $messages = $customer->chatMessages()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        // Mark inbound messages as read
        $customer->chatMessages()
            ->where('direction', 'inbound')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->paginatedResponse($messages);
    }

    public function send(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string'],
            'channel' => ['required', 'in:web,whatsapp,messenger'],
            'ticket_id' => ['nullable', 'exists:support_tickets,id'],
        ]);

        $chatMessage = ChatMessage::create([
            'customer_id' => $customer->id,
            'user_id' => $request->user()->id,
            'ticket_id' => $validated['ticket_id'] ?? null,
            'channel' => $validated['channel'],
            'direction' => 'outbound',
            'message' => $validated['message'],
            'is_read' => true,
        ]);

        $chatMessage->load('user:id,name');

        return $this->successResponse($chatMessage, 'Message sent successfully', 201);
    }

    public function receive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'message' => ['required', 'string'],
            'channel' => ['required', 'in:web,whatsapp,messenger'],
        ]);

        $chatMessage = ChatMessage::create([
            'customer_id' => $validated['customer_id'],
            'channel' => $validated['channel'],
            'direction' => 'inbound',
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        return $this->successResponse($chatMessage, 'Message received', 201);
    }

    public function unreadCount(): JsonResponse
    {
        $count = ChatMessage::where('direction', 'inbound')
            ->where('is_read', false)
            ->count();

        return $this->successResponse(['unread_count' => $count]);
    }
}
