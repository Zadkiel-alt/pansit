<?php

use Tests\TestCase;

test('the application returns a successful response', function () {
    $response = $this->get('/');
    $response->assertStatus(200);
})->uses(TestCase::class);
