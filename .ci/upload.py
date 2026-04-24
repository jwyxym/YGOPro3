import sys
import json
import requests

token = sys.argv[1]
file_path = sys.argv[2]
file_name = file_path.split('/')[-1]
url = f"https://api.gitcode.com/api/v5/repos/jwyxym/YGOPro3/releases/release-latest/upload_url?access_token={token}&file_name={file_name}"

payload = {}
headers = {
	'Accept': 'application/json'
}
response = requests.request("GET", url, headers=headers, data=payload)
data = json.loads(response.text)
with open(file_path, "rb") as f:
    response = requests.put(
        data.get('url'),
        headers=data.get('headers'),
        data=f
    )
print(response.status_code)