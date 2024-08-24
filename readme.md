# Identity and Main Server

This repository contains two key components: an **Identity Server** and a **Main Server**. The Identity Server handles user authentication and Single Sign-On (SSO) operations, while the Main Server interacts with the Identity Server for login, SSO status checks, and logout functionalities.

## Overview

### Identity Server

- **Port**: `3001`
- **Responsibilities**:
  - Handle login requests and issue UUIDs and access tokens.
  - Provide endpoints to check SSO status and retrieve access tokens.
  - Support logout functionality, including notifying external redirect URLs.

### Main Server

- **Port**: `3000`
- **Responsibilities**:
  - Handle login requests and redirect to the Identity Server.
  - Check SSO status and handle logout requests.
  - Provide an API endpoint for testing access with the provided SSO ID.

