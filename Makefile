#
# Author: Thomas Weckert (thomas.weckert@ecube.de)
#

# the default target is the first target whose name does not start with a dot '.'
all: clean install build

clean:
	@rm -rf dist/
	@npm cache clear --force

uninstall:
	@rm -rf node_modules/

install:
	@npm i -g @nestjs/cli
	@npm install

build:
	@nest build

run:
	@npm run start:dev

debug:
	@npm run start:debug

prod:
	@npm run start:prod

test:
	@npm run test
	@npm run test:cov

generate:
	@npm run generate:priceService
	@npm run generate:aggregator

service-pull:
	@docker-compose pull

service-build:
	@docker-compose build --no-cache --pull
	@docker rmi $$(docker images --filter "dangling=true" -q --no-trunc)

service-up:
	@docker-compose up

service-down:
	@docker-compose down --remove-orphans

docker-build:
	@docker build -t registry.gitlab.com/${GITLAB_PROJECT_NAMESPACE}/aggregator-backend .

docker-test:
	@docker build --target test -t registry.gitlab.com/${GITLAB_PROJECT_NAMESPACE}/aggregator-backend .

docker-clean:
	@docker-compose down --rmi all
