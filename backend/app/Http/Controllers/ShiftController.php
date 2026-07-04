<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\EmployeeShift;
use Carbon\Carbon;

class ShiftController extends Controller
{
    // The clinic operates on Philippine time regardless of the app/server's UTC clock,
    // so "today" and shift cutoffs must be computed in this timezone explicitly.
    private const LOCAL_TZ = 'Asia/Manila';

    private function today(): string
    {
        return Carbon::now(self::LOCAL_TZ)->toDateString();
    }

    public function index(Request $request)
    {
        $date = $request->query('date', $this->today());

        $shiftsByEmployee = EmployeeShift::where('shift_date', $date)->get()->keyBy('employee_id');

        $employees = Employee::with('user:id,name,email,role')
            ->orderBy('name')
            ->get()
            ->map(function ($employee) use ($shiftsByEmployee) {
                $shift = $shiftsByEmployee->get($employee->id);
                return [
                    'employee_id' => $employee->id,
                    'id_number' => $employee->id_number,
                    'name' => $employee->name,
                    'position' => $employee->position,
                    'has_account' => (bool) $employee->user_id,
                    'account_role' => $employee->user?->role,
                    'time_in' => $shift?->time_in,
                    'time_out' => $shift?->time_out,
                    'auto_closed' => (bool) ($shift && $shift->time_out && !$shift->timed_out_by),
                ];
            });

        return response()->json(['success' => true, 'data' => $employees, 'date' => $date]);
    }

    public function history(Request $request)
    {
        $from = $request->query('from', $this->today());
        $to = $request->query('to', $this->today());

        $records = EmployeeShift::with('employee:id,id_number,name,position')
            ->whereBetween('shift_date', [$from, $to])
            ->whereNotNull('time_in')
            ->get()
            ->map(fn ($shift) => [
                'employee_id' => $shift->employee_id,
                'id_number' => $shift->employee->id_number,
                'name' => $shift->employee->name,
                'position' => $shift->employee->position,
                'shift_date' => $shift->shift_date->toDateString(),
                'time_in' => $shift->time_in,
                'time_out' => $shift->time_out,
                'auto_closed' => (bool) ($shift->time_out && !$shift->timed_out_by),
            ])
            ->sort(function ($a, $b) {
                $dateCompare = strcmp($b['shift_date'], $a['shift_date']);
                return $dateCompare !== 0 ? $dateCompare : strcasecmp($a['name'], $b['name']);
            })
            ->values();

        return response()->json(['success' => true, 'data' => $records, 'from' => $from, 'to' => $to]);
    }

    public function timeIn(Request $request, Employee $employee)
    {
        $shift = EmployeeShift::firstOrNew([
            'employee_id' => $employee->id,
            'shift_date' => $this->today(),
        ]);

        if ($shift->time_in) {
            return response()->json(['success' => false, 'message' => 'Employee already timed in today.'], 422);
        }

        $shift->time_in = now();
        $shift->timed_in_by = $request->user()->id;
        $shift->save();

        return response()->json(['success' => true, 'data' => $shift]);
    }

    public function timeOut(Request $request, Employee $employee)
    {
        $shift = EmployeeShift::where('employee_id', $employee->id)
            ->where('shift_date', $this->today())
            ->first();

        if (!$shift || !$shift->time_in) {
            return response()->json(['success' => false, 'message' => 'Employee has not timed in yet.'], 422);
        }

        if ($shift->time_out) {
            return response()->json(['success' => false, 'message' => 'Employee already timed out today.'], 422);
        }

        $shift->time_out = now();
        $shift->timed_out_by = $request->user()->id;
        $shift->save();

        return response()->json(['success' => true, 'data' => $shift]);
    }
}
