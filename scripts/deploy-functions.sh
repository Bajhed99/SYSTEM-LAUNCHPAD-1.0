#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions"
echo "===================================="

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy transcription function
echo ""
echo "📤 Deploying transcribe-meeting function..."
supabase functions deploy transcribe-meeting

# Deploy MeetingMind agent function
echo ""
echo "📤 Deploying meetingmind-agent function..."
supabase functions deploy meetingmind-agent

echo ""
echo "✅ Functions deployed!"
echo ""
echo "Don't forget to set environment secrets:"
echo "  supabase secrets set DEEPSEEK_API_KEY=your_key"
echo "  supabase secrets set VOXTRAL_API_KEY=your_key"
echo "  supabase secrets set VOXTRAL_API_URL=your_url"
