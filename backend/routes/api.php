<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes - DPCY Healthcare (Diagnostic & Drug Testing Center)
|--------------------------------------------------------------------------
*/

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // Services (predefined list of offered services + fees)
    Route::apiResource('services', ServiceController::class);

    // Patient transactions / official receipts
    Route::apiResource('transactions', TransactionController::class);

    // Daily expenses
    Route::apiResource('expenses', ExpenseController::class);

    // Sales reports (daily/weekly/monthly/yearly): admin + super admin
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/reports/sales', [ReportController::class, 'sales']);
    });

    // Employee attendance tracking (present/absent per day): admin + super admin
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::get('/attendance/history', [AttendanceController::class, 'history']);
        Route::post('/attendance/{employee}/mark', [AttendanceController::class, 'mark']);
    });

    // Super admin only: employee (staff) management + user account management
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });
});
