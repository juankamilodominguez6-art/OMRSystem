<?php

namespace App\Services;

use App\Models\CashRegisterSession;
use App\Models\CashRegisterMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CashRegisterService
{
    public function openSession(User $user, float $openingBalance = 0): CashRegisterSession
    {
        $existingSession = CashRegisterSession::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->where('status', 'open')
            ->first();

        if ($existingSession) {
            return $existingSession;
        }

        return CashRegisterSession::create([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'opening_balance' => $openingBalance,
            'status' => 'open',
        ]);
    }

    public function addMovement(CashRegisterSession $session, array $data): CashRegisterMovement
    {
        $movement = CashRegisterMovement::create([
            'user_id' => $session->user_id,
            'cash_register_session_id' => $session->id,
            'type' => $data['type'],
            'reason' => $data['reason'],
            'amount' => $data['amount'],
            'notes' => $data['notes'] ?? null,
        ]);

        if ($data['type'] === 'in') {
            $session->increment('total_in', $data['amount']);
        } else {
            $session->increment('total_out', $data['amount']);
        }

        return $movement;
    }

    public function closeSession(CashRegisterSession $session): CashRegisterSession
    {
        $closingBalance = $session->calculateClosingBalance();

        $session->update([
            'closing_balance' => $closingBalance,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return $session->fresh();
    }

    public function getCurrentSession(User $user): ?CashRegisterSession
    {
        return CashRegisterSession::where('user_id', $user->id)
            ->where('date', now()->toDateString())
            ->where('status', 'open')
            ->first();
    }
}
