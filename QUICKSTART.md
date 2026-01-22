# SYSTEM Launchpad - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies ✅
```bash
npm install
```
**Status:** ✅ Already completed

### Step 2: Configure Environment

1. Copy the example environment file:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:
   - **Supabase**: Get from https://supabase.com/dashboard
   - **Stripe**: Get from https://dashboard.stripe.com/apikeys
   - **GHL**: Get from GoHighLevel marketplace
   - **AI Services**: Get from ISAIC/your providers

### Step 3: Set Up Supabase

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```
(Find your project ref in Supabase dashboard URL)

4. Run migrations:
```bash
supabase db push
```

5. Create storage bucket:
```bash
supabase storage create meeting-audio --public
```

6. Deploy Edge Functions:
```bash
# Deploy transcription function
supabase functions deploy transcribe-meeting

# Deploy MeetingMind agent
supabase functions deploy meetingmind-agent

# Set secrets
supabase secrets set DEEPSEEK_API_KEY=your_key
supabase secrets set VOXTRAL_API_KEY=your_key
supabase secrets set VOXTRAL_API_URL=your_url
```

#### Option B: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Create new project (select **Canada Central** region)
3. Go to SQL Editor
4. Run migrations manually:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Copy contents of `supabase/migrations/002_rls_policies.sql`
   - Copy contents of `supabase/migrations/003_storage_bucket.sql`
   - Copy contents of `supabase/migrations/004_playbook_trigger.sql`
5. Go to Storage → Create bucket `meeting-audio` (public)
6. Go to Edge Functions → Deploy manually or use CLI

### Step 4: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### Step 5: Test the Flow

1. **Sign Up**: Create an account at `/auth/signup`
2. **Subscribe**: Go to `/billing` and subscribe (use Stripe test mode)
3. **Upload Meeting**: Go to Dashboard → MeetingMind → Upload audio
4. **View Results**: Check transcript and action items

## 🔧 Troubleshooting

### "Supabase CLI not found"
```bash
npm install -g supabase
```

### "Environment variables not set"
- Make sure `.env` file exists
- Check all variables are filled in
- Restart dev server after changing `.env`

### "RLS Policy Error"
- Verify migrations ran successfully
- Check `user_profiles` table has your user
- Ensure `organization_id` is set correctly

### "Storage bucket not found"
- Create bucket manually in Supabase dashboard
- Or run: `supabase storage create meeting-audio --public`

### "Edge Function deployment failed"
- Make sure you're logged in: `supabase login`
- Check you're linked to correct project: `supabase projects list`
- Verify function files exist in `supabase/functions/`

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Supabase migrations run on production database
- [ ] Storage bucket created and configured
- [ ] Edge Functions deployed
- [ ] Stripe webhook endpoint configured
- [ ] GHL OAuth redirect URI matches production URL
- [ ] Test full user flow end-to-end
- [ ] Verify RLS policies work correctly
- [ ] Check audit logs are being created

## 🎯 Next Steps

1. **Configure Stripe Webhook**:
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/billing/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook signing secret to `.env`

2. **Set Up GHL OAuth**:
   - Go to GoHighLevel Marketplace
   - Create OAuth app
   - Set redirect URI: `https://your-domain.com/api/crm/ghl/callback`
   - Copy client ID and secret to `.env`

3. **Configure n8n**:
   - Set up webhook endpoint
   - Configure GHL sync workflow
   - Add webhook URL to `.env`

4. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   - Add all environment variables in Vercel dashboard
   - Set up custom domain (optional)

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [Project Summary](./PROJECT_SUMMARY.md) - Architecture overview
- [README](./README.md) - Full project documentation

## 🆘 Need Help?

Check the logs:
- Next.js: Console output from `npm run dev`
- Supabase: Dashboard → Logs
- Edge Functions: Dashboard → Edge Functions → Logs
