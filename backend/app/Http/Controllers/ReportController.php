<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\Transaction;
use App\Models\Service;

class ReportController extends Controller
{
    public function serviceStats(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $from = $request->get('from', $today);
        $to = $request->get('to', $today);
        if ($from > $to) {
            [$from, $to] = [$to, $from];
        }

        // Start with EVERY service in the catalog so the dashboard always
        // lists them all, including those with zero availments in the range.
        $stats = [];
        foreach (Service::orderBy('name')->pluck('name') as $name) {
            $stats[$name] = ['name' => $name, 'availed' => 0, 'transactions' => 0, 'revenue' => 0.0];
        }

        Transaction::whereBetween('transaction_date', [$from, $to])
            ->select('id', 'items')
            ->orderBy('id') // chunk() requires an explicit ordering
            ->chunk(500, function ($transactions) use (&$stats) {
                foreach ($transactions as $tx) {
                    foreach ($tx->items ?? [] as $item) {
                        $name = $item['name'] ?? 'Unknown';
                        if (!isset($stats[$name])) {
                            // Item from a renamed/deleted service — still counted.
                            $stats[$name] = ['name' => $name, 'availed' => 0, 'transactions' => 0, 'revenue' => 0.0];
                        }
                        $stats[$name]['availed'] += (float) ($item['qty'] ?? 1);
                        $stats[$name]['transactions'] += 1;
                        $stats[$name]['revenue'] += (float) ($item['subtotal'] ?? (($item['price'] ?? 0) * ($item['qty'] ?? 1)));
                    }
                }
            });

        $rows = collect($stats)
            ->map(fn ($r) => [
                'name' => $r['name'],
                'availed' => (int) $r['availed'],
                'transactions' => $r['transactions'],
                'revenue' => round($r['revenue'], 2),
            ])
            ->sortBy([['availed', 'desc'], ['name', 'asc']])
            ->values();

        return response()->json([
            'success' => true,
            'from' => $from,
            'to' => $to,
            'data' => $rows,
            'total_availed' => (int) $rows->sum('availed'),
            'total_revenue' => round($rows->sum('revenue'), 2),
        ]);
    }

    /**
     * Overall sales summary: quick totals (today/week/month/year) plus a
     * breakdown grouped by the requested period (daily|weekly|monthly|yearly).
     */
    public function sales(Request $request)
    {
        $today = Carbon::today();
        $period = $request->get('period', 'monthly');
        $year = (int) $request->get('year', $today->year);
        $month = (int) $request->get('month', $today->month);

        // Quick summary cards (always the current calendar periods)
        $cards = [
            'today' => (float) Transaction::where('transaction_date', $today->toDateString())->sum('total'),
            'week'  => (float) Transaction::whereBetween('transaction_date', [$today->copy()->startOfWeek()->toDateString(), $today->copy()->endOfWeek()->toDateString()])->sum('total'),
            'month' => (float) Transaction::whereBetween('transaction_date', [$today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString()])->sum('total'),
            'year'  => (float) Transaction::whereBetween('transaction_date', [$today->copy()->startOfYear()->toDateString(), $today->copy()->endOfYear()->toDateString()])->sum('total'),
        ];

        switch ($period) {
            case 'daily':
                $rows = Transaction::whereYear('transaction_date', $year)
                    ->whereMonth('transaction_date', $month)
                    ->selectRaw('transaction_date as d, SUM(total) as total, COUNT(*) as cnt')
                    ->groupBy('d')->orderBy('d')->get()
                    ->map(fn ($r) => [
                        'label' => Carbon::parse($r->d)->format('M d, Y'),
                        'total' => (float) $r->total,
                        'count' => (int) $r->cnt,
                    ]);
                break;

            case 'weekly':
                $rows = Transaction::whereYear('transaction_date', $year)
                    ->selectRaw('YEARWEEK(transaction_date, 3) as yw, MIN(transaction_date) as start_d, MAX(transaction_date) as end_d, SUM(total) as total, COUNT(*) as cnt')
                    ->groupBy('yw')->orderBy('yw')->get()
                    ->map(fn ($r) => [
                        'label' => Carbon::parse($r->start_d)->format('M d') . ' – ' . Carbon::parse($r->end_d)->format('M d'),
                        'total' => (float) $r->total,
                        'count' => (int) $r->cnt,
                    ]);
                break;

            case 'yearly':
                $rows = Transaction::selectRaw('YEAR(transaction_date) as y, SUM(total) as total, COUNT(*) as cnt')
                    ->groupBy('y')->orderBy('y')->get()
                    ->map(fn ($r) => [
                        'label' => (string) $r->y,
                        'total' => (float) $r->total,
                        'count' => (int) $r->cnt,
                    ]);
                break;

            default: // monthly
                $period = 'monthly';
                $rows = Transaction::whereYear('transaction_date', $year)
                    ->selectRaw('MONTH(transaction_date) as m, SUM(total) as total, COUNT(*) as cnt')
                    ->groupBy('m')->orderBy('m')->get()
                    ->map(fn ($r) => [
                        'label' => Carbon::create($year, (int) $r->m, 1)->format('F Y'),
                        'total' => (float) $r->total,
                        'count' => (int) $r->cnt,
                    ]);
                break;
        }

        $years = Transaction::selectRaw('DISTINCT YEAR(transaction_date) as y')
            ->orderByDesc('y')->pluck('y')->map(fn ($y) => (int) $y)->values();
        if ($years->isEmpty()) {
            $years = collect([$today->year]);
        }

        return response()->json([
            'success' => true,
            'cards' => $cards,
            'period' => $period,
            'year' => $year,
            'month' => $month,
            'years' => $years,
            'rows' => $rows,
            'total' => (float) collect($rows)->sum('total'),
            'count' => (int) collect($rows)->sum('count'),
        ]);
    }
}
