# SYSTEM Launchpad - Deployment Guide

## Prerequisites

1. **Supabase Project** (Canada Central region)
   - Create project at https://supabase.com
   - Note your project URL and anon key
   - Get service role key from Settings > API

2. **Stripe Account**
   - Create account at https://stripe.com
   - Create a product with $97/month price
   - Note price ID
   - Set up webhook endpoint: `https://your-domain.com/api/billing/webhook`
   - Copy webhook signing secret

3. **GoHighLevel OAuth App**
   - Create OAuth app in GHL marketplace
   - Set redirect URI: `https://your-domain.com/api/crm/ghl/callback`
   - Note client ID and secret

4. **AI Services** (ISAIC-hosted)
   - DeepSeek-V3 API endpoint and key
   - Voxtral Mini 3B endpoint and key

5. **n8n Instance** (ISAIC-hosted)
   - Set up webhook endpoint for playbook triggers
   - Configure workflows for GHL sync

## Deployment Steps

### 1. Environment Setup

```bash
# Copy example env file
cp .env.example .env

# Fill in all required variables
# See .env.example for complete list
```

### 2. Supabase Setup

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Create storage bucket
# Run migration 003_storage_bucket.sql manually or via Supabase dashboard
# Or use: supabase storage create meeting-audio --public
```

### 3. Deploy Edge Functions

```bash
# Deploy transcription function
supabase functions deploy transcribe-meeting

# Deploy MeetingMind agent function
supabase functions deploy meetingmind-agent

# Set environment secrets for functions
supabase secrets set DEEPSEEK_API_KEY=your_key
supabase secrets set VOXTRAL_API_KEY=your_key
supabase secrets set VOXTRAL_API_URL=your_url
```

### 4. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - All NEXT_PUBLIC_* variables
# - All server-side secrets (STRIPE_SECRET_KEY, etc.)
```

### 5. Post-Deployment Checklist

- [ ] Verify Supabase RLS policies are active
- [ ] Test user signup and org creation
- [ ] Test meeting upload and transcription
- [ ] Test GHL OAuth connection
- [ ] Test Stripe checkout flow
- [ ] Verify webhook endpoints are accessible
- [ ] Test playbook trigger from n8n
- [ ] Verify audit logs are being created
- [ ] Check data residency (all in Canada)

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase service role key never exposed to client
- [ ] Stripe webhook secret configured
- [ ] RLS policies tested for tenant isolation
- [ ] OAuth redirect URIs match exactly
- [ ] Storage bucket policies restrict access by org
- [ ] Audit logging enabled and tested

## Monitoring

- Monitor Supabase dashboard for:
  - Database performance
  - Edge function invocations
  - Storage usage
  - Auth events

- Monitor Vercel for:
  - API route performance
  - Error rates
  - Function execution times

- Set up alerts for:
  - Failed transcriptions
  - Failed CRM syncs
  - Stripe webhook failures
  - High error rates

## Troubleshooting

### Transcription Fails
- Check Voxtral API key and endpoint
- Verify audio file is accessible
- Check Edge function logs in Supabase

### CRM Sync Fails
- Verify GHL OAuth tokens are valid
- Check token refresh logic
- Verify webhook payload format

### Stripe Webhook Fails
- Verify webhook secret matches
- Check webhook endpoint is accessible
- Review Stripe dashboard for event logs

### RLS Policy Issues
- Verify user has organization_id set
- Check policy conditions match data structure
- Test with different user roles
