<?php

use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Controllers\TeacherDashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ChatbotController;

// Gawin itong ganito sa web.php
Route::post('/chatbot/ask', [ChatbotController::class, 'ask'])->name('chatbot.ask');
/*----------- Homepage -----------*/
Route::get('/', function () {
    return view('glenn.homepage');
})->name('homepage');

// ============ STUDENT ROUTES ============
Route::prefix('student')->group(function () {
    // Login
    Route::get('/login', [AuthController::class, 'showStudentLoginForm'])->name('student.login');
    Route::post('/login', [AuthController::class, 'studentLogin'])->name('student.login.submit');
    
    // Register
    Route::get('/register', [AuthController::class, 'showStudentRegisterForm'])->name('student.register.form');
    Route::post('/register', [AuthController::class, 'studentRegister'])->name('student.register');
    
    // Dashboard (Protected with role middleware)
    Route::middleware(['auth', 'role:student'])->group(function () {
        Route::get('/dashboard', [StudentDashboardController::class, 'index'])->name('student.dashboard');
        Route::get('/modules', function () {
            return view('dashboard.module');
        })->name('student.modules');
        Route::post('/logout', [AuthController::class, 'logout'])->name('student.logout');

    });
});

// ============ TEACHER ROUTES ============
Route::prefix('teacher')->group(function () {
    // Login
    Route::get('/login', [AuthController::class, 'showTeacherLoginForm'])->name('teacher.login');
    Route::post('/login', [AuthController::class, 'teacherLogin'])->name('teacher.login.submit');
    
    // Register
    Route::get('/register', [AuthController::class, 'showTeacherRegisterForm'])->name('teacher.register.form');
    Route::post('/register', [AuthController::class, 'teacherRegister'])->name('teacher.register');
    
    // Dashboard (Protected with role middleware)
    Route::middleware(['auth', 'role:teacher'])->group(function () {
        Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('teacher.dashboard');
        Route::post('/logout', [AuthController::class, 'logout'])->name('teacher.logout');
        Route::post('/teacher/generate-quiz', [QuizController::class, 'generate'])->name('quiz.generate');
    });
});

// ============ API ROUTES ============
Route::get('/api/test', function() {
    return response()->json(['message' => 'API routing works']);
})->name('api.test');

// Get Groq API key (protected by auth middleware)
Route::get('/api/get-groq-key', [QuizController::class, 'getGroqKey'])->name('api.get-groq-key')->middleware('auth');

// ============ ADMIN ROUTES ============
Route::prefix('admin')->group(function () {
    // Login
    Route::get('/login', [AuthController::class, 'showAdminLoginForm'])->name('admin.login');
    Route::post('/login', [AuthController::class, 'adminLogin'])->name('admin.login.submit');
    
    // Register
    Route::get('/register', [AuthController::class, 'showAdminRegisterForm'])->name('admin.register.form');
    Route::post('/register', [AuthController::class, 'adminRegister'])->name('admin.register');
    
    // Dashboard (Protected with role middleware)
    Route::middleware(['auth', 'role:admin'])->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
        Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');
    });
});
