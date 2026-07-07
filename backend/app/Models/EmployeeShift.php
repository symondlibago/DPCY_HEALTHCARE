<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'shift_date',
        'time_in',
        'time_out',
        'timed_in_by',
        'timed_out_by',
    ];

    protected $casts = [
        'shift_date' => 'date',
        'time_in' => 'datetime',
        'time_out' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function timedInBy()
    {
        return $this->belongsTo(User::class, 'timed_in_by');
    }

    public function timedOutBy()
    {
        return $this->belongsTo(User::class, 'timed_out_by');
    }
}
