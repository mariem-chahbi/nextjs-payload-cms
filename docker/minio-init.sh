#!/bin/sh
# Creates the private bucket and an app user that can only touch that bucket.
# Idempotent: every step can run again on an existing setup.
# Note: the mc image is minimal (no sed/awk), so the policy is written with a heredoc.
set -eu

ALIAS=local
POLICY=payload-playground-app

mc alias set "$ALIAS" http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null

mc mb --ignore-existing "$ALIAS/$MINIO_BUCKET"
mc anonymous set none "$ALIAS/$MINIO_BUCKET"

cat > /tmp/policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"],
      "Resource": ["arn:aws:s3:::${MINIO_BUCKET}"]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::${MINIO_BUCKET}/*"]
    }
  ]
}
EOF
mc admin policy create "$ALIAS" "$POLICY" /tmp/policy.json

# `user add` updates the secret if the user already exists.
mc admin user add "$ALIAS" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
mc admin policy attach "$ALIAS" "$POLICY" --user "$MINIO_ACCESS_KEY" 2>/dev/null || echo "policy already attached"

echo "MinIO ready: bucket '$MINIO_BUCKET' (private), app user '$MINIO_ACCESS_KEY' limited to it."
