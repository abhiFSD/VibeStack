# Stripe Production Migration - Pending Items

## ✅ Completed
1. **Frontend publishable key updated** in `.env`:
   - `pk_live_51EIapQBrkA8Ed3JIXpDm6VkHagPuoHUxtwI8WZ7X5KEbxGNsBg0JvnSqhzag9VJ5eJ6D6CRWqBpu2ZrTIgQSUWfg00zQpeEdPr`

2. **Secret key updated** in `amplify/team-provider-info.json` for prod environment:
   - All 4 Lambda functions now have: `sk_live_YOUR_STRIPE_SECRET_KEY_HERE`

## ⚠️ Required Actions Before Deployment

### 1. Create Products in Stripe Dashboard
- [x] Products created in Stripe
- [x] Monthly price: $2.98/month - `price_1S93daBrkA8Ed3JIYFH81WzT`
- [x] Yearly price: $32.00/year - `price_1S93e0BrkA8Ed3JIGvDbi57W`

### 2. Update Price IDs in team-provider-info.json
- [x] Price IDs updated in `prod` section for both `handleSubscribe` and `createStripeCustomer`

### 3. Configure Webhook in Stripe Dashboard
- [x] Webhook configured at: `https://ht6jio0xrb.execute-api.us-west-2.amazonaws.com/prod/stripe-webhook`
- [x] Listening to 7 events (customer.subscription.deleted, customer.subscription.updated, invoice.created, invoice.paid, invoice.payment_succeeded, payment_intent.payment_failed, payment_intent.succeeded)
- [x] Webhook ID: `we_1SAaN9BrkA8Ed3JIfG56vjQT`

### 4. Update Webhook Secret in team-provider-info.json
- [x] Webhook secret updated: `whsec_YOUR_WEBHOOK_SECRET_HERE`

## 📝 Deployment Command
After completing all above steps:
```bash
amplify push
```

## ⚠️ Important Notes
- The `sk_live_` key is your SECRET key - never expose it in frontend code
- The `pk_live_` key is your PUBLISHABLE key - safe for frontend use
- Test with a small transaction first after deployment
- Monitor CloudWatch logs for any errors

## 🔄 Rollback Plan
If issues occur, update team-provider-info.json back to test keys:
- `sk_test_YOUR_STRIPE_SECRET_KEY_HERE`
- `price_1S93hEBrkA8Ed3JImDvkaXlo` (monthly)
- `price_1S93hEBrkA8Ed3JIMSOFe9w3` (yearly)
- `whsec_YOUR_WEBHOOK_SECRET_HERE`

Then run `amplify push` again.