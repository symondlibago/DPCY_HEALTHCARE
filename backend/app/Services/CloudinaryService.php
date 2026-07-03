<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;
use Cloudinary\Exception\ConfigurationException;

class CloudinaryService
{
    protected $cloudinary = null;

    /**
     * Constructor - safely initialize Cloudinary if possible
     */
    public function __construct()
    {
        try {
            $this->cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => config('services.cloudinary.cloud_name'),
                    'api_key' => config('services.cloudinary.api_key'),
                    'api_secret' => config('services.cloudinary.api_secret'),
                ],
            ]);
        } catch (ConfigurationException $e) {
            // Log the error but don't throw it
            Log::warning('Cloudinary configuration error: ' . $e->getMessage());
            $this->cloudinary = null;
        }
    }

    /**
     * Check if Cloudinary service is available
     */
    public function isAvailable(): bool
    {
        return $this->cloudinary !== null;
    }

    /**
     * Validate multiple images
     */
    public function validateMultipleImages(array $files): array
    {
        $validFiles = [];
        $errors = [];

        foreach ($files as $index => $file) {
            if (!$file instanceof UploadedFile) {
                $errors[] = "File at index {$index} is not a valid upload";
                continue;
            }

            // Check file size (5MB max)
            if ($file->getSize() > 5 * 1024 * 1024) {
                $errors[] = "File {$file->getClientOriginalName()} exceeds 5MB limit";
                continue;
            }

            // Check file type
            $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
            if (!in_array($file->getMimeType(), $allowedMimes)) {
                $errors[] = "File {$file->getClientOriginalName()} is not a valid image type";
                continue;
            }

            $validFiles[] = $file;
        }

        return [
            'valid' => empty($errors),
            'valid_files' => $validFiles,
            'errors' => $errors
        ];
    }

    /**
     * Upload multiple images (mock implementation)
     */
    public function uploadMultipleImages(array $files, string $folder = 'expenses'): array
    {
        $results = [];
        $errors = [];

        foreach ($files as $file) {
            try {
                // Mock upload result
                $publicId = 'mock_' . uniqid() . '_' . time();
                $results[] = [
                    'public_id' => $publicId,
                    'secure_url' => 'https://via.placeholder.com/400x300?text=Mock+Image',
                    'url' => 'https://via.placeholder.com/400x300?text=Mock+Image',
                    'format' => 'jpg',
                    'width' => 400,
                    'height' => 300,
                    'bytes' => $file->getSize(),
                    'original_filename' => $file->getClientOriginalName()
                ];
            } catch (\Exception $e) {
                $errors[] = "Failed to upload {$file->getClientOriginalName()}: " . $e->getMessage();
            }
        }

        return [
            'success' => empty($errors),
            'results' => $results,
            'errors' => $errors
        ];
    }

    /**
     * Delete multiple images (mock implementation)
     */
    public function deleteMultipleImages(array $publicIds): array
    {
        $errors = [];

        foreach ($publicIds as $publicId) {
            try {
                // Mock deletion - just log it
                Log::info("Mock deletion of image: {$publicId}");
            } catch (\Exception $e) {
                $errors[] = "Failed to delete {$publicId}: " . $e->getMessage();
            }
        }

        return [
            'success' => empty($errors),
            'errors' => $errors
        ];
    }
}

