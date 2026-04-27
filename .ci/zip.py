import sys
args = (sys.argv[1] if len(sys.argv) >= 2 else '0.1.0').split('.')
if len(sys.argv) >= 4:
	input = sys.argv[2]
	output = sys.argv[3]
	version = [int(args[0][-2:]), int(args[1]), int(args[2])]
	data = None
	with open(input, 'rb') as f:
		data = f.read()

	with open(output, 'wb') as f:
		f.write(bytes(version))
		f.write(data)