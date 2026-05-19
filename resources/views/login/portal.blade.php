<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    @php
        $config = match($portalType) {
            'admin'   => ['title' => 'Admin',   'icon' => 'admin.png',   'color' => '#0052a3', 'loginRoute' => 'admin.login.submit',   'registerRoute' => 'admin.register'],
            'teacher' => ['title' => 'Teacher', 'icon' => 'teacher.png', 'color' => '#0052a3', 'loginRoute' => 'teacher.login.submit', 'registerRoute' => 'teacher.register'],
            default   => ['title' => 'Student', 'icon' => 'student.png', 'color' => '#0052a3', 'loginRoute' => 'student.login.submit', 'registerRoute' => 'student.register'],
        };
    @endphp

    <title>{{ $config['title'] }} Portal | Bubog NHS</title>
    <link rel="icon" href="{{ asset('image/logo-removebg-preview.png') }}">

    @vite([
        'resources/css/login/portal.css',
        'resources/js/login/portal.js'
    ])

    <style>
        :root { --portal-color: {{ $config['color'] }}; }
    </style>
</head>
<body>

<div class="main-container">
    <a href="{{ url('/') }}" class="back-home">← Back to Home</a>

    <div class="portal-card" id="portal-card">

        <div class="form-side">
            <div class="form-content">

                <div class="icon-header">
                    <img src="{{ asset('image/' . $config['icon']) }}" alt="{{ $config['title'] }} Icon">
                </div>

                <h1>{{ $config['title'] }} Portal</h1>
                <p id="sub-text">Sign in to your account</p>

                @if ($errors->any())
                    <div class="alert alert-danger">
                        <ul style="margin: 0; padding-left: 20px;">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <div class="tab-switcher">
                    <button id="login-tab" type="button" class="active">Login</button>
                    <button id="signup-tab" type="button">Sign Up</button>
                </div>

                {{-- LOGIN FORM --}}
                <div id="login-form-container">
                    <form method="POST" action="{{ route($config['loginRoute']) }}" autocomplete="off">
                        @csrf

                        {{-- Dummy inputs to trick browser autofill --}}
                        <input type="email" style="display:none" aria-hidden="true">
                        <input type="password" style="display:none" aria-hidden="true">

                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" name="email" placeholder="Enter your email" value="{{ old('email') }}" autocomplete="off" required>
                        </div>

                        <div class="input-group">
                            <label>Password</label>
                            <input type="password" name="password" placeholder="Enter your password" autocomplete="new-password" required>
                        </div>

                        <button type="submit" class="btn-sign">Sign In</button>
                    </form>
                </div>

                {{-- SIGNUP FORM --}}
                <div id="signup-form-container" class="hidden">
                    <form method="POST" action="{{ route($config['registerRoute']) }}" autocomplete="off">
                        @csrf

                        {{-- Dummy inputs to trick browser autofill --}}
                        <input type="text" style="display:none" aria-hidden="true">
                        <input type="email" style="display:none" aria-hidden="true">
                        <input type="password" style="display:none" aria-hidden="true">

                        <div class="input-group">
                            <label>Username</label>
                            <input type="text" name="name" placeholder="Enter your Username" value="{{ old('name') }}" autocomplete="off" required>
                        </div>

                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" name="email" placeholder="Enter your Email" value="{{ old('email') }}" autocomplete="off" required>
                        </div>

                        <div class="input-group">
                            <label>Password</label>
                            <input type="password" name="password" placeholder="Enter your Password" autocomplete="new-password" required>
                        </div>

                        <div class="input-group">
                            <label>Confirm Password</label>
                            <input type="password" name="password_confirmation" placeholder="Confirm your Password" autocomplete="new-password" required>
                        </div>

                        <button type="submit" class="btn-sign">Create Account</button>
                    </form>
                </div>

            </div>
        </div>

        <div class="image-side" id="image-side">
            <div class="logo-wrapper">
                <img
                    src="{{ asset('image/logo-removebg-preview.png') }}"
                    alt="School Logo"
                    class="school-logo"
                >
            </div>
        </div>

    </div>
</div>

<script>
    window.addEventListener('load', function () {
        document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]').forEach(function (input) {
            input.value = '';
        });
    });
</script>

</body>
</html>
