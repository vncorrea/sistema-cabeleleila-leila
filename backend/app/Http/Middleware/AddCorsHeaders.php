<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Throwable;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AddCorsHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->withHeaders([
                    'Access-Control-Allow-Origin' => $request->header('Origin', '*'),
                    'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Accept, Authorization',
                    'Access-Control-Max-Age' => '86400',
                ]);
        }

        try {
            $response = $next($request);
        } catch (Throwable $e) {
            Log::error('API exception', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            $response = response()->json(
                ['message' => config('app.debug') ? $e->getMessage() : 'Internal server error'],
                500
            );
        }

        $origin = $request->header('Origin', '*');
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
