<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * DPCY Healthcare - Patient transactions / official receipts.
     * Patient info is captured per-visit (walk-in). Availed services are
     * stored as line items in the `items` JSON column.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no')->unique();

            // Patient info (per-visit)
            $table->string('patient_name');
            $table->integer('age')->nullable();
            $table->string('sex')->nullable();
            $table->text('address')->nullable();

            $table->date('transaction_date');

            // Availed services: [{ service_id, name, price, qty, subtotal }]
            $table->json('items');

            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->decimal('amount_tendered', 10, 2)->nullable();
            $table->decimal('change', 10, 2)->default(0);
            $table->string('payment_method')->default('Cash');
            $table->string('cashier')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
