<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Spatie\PdfToText\Pdf;

class QuizController extends Controller
{
    public function generate(Request $request)
    {
        // 1. I-validate ang required fields including difficulty
        $request->validate([
            'module_file' => 'required|mimes:pdf|max:10000',
            'difficulty' => 'nullable|in:easy,medium,hard',
        ]);

        // 2. Kunin ang file at basahin ang text
        $file = $request->file('module_file');
        $text = Pdf::getText($file->getPathname());

        // 3. Kunin ang difficulty level (default: medium)
        $difficulty = $request->input('difficulty', 'medium');
        
        // 4. I-setup ang Prompt para sa AI with difficulty consideration
        $difficultyGuide = $this->getDifficultyGuide($difficulty);
        
        $prompt = "You are a math teacher. Read this module text: " . substr($text, 0, 5000) . " 
        
Difficulty Level: " . strtoupper($difficulty) . "
" . $difficultyGuide . "

Generate a 15-item pre-test and a 15-item post-test based ONLY on this text. 
Output MUST be pure JSON format. Do not use markdown blocks like ```json.
Structure:
{
    \"pre_test\": [ {\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"A\"} ],
    \"post_test\": [ {\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"A\"} ]
}";

        // 5. Tawagin ang Gemini API
        $apiKey = env('GEMINI_API_KEY');
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$apiKey}", [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ]
        ]);

        // 6. Kunin ang JSON response ng AI at ibato pabalik sa frontend
        $aiResult = $response->json();
        $generatedText = $aiResult['candidates'][0]['content']['parts'][0]['text'];
        
        // Convert ang string ng AI into actual PHP Array/JSON object
        $quizData = json_decode($generatedText);

        return response()->json([
            'status' => 'success',
            'difficulty' => $difficulty,
            'data' => $quizData
        ]);
    }

    /**
     * Get difficulty-specific instructions for the AI
     */
    private function getDifficultyGuide(string $difficulty): string
    {
        $guides = [
            'easy' => 'Question Guidelines for EASY difficulty:
- Focus on fundamental concepts and definitions
- Use straightforward calculations with no complex multi-step problems
- Include memory-based questions about key terms and formulas
- Questions should be answerable by someone learning the basics
- Keep calculations simple and clear',
            
            'medium' => 'Question Guidelines for MEDIUM difficulty:
- Mix foundational understanding with application
- Include some calculations and problem-solving scenarios
- Questions should require understanding concepts, not just memorization
- Moderate complexity with typical textbook-level problems
- Include some conceptual reasoning alongside computational skills',
            
            'hard' => 'Question Guidelines for HARD difficulty:
- Focus on deep understanding and complex application
- Include multi-step problems requiring strategic thinking
- Challenge assumptions and require synthesis of multiple concepts
- Advanced calculations and real-world application scenarios
- Questions that differentiate between surface-level and deep understanding',
        ];

        return $guides[$difficulty] ?? $guides['medium'];
    }

    /**
     * Get Groq API key securely from backend
     * Prevents API key exposure in frontend code
     */
    public function getGroqKey()
    {
        try {
            // Try to get OpenRouter key first, fallback to Groq if needed
            $key = config('services.openrouter.key') ?? config('services.groq.key') ?? env('OPENROUTER_API_KEY') ?? env('GROQ_API_KEY');
            
            if (!$key) {
                Log::error('OpenRouter/Groq API key not found in config or environment');
                return response()->json([
                    'error' => 'API key not configured on server'
                ], 500);
            }

            Log::info('Returning API key to authenticated user');
            return response()->json([
                'key' => $key
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getGroqKey: ' . $e->getMessage());
            return response()->json([
                'error' => 'Server error retrieving API key'
            ], 500);
        }
    }
}