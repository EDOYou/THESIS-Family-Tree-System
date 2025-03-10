# Family Tree Backend

## Overview
This project is the backend for the Family Tree system, developed using Spring Boot and PostgreSQL. The backend allows users to create, edit, and manage family tree records through a REST API.

## Tech Stack
- **Spring Boot 3.4.2** (Java 17)
- **PostgreSQL** (via Docker)
- **Spring Data JPA** (for database interactions)
- **Lombok** (for reducing boilerplate code)
- **Maven** (for dependency management)

## Setup Guide
### 1. Setting Up PostgreSQL with Docker
First, pull the latest PostgreSQL image:
`docker pull postgres:latest`

Run the PostgreSQL container:
```shell

docker run --name container_name \
    -e POSTGRES_USER=username \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=db_name \
    -p 5432:5432 \
    -d postgres
```

#### Explanation:
- `--name container_name` → Assigns a name to the container
- `-e POSTGRES_USER=username` → Sets the username
- `-e POSTGRES_PASSWORD=password` → Sets the password
- `-e POSTGRES_DB=db_name` → Creates a database named db_name
- `-p 5432:5432` → Maps PostgreSQL’s port 5432 to localhost
- `-d postgres` → Runs the container in detached mode

### 2. Verify the Database is Running
Check if the container is running:
```shell
  docker ps
```

To view container logs:
```shell
  docker logs container_name
```

To access PostgreSQL inside the container:
```sh
  docker exec -it container_name psql -U user_name -d db_name
```

### 3. Configuring Spring Boot Database Connection
Modify `application.yml` to connect to PostgreSQL:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/db_name
    username: $USER_NAME
    password: $USER_PASSWORD
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

### 4. Running the Spring Boot Application
Ensure Maven dependencies are installed:
```shell
  mvn clean install
```

Run the application:
```shell
mvn spring-boot:run
```

## Project Structure
```bash
  com.familytree
  ├── controller
  │   ├── FamilyTreeController.java
  │   ├── MarriageController.java
  │
  ├── model
  │   ├── Person.java
  │   ├── Marriage.java
  │
  ├── repository
  │   ├── FamilyMemberRepository.java
  │   ├── MarriageRepository.java
  │
  ├── service
  │   ├── FamilyMemberService.java
  │   ├── MarriageService.java
  │
  ├── FamilyTreeApplication.java
  ├── resources
  │   ├── application.yml
  ├── test
  │   ├── FamilyTreeApplicationTests.java
```

## API Endpoints
### Family Member Endpoints
| Method | Endpoint                   | Description                 |
|--------|----------------------------|-----------------------------|
| GET    | `/api/family/members`      | Retrieve all family members |
| GET    | `/api/family/members/{id}` | Retrieve a specific member  |
| POST   | `/api/family/members`      | Add a new family member     |
| DELETE | `/api/family/members/{id}` | Delete a family member      |

### Marriage endpoints
| Method | Endpoint                | Description             |
|--------|-------------------------|-------------------------|
| GET    | `/api/family/marriages` | Retrieve all marriages  |
| POST   | `/api/family/marriages` | Register a new marriage |















