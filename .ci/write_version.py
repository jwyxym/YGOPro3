import sys
args = (sys.argv[1] if len(sys.argv) >= 2 else '0.1.0').split('.')
version = f"{args[0]}.{int(args[1])}.{int(args[2])}"
with open('version.txt', 'w', encoding='utf-8') as f:
	f.write(f"YGOPro3://{version}")