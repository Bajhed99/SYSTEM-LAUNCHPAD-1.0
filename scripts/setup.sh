#!/bin/bash

# SYSTEM Launchpad Setup Script
echo "🚀 SYSTEM Launchpad Setup"
echo "========================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please fill in your credentials."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check Supabase CLI
echo ""
echo "🔍 Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is installed"
    supabase --version
else
    echo "⚠️  Supabase CLI not found. Install it with:"
    echo "   npm install -g supabase"
fi

# Check Node version
echo ""
echo "🔍 Checking Node.js version..."
node --version

# Type check
echo ""
echo "🔍 Running TypeScript type check..."
npm run type-check

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in .env with your credentials"
echo "2. Link Supabase: supabase link --project-ref your-project-ref"
echo "3. Run migrations: supabase db push"
echo "4. Deploy Edge Functions: supabase functions deploy"
echo "5. Start dev server: npm run dev"
