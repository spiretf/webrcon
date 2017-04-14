all: build

node_modules: package.json
	npm install

.PHONY: build
build: node_modules
	node node_modules/.bin/babel src --out-dir lib
