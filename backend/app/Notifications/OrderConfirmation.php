<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderConfirmation extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Order #{$this->order->order_number} Confirmed")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your order #{$this->order->order_number} has been confirmed.")
            ->line("Order Total: UGX " . number_format($this->order->total, 0))
            ->action('View Order', url('/orders'))
            ->line('Thank you for your business!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'order_confirmation',
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'total' => $this->order->total,
            'message' => "Order #{$this->order->order_number} confirmed (UGX " . number_format($this->order->total, 0) . ")",
