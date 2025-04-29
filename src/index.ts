import { FastMCP } from "fastmcp";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from "node-html-markdown";

dotenv.config();

interface Page {
  id: string;
  title: string;
}

const server = new FastMCP({
  name: "confluence-search",
  version: "1.0.0",
  instructions: `This server can be used to search and retrieve Confluence content.
    Search tools will only return first 20 results. 
    If you can't find what you're looking for in the first 20 results, try narrowing your search.
    `,
});

/**
 * Helper to create an authenticated axios instance for Confluence Cloud API.
 * Uses environment variables: ATLAS_USER, ATLAS_KEY, ATLAS_BASEURL.
 */
function getConfluenceClient() {
  /**
   * Creates an authenticated axios instance for Atlassian Cloud APIs.
   * The baseURL is now set to the root instance URL (e.g., https://your-domain.atlassian.net).
   * Endpoint paths must include the full API prefix (e.g., /wiki/rest/api/...).
   */
  const baseURL = process.env.ATLAS_BASEURL;
  const auth = {
    username: process.env.ATLAS_USER || "",
    password: process.env.ATLAS_KEY || "",
  };
  if (!baseURL || !auth.username || !auth.password) {
    throw new Error("Missing required Confluence environment variables.");
  }
  return axios.create({
    baseURL: baseURL, // No /wiki/rest/api here
    auth,
  });
}

server.addResource({
  name: "confluence_cql_docs",
  uri: "docs://confluence/cql",
  description: "Documentation for Confluence Query Language (CQL)",
  mimeType: "text/markdown",
  async load() {
    return {
      text: `# Confluence Query Language (CQL) Documentation

CQL is used to search for content in Confluence. Here are the key concepts and examples:

## Basic Syntax
- Use AND, OR, NOT for boolean operations
- Use quotes for exact phrases: "exact match"
- Use parentheses for grouping: (term1 AND term2) OR term3

## Common Fields
- type: Filter by content type (page, blogpost, comment)
- space: Search in specific space
- title: Search in title
- text: Search in content text
- creator: Search by content creator (use Atlassian accountId)
- created: Search by creation date
- lastmodified: Search by last modification date
- label: Search by label

## Examples
1. Pages in a specific space:
   type = page AND space = "DEV"

2. Pages by creator:
   type = page AND creator = "accountId"

3. Recent modifications:
   lastmodified >= now("-1w")

4. Title and content search:
   type = page AND (title ~ "meeting" OR text ~ "agenda")

5. Multiple conditions:
   type = page AND space = "HR" AND label = "policy"

6. Pages created by a user in the last week:
   type = page AND creator = "accountId" AND created >= now("-1w")

## Date Formats
- Absolute: "YYYY-MM-DD"
- Relative: now("-1d") (1 day ago), now("-1w") (1 week ago), now("-1M") (1 month ago)

## Operators
- =  : Exact match
- != : Not equal
- ~  : Contains text
- !~ : Does not contain
- >  : Greater than
- >= : Greater than or equal
- <  : Less than
- <= : Less than or equal

## Best Practices
1. Always specify content type for better performance
2. Use contains (~) for partial text matches
3. Combine multiple conditions with AND for precise results
4. Use parentheses to control operator precedence
5. Quote values containing spaces or special characters

// Updated: Added correct relative date syntax using now("-1w") and example for user-created pages in the last week.
`,
    };
  },
});

/**
 * Search Confluence pages using CQL (Confluence Query Language).
 * @param {string} cql - The CQL query string.
 * @returns {Promise<object>} The search results with formatted content.
 */
server.addTool({
  name: "confluence_search_cql",
  description: "Search Confluence pages using CQL (Confluence Query Language).",
  parameters: z.object({
    cql: z.string({
      description: "The CQL query string to search Confluence content.",
    }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "Search Confluence with CQL",
  },
  async execute({ cql }) {
    const client = getConfluenceClient();
    // Prepend /wiki/rest/api to endpoint
    const response = await client.get("/wiki/rest/api/content/search", {
      params: { cql },
    });
    return {
      content: response.data.results.map((page: Page) => ({
        type: "text",
        text: JSON.stringify({
          id: page.id,
          title: page.title,
        }),
      })),
    };
  },
});

/**
 * Get a Confluence page by its ID.
 * @param {string} id - The page ID.
 * @returns {Promise<object>} The page data with formatted content.
 */
server.addTool({
  name: "confluence_get_page_by_id",
  description: "Get a Confluence page by its ID.",
  parameters: z.object({
    id: z.string({ description: "The unique ID of the Confluence page." }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "Get Confluence Page by ID",
  },
  async execute({ id }) {
    const client = getConfluenceClient();
    // Prepend /wiki/rest/api to endpoint
    const response = await client.get(`/wiki/rest/api/content/${id}`, {
      params: {
        expand: "body.export_view",
      },
    });
    const markdown = NodeHtmlMarkdown.translate(
      response.data.body.export_view.value
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: response.data.id,
            title: response.data.title,
            body: markdown,
          }),
        },
      ],
    };
  },
});

/**
 * List all pages in a Confluence space.
 * @param {string} spaceKey - The space key.
 * @returns {Promise<object>} The list of pages.
 */
server.addTool({
  name: "confluence_list_pages_in_space",
  description: "List all pages in a Confluence space.",
  parameters: z.object({
    spaceKey: z.string({
      description: "The key of the Confluence space (e.g., 'DEV').",
    }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "List Pages in Space",
  },
  async execute({ spaceKey }) {
    const client = getConfluenceClient();
    // Prepend /wiki/rest/api to endpoint
    const response = await client.get("/wiki/rest/api/content", {
      params: { spaceKey, type: "page" },
    });

    return {
      content: response.data.results.map((page: Page) => ({
        type: "text",
        text: JSON.stringify({
          id: page.id,
          title: page.title,
        }),
      })),
    };
  },
});

/**
 * List the children of a Confluence page.
 * @param {string} id - The parent page ID.
 * @returns {Promise<object>} The list of child pages with formatted content.
 */
server.addTool({
  name: "confluence_list_page_children",
  description: "List the children of a Confluence page.",
  parameters: z.object({
    id: z.string({
      description: "The unique ID of the parent Confluence page.",
    }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "List Child Pages",
  },
  async execute({ id }) {
    const client = getConfluenceClient();
    // Prepend /wiki/rest/api to endpoint
    const response = await client.get(
      `/wiki/rest/api/content/${id}/child/page`
    );
    return {
      content: response.data.results.map((page: Page) => ({
        type: "text",
        text: JSON.stringify({
          id: page.id,
          title: page.title,
        }),
      })),
    };
  },
});

/**
 * List all pages created by a specific user.
 * @param {string} userAccountId - The Atlassian account ID of the user.
 * @returns {Promise<object>} The list of pages with formatted content.
 */
server.addTool({
  name: "confluence_list_pages_by_user",
  description:
    "List all pages created by a specific user (by Atlassian account ID).",
  parameters: z.object({
    userAccountId: z.string({
      description:
        "The Atlassian account ID of the user who created the pages.",
    }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "List Pages by User",
  },
  async execute({ userAccountId }) {
    const client = getConfluenceClient();
    // CQL for creator = user, endpoint prepended
    const cql = `type=page AND creator="${userAccountId}"`;
    const response = await client.get("/wiki/rest/api/content/search", {
      params: { cql },
    });
    return {
      content: response.data.results.map((page: Page) => ({
        type: "text",
        text: JSON.stringify({
          id: page.id,
          title: page.title,
        }),
      })),
    };
  },
});

/**
 * Search for Atlassian users by email address or display name.
 *
 * This tool uses the Jira Cloud REST API endpoint `/rest/api/3/user/search` to find users by their email or display name.
 *
 * @param {string} query - The search string (email address or display name).
 * @returns {Promise<object>} The list of users with their accountId, displayName, and email (if available).
 *
 * Requirements:
 * - The authenticated user must have the "Browse users and groups" global permission.
 * - The search will only return users visible to the authenticated user and may be limited by privacy settings.
 * - For privacy reasons, email may be null for some users.
 *
 * Example usage:
 *   search_user({ query: "user@example.com" })
 *
 * For more details, see:
 *   https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-users/#api-rest-api-3-user-search-get
 */
server.addTool({
  name: "search_user",
  description:
    "Search for Atlassian users by email address or display name (Jira Cloud API).",
  parameters: z.object({
    query: z.string({
      description:
        "The search string (email address or display name) to find Atlassian users.",
    }),
  }),
  annotations: {
    readOnlyHint: true,
    title: "Search Atlassian Users",
  },
  async execute({ query }) {
    const client = getConfluenceClient();
    // The /rest/api/3/user/search endpoint is used for user lookup by email or display name.
    // This endpoint is part of the Jira Cloud API, not Confluence, but works for user management in Atlassian Cloud.
    // See: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-users/#api-rest-api-3-user-search-get
    const response = await client.get("/rest/api/3/user/search", {
      params: { query },
    });
    // The response is an array of user objects. We extract accountId, displayName, and email (if available).
    return {
      content: response.data.map((user: any) => ({
        type: "text",
        text: JSON.stringify({
          accountId: user.accountId,
          displayName: user.displayName,
          email: user.emailAddress || null, // May be null due to privacy settings
        }),
      })),
    };
  },
});

server.start({
  transportType: "stdio",
});
