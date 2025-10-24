# Data Anonymization Service - Full Stack Application

This project is a full-stack web application for anonymizing personal data, built with a React frontend and a Node.js/Express backend, orchestrated by Docker Compose.

## Architecture

The application is composed of two main services:

-   **`frontend`**: A React application built with TypeScript and styled with Tailwind CSS. It is served by a lightweight Nginx web server. It provides the user interface for inputting text and viewing anonymization results.
-   **`backend`**: A Node.js/Express API written in TypeScript. It exposes an `/anonymize` endpoint that contains the core logic for identifying and processing Personal Identifiable Information (PII).

## Prerequisites

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## How to Run

1.  **Clone the repository** and navigate to the project's root directory (where `docker-compose.yml` is located).

2.  **Build and run the services** using Docker Compose. Open your terminal and execute the following command:

    ```bash
    docker-compose up --build
    ```

    This command will:
    -   Build the Docker image for the `backend` service.
    -   Build the Docker image for the `frontend` service.
    -   Start both containers and connect them on a shared network.

3.  **Access the application:**
    -   The **Frontend UI** will be available at [http://localhost:3000](http://localhost:3000).
    -   The **Backend API** will be listening on [http://localhost:8000](http://localhost:8000).

## Development

The `docker-compose.yml` is configured to support live-reloading for the backend service. Any changes you make to the files in `backend/src` will automatically restart the Node.js server.

To stop the application, press `Ctrl + C` in the terminal where `docker-compose` is running.
