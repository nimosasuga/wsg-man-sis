<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);

        // Railway and the final domain must stay HTTPS. During first VPS setup we
        // access the app through its raw HTTP IP, which cannot serve HTTPS yet.
        if ($this->app->environment('production') && $appHost && ! filter_var($appHost, FILTER_VALIDATE_IP)) {
            URL::forceScheme('https');
        }
    }
}
