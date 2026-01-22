# Deploy Supabase Edge Functions (PowerShell)
Write-Host "🚀 Deploying Supabase Edge Functions" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if logged in to Supabase
try {
    supabase projects list | Out-Null
} catch {
    Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy transcription function
Write-Host ""
Write-Host "📤 Deploying transcribe-meeting function..." -ForegroundColor Yellow
supabase functions deploy transcribe-meeting

# Deploy MeetingMind agent function
Write-Host ""
Write-Host "📤 Deploying meetingmind-agent function..." -ForegroundColor Yellow
supabase functions deploy meetingmind-agent

Write-Host ""
Write-Host "✅ Functions deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "Don't forget to set environment secrets:" -ForegroundColor Cyan
Write-Host "  supabase secrets set DEEPSEEK_API_KEY=your_key"
Write-Host "  supabase secrets set VOXTRAL_API_KEY=your_key"
Write-Host "  supabase secrets set VOXTRAL_API_URL=your_url"
