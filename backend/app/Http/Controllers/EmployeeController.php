<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Employee;
use App\Models\User;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with('user:id,name,email,role')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $employees]);
    }

    public function store(Request $request)
    {
        $validator = $this->validator($request);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->boolean('create_account')) {
            $accountErrors = $this->validateAccount($request);
            if ($accountErrors) {
                return response()->json(['success' => false, 'errors' => $accountErrors], 422);
            }

            $employee = DB::transaction(function () use ($validator, $request) {
                $employee = Employee::create($validator->validated());
                $this->createAccount($request, $employee);
                return $employee;
            });
        } else {
            $employee = Employee::create($validator->validated());
        }

        return response()->json(['success' => true, 'data' => $employee->load('user:id,name,email,role')], 201);
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

        if (!$employee->user_id && $request->boolean('create_account')) {
            $accountErrors = $this->validateAccount($request);
            if ($accountErrors) {
                return response()->json(['success' => false, 'errors' => $accountErrors], 422);
            }

            DB::transaction(function () use ($employee, $validator, $request) {
                $employee->update($validator->validated());
                $this->createAccount($request, $employee);
            });
        } else {
            $employee->update($validator->validated());
        }

        return response()->json(['success' => true, 'data' => $employee->load('user:id,name,email,role')]);
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

    private function validateAccount(Request $request)
    {
        $accountValidator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:staff,admin',
        ]);

        return $accountValidator->fails() ? $accountValidator->errors() : null;
    }

    private function createAccount(Request $request, Employee $employee)
    {
        $user = User::create([
            'name' => $employee->name,
            'email' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        $employee->update(['user_id' => $user->id]);
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
            'notes' => 'nullable|string',
        ]);
    }
}
