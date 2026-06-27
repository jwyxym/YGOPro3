import sys
import boto3
from botocore.config import Config

args = sys.argv[1:]

endpoint = args[0]
access_key = args[1]
secret_key = args[2]
bucket = args[3]
key = args[4]
content_type = args[5]
body = args[6]

s3 = boto3.client(
    "s3",
    endpoint_url=endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name="us-east-1",
    config=Config(signature_version="s3v4")
)

s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=body,
    ContentType=content_type
)