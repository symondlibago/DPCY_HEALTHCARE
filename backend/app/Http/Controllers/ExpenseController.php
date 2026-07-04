<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Expense;

class ExpenseController extends Controller
{
    /**
     * List expenses. Supports ?date=YYYY-MM-DD to filter a single day.
     */
    public function index(Request $request)
    {
        $query = Expense::query();

        if ($request->filled('date')) {
            // expense_date is a DATE column; plain equality uses the index.
            $query->where('expense_date', $request->date);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('expense_date', [$request->from, $request->to]);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $expenses]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'expense_date' => 'required|date',
            'category' => 'nullable|string|max:255',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $expense = Expense::create($validator->validated());

        return response()->json(['success' => true, 'data' => $expense], 201);
    }

    public function show($id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $expense]);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'expense_date' => 'sometimes|required|date',
            'category' => 'nullable|string|max:255',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $expense->update($request->only(['expense_date', 'category', 'description', 'amount', 'notes']));

        return response()->json(['success' => true, 'data' => $expense]);
    }

    public function destroy($id)
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
        }
        $expense->delete();
        return response()->json(['success' => true, 'message' => 'Expense deleted successfully']);
    }
}
