DOCKER_NAME := oeko-flotte
APP := oeko-flotte

run:
	gulp serve

build:
	gulp build

deploy: build-docker tag-docker
	docker push registry.heroku.com/$(APP)/web

packages:
	npm install

install: packages fake

prune:
	npm prune

build-docker:
	docker build -t $(DOCKER_NAME) .

tag-docker:
	docker tag $(DOCKER_NAME) registry.heroku.com/$(APP)/web

save-docker: build-docker
	docker save $(DOCKER_NAME) > $(DOCKER_NAME).tar

bundle-docker: save-docker
	gzip $(DOCKER_NAME).tar
