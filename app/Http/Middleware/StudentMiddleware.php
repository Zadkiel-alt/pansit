<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class StudentMiddleware
{
    public function handle($request, Closure $next)
    {
        if (!Auth::check() || Auth::user()->role !== 'student') {
            return redirect()->route('homepage')
                ->withErrors(['access' => 'Unauthorized access.']);
        }

        return $next($request);
    }
}
