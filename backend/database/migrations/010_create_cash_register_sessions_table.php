<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('cash_register_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('opening_balance', 10, 2)->default(0);
            $table->decimal('closing_balance', 10, 2)->nullable();
            $table->decimal('sales_total', 10, 2)->default(0);
            $table->decimal('cash_payments', 10, 2)->default(0);
            $table->decimal('card_payments', 10, 2)->default(0);
            $table->decimal('credit_payments', 10, 2)->default(0);
            $table->decimal('transfer_payments', 10, 2)->default(0);
            $table->decimal('total_in', 10, 2)->default(0);
            $table->decimal('total_out', 10, 2)->default(0);
            $table->decimal('tax_total', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('cash_register_sessions');
    }
};
