<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Seed the offered services and fees from the center's price list.
     * Prices are editable in-app afterwards.
     */
    public function run(): void
    {
        $services = [
            ['name' => 'Chest X-ray',          'price' => 300.00, 'category' => 'Imaging'],
            ['name' => 'Drug Test',            'price' => 250.00, 'category' => 'Drug Testing'],
            ['name' => 'ECG',                  'price' => 350.00, 'category' => 'Diagnostics'],
            ['name' => 'Medical Certificate',  'price' => 250.00, 'category' => 'Clearance'],
            ['name' => 'Physical Exam',        'price' => 250.00, 'category' => 'Clearance'],
            ['name' => 'Back to Work',         'price' => 500.00, 'category' => 'Clearance'],
            ['name' => 'CBC',                  'price' => 150.00, 'category' => 'Laboratory'],
            ['name' => 'Urinalysis',           'price' => 60.00,  'category' => 'Laboratory'],
            ['name' => 'Fecalysis',            'price' => 60.00,  'category' => 'Laboratory'],
            ['name' => 'Pregnancy Test',       'price' => 250.00, 'category' => 'Laboratory'],
            ['name' => 'Blood Typing',         'price' => 150.00, 'category' => 'Laboratory'],
            ['name' => 'VDRL',                 'price' => 175.00, 'category' => 'Laboratory'],
            ['name' => 'Hepatitis A',          'price' => 550.00, 'category' => 'Laboratory'],
            ['name' => 'Hepatitis B',          'price' => 225.00, 'category' => 'Laboratory'],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['name' => $service['name']],
                ['price' => $service['price'], 'category' => $service['category'], 'is_active' => true]
            );
        }
    }
}
