# Levelup Security

Main access for LevelUp Applications

# To get Started
 1. Please ask someone the `.env`.
 2. Download the project.
 3. CD into the root project and run: `npm install`
 4. Run `npm run dev`.

# Redis on Dev mode.

 - This application uses **Redis** , so in order to get started locally follow these steps:
    1. On the root project please run `docker-compose up`
    2. On any terminal for Redis cli you can use `redis-insight` (Download here)[https://redislabs.com/redis-enterprise/redis-insight/]
    3. Or if you want you can run the `redis-cli` via **docker**  running on any terminal :  `docker run -it --network securitylul_default --rm redis redis-cli -h redislul`

# Notes on developing:
    - Linters and Format are added to this project so please everytime you submit a PR, run the command: `npm run prettify`, and fix any errors that pops up.
 