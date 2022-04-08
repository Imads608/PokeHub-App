# Pokehub

This project is a clone of Pokemon Showdown with some differences.
Here are the features of this app planning to be included
- Public Chat Rooms
- Private Conversations (DMs)
- Private Group Chats
- Full Pokedex Catalog of All Generations
- Team Builder and Battle Simulator (latest Generation for now but can potentially include older)

**Architecture**

This project follows the Microservice paradigm with breaking up the application into multiple modules.
There are various technologies used to accomplish this mentioned below.


## Tech Stack

Since this has a distributed architecture, there are many components in order to make this as reliable as possible.
The Tech stack is split into separate sections mentioned below.

###### Database

- PostgreSQL
  - For User Data, Chat Rooms and Messages
- MongoDB
  - For storing Pokedex related information

Note: The Database choices could change later on depending on performance.

###### Backend Services
Nest.js Apps with Typescript and TypeORM used for Data Modelling

###### Frontend
Next.js with Typescript

###### Communication Protocols
- Service to Service Communication
  - RabbitMQ
  - Nest.js TCP
  - REST
  - gRPC (to be added)
- Frontend to Backend and vice versa
  - REST
  - Websockets

###### Deployment and Environment
Docker and Kubernetes.
The idea is that every service has an image which is run on Kubernetes.
This includes the database and other persistent stores as well.

The images are hosted [GitLab](https://gitlab.com/imadsheriff97/PokeHub-App/container_registry)

###### Logging
The plan here is to use Winston for the application level logs and use Fluentd and Loki for aggregation and storage.

###### Observability
Jaeger or OpenTelemetry

###### Metrics and Resources Analysis
Prometheus

###### Visualization
Grafana

###### Tooling
Nx MonoRepo
