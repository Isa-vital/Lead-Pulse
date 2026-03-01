<?php

namespace App\Notifications;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeadAssigned extends Notification
{
    use Queueable;

    public function __construct(public Lead $lead) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New Lead Assigned: {$this->lead->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("You have been assigned a new lead: {$this->lead->title}")
            ->line("Value: UGX " . number_format($this->lead->value, 0))
            ->line("Source: " . ucfirst($this->lead->source ?? 'N/A'))
            ->action('View Pipeline', url('/pipeline'))
            ->line('Good luck closing this deal!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lead_assigned',
            'lead_id' => $this->lead->id,
            'title' => $this->lead->title,
            'value' => $this->lead->value,
            'message' => "New lead assigned: {$this->lead->title}",
