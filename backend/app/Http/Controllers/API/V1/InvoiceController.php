<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function download(Order $order)
    {
        $order->load(['customer', 'items.product', 'user']);

        $pdf = Pdf::loadView('invoices.order', [
            'order' => $order,
            'company' => [
                'name' => 'Lead Pulse',
                'address' => 'Plot 25, Kampala Road, Kampala, Uganda',
                'phone' => '+256 700 000 000',
                'email' => 'info@leadpulse.com',
            ],
        ]);

        return $pdf->download("Invoice-{$order->order_number}.pdf");
    }
}
