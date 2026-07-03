<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Service;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::query();

        // Optionally return only active services (used by the receipt screen)
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $services = $query->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $services]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $service = Service::create([
            'name' => $request->name,
            'price' => $request->price,
            'category' => $request->category,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
        ]);

        return response()->json(['success' => true, 'data' => $service], 201);
    }

    public function show($id)
    {
        $service = Service::find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $service]);
    }

    public function update(Request $request, $id)
    {
        $service = Service::find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $service->update($request->only(['name', 'price', 'category', 'is_active']));

        return response()->json(['success' => true, 'data' => $service]);
    }

    public function destroy($id)
    {
        $service = Service::find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service not found'], 404);
        }
        $service->delete();
        return response()->json(['success' => true, 'message' => 'Service deleted successfully']);
    }
}
