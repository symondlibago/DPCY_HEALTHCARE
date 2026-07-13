<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\YakapSetting;

class YakapSettingController extends Controller
{
    /**
     * A single row holds the staff-entered total Yakap enrollee count.
     * Created on first read so callers never have to special-case "no row yet".
     */
    private function current(): YakapSetting
    {
        return YakapSetting::first() ?? YakapSetting::create(['manual_count' => 0]);
    }

    public function show()
    {
        return response()->json(['success' => true, 'data' => ['manual_count' => $this->current()->manual_count]]);
    }

    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'manual_count' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $setting = $this->current();
        $setting->update(['manual_count' => $request->manual_count]);

        return response()->json(['success' => true, 'data' => ['manual_count' => $setting->manual_count]]);
    }
}
