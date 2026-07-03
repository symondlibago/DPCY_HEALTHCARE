<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Employee;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $employees]);
    }

    public function store(Request $request)
    {
        $validator = $this->validator($request);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $employee = Employee::create($validator->validated());
        return response()->json(['success' => true, 'data' => $employee], 201);
    }

    public function show($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $employee]);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $validator = $this->validator($request, true);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $employee->update($validator->validated());
        return response()->json(['success' => true, 'data' => $employee]);
    }

    public function destroy($id)
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
        }
        $employee->delete();
        return response()->json(['success' => true, 'message' => 'Employee deleted successfully']);
    }

    private function validator(Request $request, bool $partial = false)
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return Validator::make($request->all(), [
            'id_number' => 'nullable|string|max:255',
            'name' => $required . '|string|max:255',
            'position' => $required . '|string|max:255',
            'sex' => 'nullable|string|max:20',
            'age' => 'nullable|integer|min:0',
            'birthday' => 'nullable|date',
            'phone_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'date_hired' => 'nullable|date',
            'status' => 'nullable|in:Active,Inactive',
            'notes' => 'nullable|string',
        ]);
    }
}
