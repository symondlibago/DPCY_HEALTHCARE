<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Indexes for the columns the app filters/sorts on most, so daily
     * history and dashboard queries stay fast as data grows.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('transaction_date');
            $table->index('created_at');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index('expense_date');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['transaction_date']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['expense_date']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
        });
    }
};
