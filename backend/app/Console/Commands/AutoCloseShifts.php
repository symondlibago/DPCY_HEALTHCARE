<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmployeeShift;
use Carbon\Carbon;

class AutoCloseShifts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shifts:auto-close';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically time-out any employee still on shift at 6:00 PM (Asia/Manila)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = Carbon::now('Asia/Manila')->toDateString();
        // Eloquent's datetime cast round-trips through the app's default (UTC) timezone,
        // so the target instant must be converted to UTC before it's assigned/stored —
        // otherwise "18:00 Manila" is silently stored and re-read as "18:00 UTC".
        $sixPm = Carbon::parse("{$today} 18:00:00", 'Asia/Manila')->utc();

        $count = EmployeeShift::where('shift_date', $today)
            ->whereNotNull('time_in')
            ->whereNull('time_out')
            ->update(['time_out' => $sixPm]);

        $this->info("Auto-closed {$count} shift(s) for {$today}.");

        return self::SUCCESS;
    }
}
