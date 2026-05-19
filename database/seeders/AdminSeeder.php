<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin',
            'email' => 'tardio@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);
        User::create([
            'name' => 'Admin',
            'email' => 'carman@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);
        User::create([
            'name' => 'Admin',
            'email' => 'villamor@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);User::create([
            'name' => 'Admin',
            'email' => 'tamayuza@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);User::create([
            'name' => 'Admin',
            'email' => 'embanecido@gmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);
    }
}
