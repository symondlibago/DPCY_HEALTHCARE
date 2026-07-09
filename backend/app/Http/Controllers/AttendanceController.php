<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\AttendanceLog;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // The clinic operates on Philippine time regardless of the app/server's UTC clock,
    // so "today" must be computed in this timezone explicitly.
    private const LOCAL_TZ = 'Asia/Manila';

    private function today(): string
    {
        return Carbon::now(self::LOCAL_TZ)->toDateString();
    }

    public function index(Request $request)
    {
        $date = $request->query('date', $this->today());

        $logsByEmployee = AttendanceLog::where('attendance_date', $date)->get()->keyBy('employee_id');

        $employees = Employee::with('user:id,name,email,role')
            ->orderBy('name')
            ->get()
            ->map(function ($employee) use ($logsByEmployee) {
                $log = $logsByEmployee->get($employee->id);
                return [
                    'employee_id' => $employee->id,
                    'id_number' => $employee->id_number,
                    'name' => $employee->name,
                    'position' => $employee->position,
                    'has_account' => (bool) $employee->user_id,
                    'account_role' => $employee->user?->role,
                    'status' => $log->status ?? 'not_marked',
                    'marked_at' => $log?->marked_at,
                ];
            });

        return response()->json(['success' => true, 'data' => $employees, 'date' => $date]);
    }

    public function history(Request $request)
    {
        $from = $request->query('from', $this->today());
        $to = $request->query('to', $this->today());

        $records = AttendanceLog::with('employee:id,id_number,name,position')
            ->whereBetween('attendance_date', [$from, $to])
            ->get()
            ->map(fn ($log) => [
                'employee_id' => $log->employee_id,
                'id_number' => $log->employee->id_number,
                'name' => $log->employee->name,
                'position' => $log->employee->position,
                'attendance_date' => $log->attendance_date->toDateString(),
                'status' => $log->status,
                'marked_at' => $log->marked_at,
            ])
            ->sort(function ($a, $b) {
                $dateCompare = strcmp($b['attendance_date'], $a['attendance_date']);
                return $dateCompare !== 0 ? $dateCompare : strcasecmp($a['name'], $b['name']);
            })
            ->values();

        return response()->json(['success' => true, 'data' => $records, 'from' => $from, 'to' => $to]);
    }

    public function mark(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'attendance_date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,not_marked'],
        ]);

        if ($validated['status'] === 'not_marked') {
            AttendanceLog::where('employee_id', $employee->id)
                ->where('attendance_date', $validated['attendance_date'])
                ->delete();

            return response()->json(['success' => true, 'data' => [
                'employee_id' => $employee->id,
                'attendance_date' => $validated['attendance_date'],
                'status' => 'not_marked',
                'marked_at' => null,
            ]]);
        }

        $log = AttendanceLog::updateOrCreate(
            ['employee_id' => $employee->id, 'attendance_date' => $validated['attendance_date']],
            ['status' => $validated['status'], 'marked_by' => $request->user()->id, 'marked_at' => now()]
        );

        return response()->json(['success' => true, 'data' => $log]);
    }
}
