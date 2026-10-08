# Phase 17 - AWS Deployment

Target: Week 6

## Checklist

- [x] Chose AWS Lambda (container image) over EC2
- [x] Added the AWS Lambda Web Adapter to the existing Docker image as a Lambda Extension — the unmodified `uvicorn` server runs on Lambda with zero app code changes
- [x] Pushed the image to ECR and created the Lambda function with a Function URL
- [x] Pointed Twilio's Voice webhook and `PUBLIC_BASE_URL` at the Function URL, retiring ngrok entirely
- [x] Pointed the mobile app's `API_BASE_URL` at the Function URL, so the app works from any network, not just home Wi-Fi
- [x] Verified the milestone live: backend, Docker container and ngrok all stopped on the Mac, real call placed — handled correctly by Lambda alone, including a live transfer

## Why Lambda, not EC2

AWS changed its new-account free tier in July 2025 to a $200 credit over 6 months, after which the account must upgrade or close. Lambda's "Always Free" allowance (1M requests + 400,000 GB-seconds per month) is permanent regardless of account age, and a personal call screener uses a tiny fraction of it. Lambda also needs no server patching.

## Deploying

```bash
IMG="<account>.dkr.ecr.us-east-1.amazonaws.com/ai-phone-assistant-backend:latest"
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build --platform linux/arm64 --provenance=false --sbom=false -t "$IMG" backend
docker push "$IMG"
aws lambda update-function-code --function-name ai-phone-assistant-backend --image-uri "$IMG"
```

Quote `"$IMG"` — in zsh, an unquoted `$REPO:latest` is read as the `:l` (lowercase) modifier and silently mangles the image name.

Secrets (`DATABASE_URL`, `OPENAI_API_KEY`, `API_SECRET`, `TWILIO_AUTH_TOKEN`, `PUBLIC_BASE_URL`, `TRANSFER_PHONE_NUMBER`) are Lambda environment variables, never baked into the image (`.dockerignore` excludes `.env`).

## Gotchas hit

1. **Image manifest rejected by Lambda.** Docker BuildKit adds attestation/provenance manifests that Lambda doesn't support. Fixed with `--provenance=false --sbom=false`.
2. **Architecture mismatch.** The image builds as `arm64` on Apple Silicon, but `create-function` defaults to x86_64. Fixed by passing `--architectures arm64` explicitly.
3. **Function URL returned 403** even with `lambda:InvokeFunctionUrl` granted. Since October 2025 AWS also requires `lambda:InvokeFunction` on the resource policy; added both.

## Notes

- The Function URL uses `AuthType: NONE`. Access control is still enforced at the app level: API-key middleware for app endpoints and Twilio signature verification for `/voice/*` (Phase 14).
- The Twilio Fallback URL from Phase 15 still covers the case where Lambda itself is unreachable.
- Supabase's free tier pauses the database after about a week without activity. When that happens the backend returns 500s and calls fall back to the apology message until the project is resumed from the Supabase dashboard.

## Completion milestone

The assistant runs 24/7 without the Mac — verified by shutting down every local process and handling a real call through Lambda alone.

**Actual completion date: 2026-09-25**
