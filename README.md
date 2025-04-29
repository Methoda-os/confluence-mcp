# conf-mcp

A FastMCP-based microservice for interacting with Atlassian Confluence Cloud and Jira Cloud APIs. Provides tools for searching, listing, and retrieving Confluence pages and users using CQL and REST endpoints.

## Features

- Search Confluence pages using CQL (Confluence Query Language)
- Retrieve Confluence page content by ID
- List all pages in a Confluence space
- List children of a Confluence page
- List all pages created by a specific user
- Search for Atlassian users by email or display name (Jira Cloud API)
- Built-in documentation for CQL syntax and usage

## Requirements

- Node.js (v18+ recommended)
- [pnpm](https://pnpm.io/) (for dependency management)
- Atlassian Confluence Cloud and/or Jira Cloud account with API access

## Setup

1. **Clone the repository:**

   ```sh
   git clone <your-repo-url>
   cd conf-mcp
   ```

2. **Install dependencies:**

   ```sh
   pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root with the following variables:

   ```env
   ATLAS_USER=your-email@example.com
   ATLAS_KEY=your-api-token
   ATLAS_BASEURL=https://your-domain.atlassian.net
   ```

   - `ATLAS_USER`: Your Atlassian account email
   - `ATLAS_KEY`: API token (see [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens))
   - `ATLAS_BASEURL`: Your Atlassian instance base URL (e.g., `https://your-domain.atlassian.net`)

4. **Build the project:**
   ```sh
   pnpm build
   ```

## Usage

The service is designed to be run as a FastMCP microservice, communicating via stdio. It exposes several tools (APIs) for interacting with Confluence and Jira Cloud.

### Running the Service

```sh
pnpm build
node dist/index.js
```

## Public APIs / Tools

All tools are exposed via FastMCP. Each tool is documented with its parameters and expected output.

### 1. `confluence_search_cql`

- **Description:** Search Confluence pages using CQL (Confluence Query Language).
- **Parameters:**
  - `cql` (string): The CQL query string.
- **Returns:** List of pages matching the query (`id`, `title`).

### 2. `confluence_get_page_by_id`

- **Description:** Get a Confluence page by its ID.
- **Parameters:**
  - `id` (string): The page ID.
- **Returns:** Page data (`id`, `title`, `body`).

### 3. `confluence_list_pages_in_space`

- **Description:** List all pages in a Confluence space.
- **Parameters:**
  - `spaceKey` (string): The space key.
- **Returns:** List of pages (`id`, `title`).

### 4. `confluence_list_page_children`

- **Description:** List the children of a Confluence page.
- **Parameters:**
  - `id` (string): The parent page ID.
- **Returns:** List of child pages (`id`, `title`).

### 5. `confluence_list_pages_by_user`

- **Description:** List all pages created by a specific user (by Atlassian account ID).
- **Parameters:**
  - `userAccountId` (string): The Atlassian account ID of the user.
- **Returns:** List of pages (`id`, `title`).

### 6. `search_user`

- **Description:** Search for Atlassian users by email address or display name (Jira Cloud API).
- **Parameters:**
  - `query` (string): The search string (email or display name).
- **Returns:** List of users (`accountId`, `displayName`, `email`).

## CQL Documentation

The service provides a built-in resource with documentation for Confluence Query Language (CQL), including syntax, fields, operators, and examples. This can be accessed via the `confluence_cql_docs` resource.

## Frameworks & Libraries

### FastMCP

- Used to define and expose microservice tools/resources.
- [FastMCP documentation](https://github.com/punkpeye/fastmcp)

### axios

- Used for HTTP requests to Atlassian APIs.
- [axios documentation](https://axios-http.com/)

### dotenv

- Loads environment variables from `.env` files.
- [dotenv documentation](https://github.com/motdotla/dotenv)

### zod

- Runtime schema validation for tool parameters.
- [zod documentation](https://zod.dev/)

## Environment Variables

- `ATLAS_USER`: Atlassian account email
- `ATLAS_KEY`: Atlassian API token
- `ATLAS_BASEURL`: Atlassian instance base URL (e.g., `https://your-domain.atlassian.net`)

## Contributing

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Write clear code and add documentation/comments as needed
4. Submit a pull request with a clear description of your changes

## License

Copyright 2025 Methoda Computers Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
