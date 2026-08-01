<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" type="image/webp" href="{{ asset('Icon-512x512-px.webp') }}" />
        <link rel="apple-touch-icon" href="{{ asset('Icon-512x512-px.webp') }}" />

        <!-- Scripts -->
        @routes
        @php
            $manifestPath = public_path('build/manifest.json');
            $useVite = app()->environment('local') || !file_exists($manifestPath);
        @endphp
        @if ($useVite)
            @viteReactRefresh
            @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @else
            @php
                $manifest = json_decode(file_get_contents($manifestPath), true);
                $entry = $manifest['resources/js/app.jsx'] ?? [];
            @endphp
            <script type="module" src="{{ asset('build/' . ($entry['file'] ?? '')) }}"></script>
            @foreach ($entry['css'] ?? [] as $css)
                <link rel="stylesheet" href="{{ asset('build/' . $css) }}" />
            @endforeach
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-neutral-100">
        @inertia
    </body>
</html>
