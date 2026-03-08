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
response = None
while response is None or response.status_code == 401:
	response = requests.request("GET", url, headers=headers, data=payload)
	data = json.loads(response.text)
	files = {"file": (file_name, open(file_path, "rb"), "application/octet-stream")}
	response = requests.request("PUT", data.get('url'), headers=data.get('headers'), files=files)
	print(response.text)