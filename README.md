# Monorepo for Mojaloop

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) 18, 20 or 22
- [Docker](https://docs.docker.com/get-docker/) (and docker-compose)

## Setup

1. Install rush

    ```sh
    npm install -g @microsoft/rush
    ```

1. Clone the repository

    ```sh
    git clone https://github.com/mojaloop/mono.git
    ```

1. Clone the submodules

    ```sh
    cd mono
    git submodule update --init
    ```

1. Install the dependencies

    ```sh
    rush update
    ```

1. Build

   The build is needed due to some TypeScript dependencies.

    ```sh
    rush build
    ```

1. Create the containers

    ```sh
    cd hub
    docker-compose up -d --wait
    ```

1. Create the MySQL schemas

    ```sh
    cd hub
    npm run migrate
    ```

## Running and testing

There are two scripts in the repository root to help with running and testing
the hub:
`hub.sh` and `watch.sh`. The script `watch.sh` is useful for development,
as it will restart the services when files change.
The following commands are available:

- `./hub.sh start --help` - show the available options, which allow only part
of the Mojaloop services to be started.
- `./hub.sh start -dal` - for example will start discovery,
agreement and ledger services.
- `./hub.sh start` - without options will start all the Mojaloop services,
simulators and the test toolkit
- `./hub.sh test provision` - provision for testing
- `./hub.sh test gp` - run the GP tests
- `./hub.sh test settlement` - run the settlement tests
