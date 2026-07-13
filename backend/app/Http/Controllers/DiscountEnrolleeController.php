<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\DiscountEnrollee;
use App\Models\YakapSetting;

class DiscountEnrolleeController extends Controller
{
    /**
     * List discount enrollees. Supports ?type=PWD|Senior|Yakap Member,
     * ?search=<name>, and ?manual=1 (used by the Yakap Enrollees screen to
     * show only manually verified members, excluding receipt auto-adds).
     */
    public function index(Request $request)
    {
        $query = DiscountEnrollee::query();

        if ($request->filled('type')) {
            $query->where('discount_type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('patient_name', 'like', '%' . $request->search . '%');
        }

        if ($request->boolean('manual')) {
            $query->whereNull('transaction_id');
        }

        $enrollees = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $enrollees]);
    }

    /**
     * Total + per-type counts, used by the Dashboard Overview stat card.
     */
    public function stats()
    {
        $counts = DiscountEnrollee::query()
            ->selectRaw('discount_type, count(*) as total')
            ->groupBy('discount_type')
            ->pluck('total', 'discount_type');

        $byType = [
            'PWD' => (int) ($counts['PWD'] ?? 0),
            'Senior' => (int) ($counts['Senior'] ?? 0),
            'Yakap Member' => (int) ($counts['Yakap Member'] ?? 0),
        ];

        // Yakap enrollees are entered as a single staff-typed total rather than
        // individual records (see YakapSettingController).
        $yakapManual = (int) (YakapSetting::first()->manual_count ?? 0);

        return response()->json([
            'success' => true,
            'data' => [
                'total' => array_sum($byType),
                'by_type' => $byType,
                'yakap_manual' => $yakapManual,
            ],
        ]);
    }

    /**
     * Prevents the same person from being registered as a Yakap Member twice
     * (name match, case-insensitive) so the manual count reflects one entry
     * per verified member. $excludeId is passed when editing an existing row.
     */
    private function isDuplicateYakapMember(string $patientName, $excludeId = null): bool
    {
        $query = DiscountEnrollee::query()
            ->where('discount_type', 'Yakap Member')
            ->whereRaw('LOWER(patient_name) = ?', [strtolower(trim($patientName))]);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'patient_name' => 'required|string|max:255',
            'age' => 'nullable|integer|min:0',
            'sex' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'discount_type' => 'required|string|in:PWD,Senior,Yakap Member',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->discount_type === 'Yakap Member' && $this->isDuplicateYakapMember($request->patient_name)) {
            return response()->json([
                'success' => false,
                'errors' => ['patient_name' => ['This person is already registered as a Yakap Member.']],
            ], 422);
        }

        $enrollee = DiscountEnrollee::create([
            'patient_name' => $request->patient_name,
            'age' => $request->age,
            'sex' => $request->sex,
            'address' => $request->address,
            'discount_type' => $request->discount_type,
            'notes' => $request->notes,
        ]);

        return response()->json(['success' => true, 'data' => $enrollee], 201);
    }

    public function show($id)
    {
        $enrollee = DiscountEnrollee::find($id);
        if (!$enrollee) {
            return response()->json(['success' => false, 'message' => 'Discount enrollee not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $enrollee]);
    }

    public function update(Request $request, $id)
    {
        $enrollee = DiscountEnrollee::find($id);
        if (!$enrollee) {
            return response()->json(['success' => false, 'message' => 'Discount enrollee not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'patient_name' => 'sometimes|required|string|max:255',
            'age' => 'nullable|integer|min:0',
            'sex' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'discount_type' => 'sometimes|required|string|in:PWD,Senior,Yakap Member',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $newType = $request->discount_type ?? $enrollee->discount_type;
        $newName = $request->patient_name ?? $enrollee->patient_name;
        if ($newType === 'Yakap Member' && $this->isDuplicateYakapMember($newName, $enrollee->id)) {
            return response()->json([
                'success' => false,
                'errors' => ['patient_name' => ['This person is already registered as a Yakap Member.']],
            ], 422);
        }

        $enrollee->update($request->only([
            'patient_name', 'age', 'sex', 'address', 'discount_type', 'notes',
        ]));

        return response()->json(['success' => true, 'data' => $enrollee]);
    }

    public function destroy($id)
    {
        $enrollee = DiscountEnrollee::find($id);
        if (!$enrollee) {
            return response()->json(['success' => false, 'message' => 'Discount enrollee not found'], 404);
        }
        $enrollee->delete();
        return response()->json(['success' => true, 'message' => 'Discount enrollee deleted successfully']);
    }
}
