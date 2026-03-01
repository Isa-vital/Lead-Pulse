<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportExportController extends Controller
{
    /**
     * Export customers as CSV
     */
    public function exportCustomers(): StreamedResponse
    {
        $customers = Customer::all();

        return $this->streamCsv(
            'customers.csv',
            ['Name', 'Email', 'Phone', 'Company', 'Source', 'Lifetime Value', 'Tags', 'City', 'Country', 'Created At'],
            $customers->map(fn($c) => [
                $c->name,
                $c->email,
                $c->phone,
                $c->company,
                $c->source,
                $c->lifetime_value,
                is_array($c->tags) ? implode('; ', $c->tags) : '',
                $c->address['city'] ?? '',
                $c->address['country'] ?? '',
                $c->created_at->format('Y-m-d H:i:s'),
            ])
        );
    }

    /**
     * Export products as CSV
     */
    public function exportProducts(): StreamedResponse
    {
        $products = Product::with('category')->get();

        return $this->streamCsv(
            'products.csv',
            ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Low Stock Threshold', 'Active', 'Created At'],
            $products->map(fn($p) => [
                $p->name,
                $p->sku,
                $p->category?->name ?? '',
                $p->price,
                $p->cost,
                $p->stock,
                $p->low_stock_threshold,
                $p->is_active ? 'Yes' : 'No',
                $p->created_at->format('Y-m-d H:i:s'),
            ])
        );
    }

    /**
     * Export orders as CSV
     */
    public function exportOrders(): StreamedResponse
    {
        $orders = Order::with('customer')->get();

        return $this->streamCsv(
            'orders.csv',
            ['Order Number', 'Customer', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total', 'Created At'],
            $orders->map(fn($o) => [
                $o->order_number,
                $o->customer?->name ?? '',
                $o->status,
                $o->subtotal,
                $o->tax,
                $o->discount,
                $o->total,
                $o->created_at->format('Y-m-d H:i:s'),
            ])
        );
    }

    /**
     * Import customers from CSV
     */
    public function importCustomers(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (!$header) {
            return $this->errorResponse('Invalid CSV file', 422);
        }

        // Normalize headers
        $header = array_map(fn($h) => strtolower(trim($h)), $header);

        $imported = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            if (!$data) continue;

            try {
                Customer::updateOrCreate(
                    ['email' => $data['email'] ?? null],
                    [
                        'name' => $data['name'] ?? 'Unknown',
                        'phone' => $data['phone'] ?? null,
                        'company' => $data['company'] ?? null,
                        'source' => $data['source'] ?? 'csv_import',
                        'tags' => isset($data['tags']) ? array_map('trim', explode(';', $data['tags'])) : [],
                        'address' => [
                            'city' => $data['city'] ?? null,
                            'country' => $data['country'] ?? null,
                        ],
                        'custom_fields' => [],
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($imported + count($errors) + 2) . ": " . $e->getMessage();
            }
        }

        fclose($handle);

        return $this->successResponse([
            'imported' => $imported,
            'errors' => $errors,
        ], "Imported {$imported} customers" . (count($errors) > 0 ? " with " . count($errors) . " errors" : ""));
    }

    /**
     * Import products from CSV
     */
    public function importProducts(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        if (!$header) {
            return $this->errorResponse('Invalid CSV file', 422);
        }

        $header = array_map(fn($h) => strtolower(trim($h)), $header);

        $imported = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);
            if (!$data) continue;

            try {
                Product::updateOrCreate(
                    ['sku' => $data['sku'] ?? uniqid('SKU-')],
                    [
                        'name' => $data['name'] ?? 'Unknown',
                        'slug' => \Illuminate\Support\Str::slug($data['name'] ?? 'unknown-' . uniqid()),
                        'price' => (float) ($data['price'] ?? 0),
                        'cost' => (float) ($data['cost'] ?? 0),
                        'stock' => (int) ($data['stock'] ?? 0),
                        'low_stock_threshold' => (int) ($data['low_stock_threshold'] ?? 10),
                        'is_active' => !isset($data['active']) || strtolower($data['active']) !== 'no',
                        'images' => [],
                        'attributes' => [],
                        'tags' => [],
                    ]
                );
                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($imported + count($errors) + 2) . ": " . $e->getMessage();
            }
        }

        fclose($handle);

        return $this->successResponse([
            'imported' => $imported,
            'errors' => $errors,
        ], "Imported {$imported} products" . (count($errors) > 0 ? " with " . count($errors) . " errors" : ""));
    }

    private function streamCsv(string $filename, array $headers, $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row instanceof \Illuminate\Support\Collection ? $row->toArray() : (array) $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
