<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * DPCY Healthcare - Registry of PWD / Senior Citizen / Yakap Member
     * discount enrollees. A row is created automatically whenever a receipt
     * is issued with one of these discount types, and can also be reviewed
     * or corrected manually by admin/super admin.
     */
    public function up(): void
    {
        Schema::create('discount_enrollees', function (Blueprint $table) {
            $table->id();
            $table->string('patient_name');
            $table->integer('age')->nullable();
            $table->string('sex', 20)->nullable();
            $table->text('address')->nullable();
            $table->enum('discount_type', ['PWD', 'Senior', 'Yakap Member']);
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->string('receipt_no')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('discount_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_enrollees');
    }
};
