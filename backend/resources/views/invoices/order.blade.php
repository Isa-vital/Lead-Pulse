<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $order->order_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            overflow: hidden;
        }

        .company-info {
            float: left;
            width: 50%;
        }

        .invoice-info {
            float: right;
            width: 50%;
            text-align: right;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
        }

        .company-details {
            color: #666;
            font-size: 11px;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
        }

        .invoice-number {
            font-size: 14px;
            color: #666;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .status-confirmed {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-processing {
            background: #e0e7ff;
            color: #3730a3;
        }

        .status-shipped {
            background: #ede9fe;
            color: #5b21b6;
        }

        .status-delivered {
            background: #d1fae5;
            color: #065f46;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .status-refunded {
            background: #f3f4f6;
            color: #374151;
        }

        .addresses {
            margin-bottom: 30px;
            overflow: hidden;
        }

        .bill-to,
        .ship-to {
            float: left;
            width: 50%;
        }

        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            color: #999;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }

        .customer-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        th {
            background: #4f46e5;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        th:last-child,
        td:last-child {
            text-align: right;
        }

        td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
        }

        tr:nth-child(even) {
            background: #f9fafb;
        }

        .sku {
            font-size: 10px;
            color: #999;
        }

        .totals {
            float: right;
            width: 280px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            overflow: hidden;
        }

        .total-label {
            float: left;
            color: #666;
        }

        .total-value {
            float: right;
            font-weight: 500;
        }

        .grand-total {
            border-top: 2px solid #4f46e5;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 16px;
        }

        .grand-total .total-label,
        .grand-total .total-value {
            font-weight: bold;
            color: #4f46e5;
        }

        .footer {
            clear: both;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 10px;
        }

        .notes {
            clear: both;
            margin-top: 30px;
            padding: 15px;
            background: #f9fafb;
            border-radius: 5px;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>

<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">{{ $company['name'] }}</div>
                <div class="company-details">
                    {{ $company['address'] }}<br>
                    {{ $company['phone'] }}<br>
                    {{ $company['email'] }}
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#{{ $order->order_number }}</div>
                <div style="margin-top: 8px; color: #666;">
                    Date: {{ $order->created_at->format('M d, Y') }}
                </div>
                <div class="status-badge status-{{ $order->status }}">
                    {{ ucfirst($order->status) }}
                </div>
            </div>
        </div>

        <!-- Addresses -->
        <div class="addresses">
            <div class="bill-to">
                <div class="section-title">Bill To</div>
                @if($order->customer)
                <div class="customer-name">{{ $order->customer->name }}</div>
                @if($order->customer->email)
                <div>{{ $order->customer->email }}</div>
                @endif
                @if($order->customer->phone)
                <div>{{ $order->customer->phone }}</div>
                @endif
                @if($order->customer->company)
                <div>{{ $order->customer->company }}</div>
                @endif
                @endif
            </div>
            <div class="ship-to">
                <div class="section-title">Ship To</div>
                @if($order->shipping_address)
                @php $addr = is_array($order->shipping_address) ? $order->shipping_address : json_decode($order->shipping_address, true); @endphp
                @if(!empty($addr['street']))<div>{{ $addr['street'] }}</div>@endif
                @if(!empty($addr['city']))<div>{{ $addr['city'] }}@if(!empty($addr['state'])), {{ $addr['state'] }}@endif</div>@endif
                @if(!empty($addr['country']))<div>{{ $addr['country'] }}</div>@endif
                @else
                <div style="color: #999;">Same as billing</div>
                @endif
            </div>
        </div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Product</th>
                    <th style="width: 80px;">Qty</th>
                    <th style="width: 120px;">Unit Price</th>
                    <th style="width: 120px;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        {{ $item->product->name ?? 'N/A' }}
                        @if($item->product && $item->product->sku)
                        <div class="sku">SKU: {{ $item->product->sku }}</div>
                        @endif
                    </td>
                    <td>{{ $item->quantity }}</td>
                    <td>UGX {{ number_format($item->unit_price, 0) }}</td>
                    <td>UGX {{ number_format($item->total, 0) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-value">UGX {{ number_format($order->subtotal, 0) }}</span>
            </div>
            <div class="total-row">
                <span class="total-label">VAT (18%)</span>
                <span class="total-value">UGX {{ number_format($order->tax, 0) }}</span>
            </div>
            @if($order->discount > 0)
            <div class="total-row">
                <span class="total-label">Discount</span>
                <span class="total-value" style="color: #dc2626;">-UGX {{ number_format($order->discount, 0) }}</span>
            </div>
            @endif
            <div class="total-row grand-total">
                <span class="total-label">Total</span>
                <span class="total-value">UGX {{ number_format($order->total, 0) }}</span>
            </div>
        </div>

        <!-- Notes -->
        @if($order->notes)
        <div class="notes">
            <div class="notes-title">Notes</div>
            <div>{{ $order->notes }}</div>
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business! | {{ $company['name'] }} &copy; {{ date('Y') }}</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </div>
</body>

</html>