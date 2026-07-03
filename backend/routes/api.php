<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ExpenseController;

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

    // Services (predefined list of offered services + fees)
    Route::apiResource('services', ServiceController::class);

    // Patient transactions / official receipts
    Route::apiResource('transactions', TransactionController::class);

    // Daily expenses
    Route::apiResource('expenses', ExpenseController::class);

    // Employee (staff) management
    Route::apiResource('employees', EmployeeController::class);
});
