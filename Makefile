DOCKER_NAME := oeko-flotte
HEROKU_APP := oeko-flotte

run:
	gulp serve

build:
	gulp build

deploy:
	heroku container:push -a ${HEROKU_APP}

packages:
	npm install

install: packages fake

prune:
	npm prune

build-docker:
	docker build -t $(DOCKER_NAME) .

save-docker: build-docker
	docker save $(DOCKER_NAME) > $(DOCKER_NAME).tar

bundle-docker: save-docker
	gzip $(DOCKER_NAME).tar
