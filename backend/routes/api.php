<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShiftController;

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

    // Employee shift tracking (time in / time out): admin + super admin
    Route::middleware('role:admin,super_admin')->group(function () {
        Route::get('/shifts', [ShiftController::class, 'index']);
        Route::get('/shifts/history', [ShiftController::class, 'history']);
        Route::post('/shifts/{employee}/time-in', [ShiftController::class, 'timeIn']);
        Route::post('/shifts/{employee}/time-out', [ShiftController::class, 'timeOut']);
    });

    // Super admin only: employee (staff) management + user account management
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });
});
