# SYSTEM Launchpad Setup Script (PowerShell)
Write-Host "🚀 SYSTEM Launchpad Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file. Please fill in your credentials." -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check Supabase CLI
Write-Host ""
Write-Host "🔍 Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI is installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Supabase CLI not found. Install it with:" -ForegroundColor Yellow
    Write-Host "   npm install -g supabase" -ForegroundColor Gray
}

# Check Node version
Write-Host ""
Write-Host "🔍 Checking Node.js version..." -ForegroundColor Yellow
node --version

# Type check
Write-Host ""
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Yellow
npm run type-check

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Fill in .env with your credentials"
Write-Host "2. Link Supabase: supabase link --project-ref your-project-ref"
Write-Host "3. Run migrations: supabase db push"
Write-Host "4. Deploy Edge Functions: supabase functions deploy"
Write-Host "5. Start dev server: npm run dev"
