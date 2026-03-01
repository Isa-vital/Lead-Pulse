<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\UserController;
use App\Http\Controllers\API\V1\CustomerController;
use App\Http\Controllers\API\V1\DashboardController;
use App\Http\Controllers\API\V1\ProductController;
use App\Http\Controllers\API\V1\CategoryController;
use App\Http\Controllers\API\V1\OrderController;
use App\Http\Controllers\API\V1\LeadController;
use App\Http\Controllers\API\V1\InteractionController;
use App\Http\Controllers\API\V1\ReportController;
use App\Http\Controllers\API\V1\SettingController;

use App\Http\Controllers\API\V1\SearchController;
use App\Http\Controllers\API\V1\InvoiceController;
use App\Http\Controllers\API\V1\ImportExportController;
use App\Http\Controllers\API\V1\NotificationController;
use App\Http\Controllers\API\V1\EmailTemplateController;
use App\Http\Controllers\API\V1\SupportTicketController;
use App\Http\Controllers\API\V1\ReturnController;
use App\Http\Controllers\API\V1\CouponController;
use App\Http\Controllers\API\V1\LoyaltyController;
use App\Http\Controllers\API\V1\CampaignController;
use App\Http\Controllers\API\V1\CartController;
use App\Http\Controllers\API\V1\AutomationController;
use App\Http\Controllers\API\V1\SegmentController;
use App\Http\Controllers\API\V1\ChatController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Global Search
    Route::get('/search', [SearchController::class, 'search']);

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::get('/customers/{customer}/timeline', [CustomerController::class, 'timeline']);
    Route::get('/customer-sources', [CustomerController::class, 'sources']);
    Route::get('/customer-tags', [CustomerController::class, 'tags']);

    // Products & Categories
    Route::apiResource('products', ProductController::class);
    Route::apiResource('categories', CategoryController::class)->except(['show']);

    // Orders
    Route::apiResource('orders', OrderController::class);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::get('/orders/{order}/invoice', [InvoiceController::class, 'download']);
    Route::get('/orders/{order}/status-history', [OrderController::class, 'statusHistory']);

    // Leads & Pipeline
    Route::apiResource('leads', LeadController::class);
    Route::get('/pipeline/board', [LeadController::class, 'board']);
    Route::patch('/leads/{lead}/move', [LeadController::class, 'moveStage']);
    Route::get('/pipeline/stages', [LeadController::class, 'stages']);

    // Interactions / Communications
    Route::apiResource('interactions', InteractionController::class);
    Route::patch('/interactions/{interaction}/complete', [InteractionController::class, 'complete']);

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/revenue', [ReportController::class, 'revenue']);
        Route::get('/sales-performance', [ReportController::class, 'salesPerformance']);
        Route::get('/customers', [ReportController::class, 'customerAnalytics']);
        Route::get('/products', [ReportController::class, 'productPerformance']);
    });

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::get('/activity-log', [SettingController::class, 'activityLog']);

    // Import/Export
    Route::get('/export/customers', [ImportExportController::class, 'exportCustomers']);
    Route::get('/export/products', [ImportExportController::class, 'exportProducts']);
    Route::get('/export/orders', [ImportExportController::class, 'exportOrders']);
    Route::post('/import/customers', [ImportExportController::class, 'importCustomers']);
    Route::post('/import/products', [ImportExportController::class, 'importProducts']);

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });

    // Email Templates
    Route::apiResource('email-templates', EmailTemplateController::class);
    Route::post('/email-templates/{email_template}/preview', [EmailTemplateController::class, 'preview']);
    Route::post('/email-templates/{email_template}/duplicate', [EmailTemplateController::class, 'duplicate']);

    // Support Tickets
    Route::apiResource('support-tickets', SupportTicketController::class);
    Route::post('/support-tickets/{support_ticket}/reply', [SupportTicketController::class, 'reply']);
    Route::get('/support-ticket-stats', [SupportTicketController::class, 'stats']);

    // Returns & Refunds
    Route::apiResource('returns', ReturnController::class);
    Route::get('/return-stats', [ReturnController::class, 'stats']);

    // Coupons
    Route::apiResource('coupons', CouponController::class);

    // Loyalty Points
    Route::get('/loyalty', [LoyaltyController::class, 'index']);
    Route::post('/loyalty', [LoyaltyController::class, 'store']);
    Route::get('/loyalty/customers/{customer}', [LoyaltyController::class, 'customerBalance']);
    Route::get('/loyalty/leaderboard', [LoyaltyController::class, 'leaderboard']);
    Route::get('/loyalty/stats', [LoyaltyController::class, 'stats']);

    // Campaigns
    Route::apiResource('campaigns', CampaignController::class);
    Route::post('/campaigns/{campaign}/send', [CampaignController::class, 'send']);
    Route::get('/campaign-stats', [CampaignController::class, 'stats']);

    // Abandoned Carts
    Route::get('/carts', [CartController::class, 'index']);
    Route::get('/carts/{cart}', [CartController::class, 'show']);
    Route::patch('/carts/{cart}', [CartController::class, 'update']);
    Route::post('/carts/{cart}/remind', [CartController::class, 'sendReminder']);
    Route::get('/cart-stats', [CartController::class, 'stats']);

    // Automations
    Route::apiResource('automations', AutomationController::class);
    Route::patch('/automations/{automation}/toggle', [AutomationController::class, 'toggle']);
    Route::get('/automations/{automation}/logs', [AutomationController::class, 'logs']);
    Route::get('/automation-stats', [AutomationController::class, 'stats']);

    // Segments
    Route::apiResource('segments', SegmentController::class);
    Route::post('/segments/{segment}/recalculate', [SegmentController::class, 'recalculate']);
    Route::get('/segments/{segment}/customers', [SegmentController::class, 'customers']);
    Route::post('/segments/preview', [SegmentController::class, 'preview']);

    // Chat / Messaging
    Route::get('/chat', [ChatController::class, 'index']);
    Route::get('/chat/{customer}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/{customer}/send', [ChatController::class, 'send']);
    Route::post('/chat/receive', [ChatController::class, 'receive']);
    Route::get('/chat/unread-count', [ChatController::class, 'unreadCount']);
});
