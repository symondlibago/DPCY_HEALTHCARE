<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'id_number',
        'name',
        'position',
        'sex',
        'age',
        'birthday',
        'phone_number',
        'email',
        'address',
        'date_hired',
        'notes',
    ];

    protected $casts = [
        'birthday' => 'date',
        'date_hired' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
