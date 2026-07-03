<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Transaction;

class TransactionController extends Controller
{
    /**
     * List transactions. Supports ?date=YYYY-MM-DD to filter a single day
     * (used by the Daily Transaction History screen).
     */
    public function index(Request $request)
    {
        $query = Transaction::query();

        if ($request->filled('date')) {
            $query->whereDate('transaction_date', $request->date);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('transaction_date', [$request->from, $request->to]);
        }

        $transactions = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $transactions]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_name' => 'required|string|max:255',
            'age' => 'nullable|integer|min:0',
            'sex' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'transaction_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.qty' => 'required|numeric|min:1',
            'discount' => 'nullable|numeric|min:0',
            'amount_tendered' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'cashier' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            // Compute totals server-side so the receipt is authoritative.
            $items = [];
            $subtotal = 0;
            foreach ($request->items as $item) {
                $price = floatval($item['price']);
                $qty = floatval($item['qty']);
                $lineTotal = round($price * $qty, 2);
                $subtotal += $lineTotal;
                $items[] = [
                    'service_id' => $item['service_id'] ?? null,
                    'name' => $item['name'],
                    'price' => $price,
                    'qty' => $qty,
                    'subtotal' => $lineTotal,
                ];
            }

            $discount = floatval($request->discount ?? 0);
            $total = round($subtotal - $discount, 2);
            $tendered = $request->filled('amount_tendered') ? floatval($request->amount_tendered) : null;
            $change = ($tendered !== null) ? round(max($tendered - $total, 0), 2) : 0;

            $transaction = Transaction::create([
                'receipt_no' => 'TMP',
                'patient_name' => $request->patient_name,
                'age' => $request->age,
                'sex' => $request->sex,
                'address' => $request->address,
                'transaction_date' => $request->transaction_date,
                'items' => $items,
                'subtotal' => round($subtotal, 2),
                'discount' => $discount,
                'total' => $total,
                'amount_tendered' => $tendered,
                'change' => $change,
                'payment_method' => $request->payment_method ?? 'Cash',
                'cashier' => $request->cashier,
                'notes' => $request->notes,
            ]);

            // Human-friendly official receipt number: DPCY-YYYYMMDD-000123
            $datePart = date('Ymd', strtotime($request->transaction_date));
            $transaction->receipt_no = 'DPCY-' . $datePart . '-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT);
            $transaction->save();

            return response()->json(['success' => true, 'data' => $transaction], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $transaction]);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }

        // Allow light edits (patient info / notes). Line items are immutable
        // once a receipt is issued to keep the receipt trail trustworthy.
        $transaction->update($request->only([
            'patient_name', 'age', 'sex', 'address', 'notes', 'payment_method',
        ]));

        return response()->json(['success' => true, 'data' => $transaction]);
    }

    public function destroy($id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['success' => false, 'message' => 'Transaction not found'], 404);
        }
        $transaction->delete();
        return response()->json(['success' => true, 'message' => 'Transaction deleted successfully']);
    }
}
