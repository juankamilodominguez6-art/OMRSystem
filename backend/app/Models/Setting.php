<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_name',
        'business_address',
        'business_phone',
        'business_email',
        'business_tax_id',
        'receipt_header',
        'receipt_footer',
        'printer_width',
        'currency_symbol',
        'currency_code',
        'tax_rate',
    ];

    protected $casts = [
        'tax_rate' => 'decimal:2',
    ];

    public static function getCurrent(): self
    {
        return self::firstOr(
            fn() => self::create([
                'business_name' => 'Mi Negocio',
                'currency_symbol' => '$',
                'currency_code' => 'USD',
                'tax_rate' => 18,
                'printer_width' => '80mm',
            ])
        );
    }
}
