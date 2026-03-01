<?php

namespace App\Notifications;

use App\Models\Interaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskReminder extends Notification
{
    use Queueable;

    public function __construct(public Interaction $interaction) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Task Reminder: {$this->interaction->subject}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Reminder: You have a scheduled {$this->interaction->type}.")
            ->line("Subject: {$this->interaction->subject}")
            ->when($this->interaction->scheduled_at, function ($mail) {
                $mail->line("Scheduled: " . $this->interaction->scheduled_at->format('M d, Y g:i A'));
            })
            ->action('View Communications', url('/communications'))
            ->line('Don\'t forget to follow up!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_reminder',
            'interaction_id' => $this->interaction->id,
            'subject' => $this->interaction->subject,
            'message' => "Task reminder: {$this->interaction->subject}",
