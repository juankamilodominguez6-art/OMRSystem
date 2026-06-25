<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name');
            $table->string('business_address')->nullable();
            $table->string('business_phone')->nullable();
            $table->string('business_email')->nullable();
            $table->string('business_tax_id')->nullable();
            $table->string('receipt_header')->nullable();
            $table->string('receipt_footer')->nullable();
            $table->enum('printer_width', ['58mm', '76mm', '80mm'])->default('80mm');
            $table->string('currency_symbol')->default('$');
            $table->string('currency_code')->default('USD');
            $table->decimal('tax_rate')->default(18);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('settings');
    }
};
