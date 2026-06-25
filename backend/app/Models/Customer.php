<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'dni',
        'name',
        'email',
        'phone',
        'address',
        'credit_limit',
        'credit_used',
        'active',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'credit_used' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function availableCredit(): float
    {
        return $this->credit_limit - $this->credit_used;
    }

    public function canUseCredit(float $amount): bool
    {
        return ($this->availableCredit() >= $amount) && $this->active;
    }
}
