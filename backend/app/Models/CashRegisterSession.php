<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegisterSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'opening_balance',
        'closing_balance',
        'sales_total',
        'cash_payments',
        'card_payments',
        'credit_payments',
        'transfer_payments',
        'total_in',
        'total_out',
        'tax_total',
        'notes',
        'status',
        'closed_at',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'sales_total' => 'decimal:2',
        'cash_payments' => 'decimal:2',
        'card_payments' => 'decimal:2',
        'credit_payments' => 'decimal:2',
        'transfer_payments' => 'decimal:2',
        'total_in' => 'decimal:2',
        'total_out' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'date' => 'date',
        'closed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashRegisterMovement::class);
    }

    public function calculateClosingBalance(): float
    {
        return $this->opening_balance + $this->cash_payments + $this->total_in - $this->total_out;
    }
}
