<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
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
        'status',
        'notes',
    ];

    protected $casts = [
        'birthday' => 'date',
        'date_hired' => 'date',
    ];
}
