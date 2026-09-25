FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Lets this exact image run on AWS Lambda unmodified (Phase 17) — the
# adapter is a Lambda Extension that proxies invocations to the normal
# HTTP server below. It's a no-op outside Lambda, so `docker run`/
# `docker compose` (Phase 16) behave identically to before.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 \
    /lambda-adapter /opt/extensions/lambda-adapter
ENV AWS_LWA_PORT=8000

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
