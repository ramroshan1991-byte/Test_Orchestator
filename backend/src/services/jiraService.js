import axios from 'axios';

class JiraService {
  constructor() {
    this.baseURL = process.env.JIRA_BASE_URL;
    this.email = process.env.JIRA_EMAIL;
    this.apiToken = process.env.JIRA_API_TOKEN;
  }

  createAuthHeader() {
    const credentials = `${this.email}:${this.apiToken}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return {
      Authorization: `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async testConnection(baseURL, email, apiToken, projectKey) {
    try {
      const credentials = `${email}:${apiToken}`;
      const encodedCredentials = Buffer.from(credentials).toString('base64');
      const headers = {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      };

      // 1. Verify authentication specifically (fails 401 if token is bad, unlike /project which may act anonymous)
      await axios.get(`${baseURL.replace(/\/+$/, '')}/rest/api/3/myself`, {
        headers,
      });

      // 2. If projectKey is provided, verify they have access to it
      if (projectKey) {
        await axios.get(`${baseURL.replace(/\/+$/, '')}/rest/api/3/project/${projectKey}`, {
          headers,
        });
      }

      return { success: true };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false, error: 'Authentication failed. Please verify your Email and API Token.' };
      }
      if (error.response?.status === 404 && projectKey) {
        return { success: false, error: `Project '${projectKey}' not found or you don't have access.` };
      }
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message,
      };
    }
  }

  createDynamicAuthHeader(email, apiToken) {
    const credentials = `${email}:${apiToken}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return {
      Authorization: `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  // Helper method to extract acceptance criteria from Jira custom fields
  extractAcceptanceCriteria(issue) {
    const acArray = [];

    // List of common field names/IDs that might contain acceptance criteria
    const acFieldNames = [
      'customfield_10001',
      'customfield_10002',
      'customfield_10003',
      'customfield_10004',
      'customfield_10005',
      'customfield_10016',
      'acceptanceCriteria',
      'acceptance_criteria',
      'ac',
    ];

    if (!issue.fields) return acArray;

    // Search for acceptance criteria in dedicated custom fields
    for (const fieldName of acFieldNames) {
      if (issue.fields[fieldName]) {
        const value = issue.fields[fieldName];

        // Handle ADF object format (Jira API v3)
        if (value && typeof value === 'object' && value.type === 'doc') {
          const text = this.extractPlainTextFromADF(value).trim();
          if (text) {
            const lines = text.split('\n').filter(line => line.trim());
            acArray.push(...lines.map(line => line.replace(/^[\*\-\•\d+\.]+\s*/, '').trim()).filter(Boolean));
            break;
          }
        }

        // Handle plain string format
        if (typeof value === 'string' && value.trim()) {
          const lines = value.split('\n').filter(line => line.trim());
          acArray.push(...lines.map(line => line.replace(/^[\*\-\•\d+\.]+\s*/, '').trim()).filter(Boolean));
          break;
        }

        // Handle array format
        if (Array.isArray(value)) {
          acArray.push(...value.filter(v => v && typeof v === 'string').map(v => v.trim()));
          break;
        }
      }
    }

    // If no criteria found in dedicated fields, try to extract from description
    if (acArray.length === 0 && issue.fields?.description) {
      const descField = issue.fields.description;

      // Convert ADF -> plain text if needed (Jira API v3 returns ADF objects, NOT plain strings)
      let descText = '';
      if (typeof descField === 'string') {
        descText = descField;
      } else if (descField && typeof descField === 'object') {
        descText = this.extractPlainTextFromADF(descField).trim();
      }

      // Also try renderedFields (HTML) as a last resort
      if (!descText && issue.renderedFields?.description) {
        descText = this.stripHtml(issue.renderedFields.description).trim();
      }

      if (descText) {
        // Match common AC section headings: stops at next emoji-led section, double blank line, or EOF
        const acSectionRegex = /(?:acceptance\s+criteria|ac\s*:|given[\-\s]when[\-\s]then|criteria)[:\s]*([\s\S]*?)(?=\n[\uD83C-\uDBFF\uDC00-\uDFFF🔒🧪📋✅⚠️]|\n#|\nTasks|\nTest Data|\nNotes|\nDefinition|\n\n\n|$)/i;
        const acMatch = descText.match(acSectionRegex);

        if (acMatch && acMatch[1]) {
          const acText = acMatch[1].trim();
          const lines = acText.split('\n').filter(line => line.trim());
          acArray.push(...lines.map(line => line.replace(/^[\*\-\•\d+\.]+\s*/, '').trim()).filter(Boolean));
        }

        // Fallback: BDD Given/When/Then style
        if (acArray.length === 0) {
          const bddMatch = descText.match(/(Given\s[\s\S]*?)(?=\n\n\n|\n[\uD83C-\uDBFF\uDC00-\uDFFF]|\nTasks|\nTest Data|$)/i);
          if (bddMatch) {
            const lines = bddMatch[1].split('\n').filter(line => line.trim());
            acArray.push(...lines.map(line => line.replace(/^[\*\-\•\d+\.]+\s*/, '').trim()).filter(Boolean));
          }
        }
      }
    }

    return acArray;
  }

  // Convert Atlassian Document Format (ADF) to plain text recursively
  extractPlainTextFromADF(node, listLevel = 0) {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(n => this.extractPlainTextFromADF(n, listLevel)).join('');

    const type = node.type;
    // Text node
    if (type === 'text') return node.text || '';

    // Paragraphs and headings
    if (type === 'paragraph' || (type && type.startsWith('heading'))) {
      const inner = (node.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('');
      return inner.trim() + '\n';
    }

    // Bullet list
    if (type === 'bulletList') {
      return (node.content || []).map(item => this.extractPlainTextFromADF(item, listLevel + 1)).join('');
    }

    // Ordered list
    if (type === 'orderedList') {
      return (node.content || []).map((item, idx) => {
        const content = this.extractPlainTextFromADF(item, listLevel + 1).trim();
        return `${idx + 1}. ${content}\n`;
      }).join('');
    }

    // List item
    if (type === 'listItem') {
      const prefix = '  '.repeat(Math.max(0, listLevel - 1)) + '- ';
      const inner = (node.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('').trim();
      return prefix + inner + '\n';
    }

    // Code block
    if (type === 'codeBlock') {
      const code = (node.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('') || node.text || '';
      return code + '\n';
    }

    // Blockquote
    if (type === 'blockquote') {
      const inner = (node.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('').trim();
      return '> ' + inner + '\n';
    }

    // Panel or other block containers
    if (type === 'panel' || type === 'decisionList' || type === 'table') {
      if (type === 'table') {
        // Flatten table rows and cells with tabs/newlines
        const rows = (node.content || []).map(row => {
          return (row.content || []).map(cell => (cell.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('')).join('\t');
        });
        return rows.join('\n') + '\n';
      }
      return (node.content || []).map(c => this.extractPlainTextFromADF(c, listLevel)).join('') + '\n';
    }

    // Fallback: recurse into content
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(c => this.extractPlainTextFromADF(c, listLevel)).join('');
    }

    return '';
  }

  // Strip HTML tags and decode basic HTML entities
  stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    // Remove script/style
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    // Replace <br> and <p> with newlines
    html = html.replace(/<br\s*\/?>/gi, '\n');
    html = html.replace(/<p[^>]*>/gi, '\n');
    // Remove all tags
    let text = html.replace(/<[^>]+>/g, '');
    // Decode numeric entities
    text = text.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
    // Decode common named entities
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    text = text.replace(/&([a-z]+);/gi, (m, name) => entities[name] || m);
    // Collapse multiple newlines and trim
    return text.replace(/\n{2,}/g, '\n\n').trim();
  }

  async getStories(projectKey, sprintName = null, baseURL = null, email = null, apiToken = null, options = {}) {
    try {
      const url = (baseURL || this.baseURL || '').replace(/\/+$/, '');
      const authEmail = email || this.email;
      const authToken = apiToken || this.apiToken;

      // Simplified JQL for maximum coverage - we will filter stories in the mapping phase if needed
      let jql = `project = "${projectKey}"`;
      if (sprintName) {
        jql += ` AND sprint = "${sprintName}"`;
      }

      console.log('Fetching Jira stories with JQL:', jql);
      console.log('Base URL:', url);

      const apiURL = `${url}/rest/api/3/search/jql`;
      const fields = ['key', 'summary', 'description', 'priority', 'status', 'assignee', 'duedate', 'issuetype', 'created', 'updated', 'customfield_10001', 'customfield_10002'];

      // Pagination: iterate through pages until we've fetched all issues or hit a safe cap
      const maxResults = 50;
      let nextPageToken = null;
      let allIssues = [];

      while (true) {
        const params = {
          jql: jql,
          maxResults,
          fields: fields.join(','),
        };
        
        if (nextPageToken) {
          params.nextPageToken = nextPageToken;
        }

        console.log('API URL:', apiURL, nextPageToken ? `token=${nextPageToken.substring(0, 10)}...` : 'initial fetch');

        const response = await axios({
          method: 'get',
          url: apiURL,
          params: params,
          headers: this.createDynamicAuthHeader(authEmail, authToken),
          validateStatus: () => true,
        });

        console.log('Jira API response status:', response.status);
        console.log('Jira Search Response Data:', JSON.stringify(response.data, null, 2));

        if (response.status !== 200) {
          console.error('Jira API error response:', response.data);
          const errorMsg = response.data?.errorMessages?.[0] || response.data?.error_description || response.data?.error || `API returned status ${response.status}`;
          throw new Error(errorMsg);
        }

        const issues = response.data.issues || [];
        allIssues = allIssues.concat(issues);
        nextPageToken = response.data.nextPageToken;

        if (!nextPageToken || issues.length === 0) break;
        // Safety cap
        if (allIssues.length > 2000) break;
      }

      if (allIssues.length === 0) {
        console.log('No issues found in Jira project');
        return [];
      }

      // Fallback: for issues missing description, fetch per-issue renderedFields to get richer content
      // Only do this when the total number of issues is reasonable to avoid rate-limit storms
      const perIssueFetchCap = options.forceDeepFetch ? 5000 : 200;
      if (allIssues.length > 0 && allIssues.length <= perIssueFetchCap) {
        console.log(`Performing per-issue fallback fetch for up to ${allIssues.length} issues`);
        for (let i = 0; i < allIssues.length; i++) {
          const issue = allIssues[i];
          const fields = issue.fields || {};
          const hasDescription = (typeof fields.description === 'string' && fields.description.trim()) || (issue.renderedFields && issue.renderedFields.description);
          if (!hasDescription) {
            try {
              const issueIdOrKey = issue.key || issue.id;
              const issueResp = await axios.get(`${url}/rest/api/3/issue/${issueIdOrKey}`, {
                params: { expand: 'renderedFields', fields: 'description,created,updated,summary' },
                headers: this.createDynamicAuthHeader(authEmail, authToken),
                validateStatus: () => true,
              });

              if (issueResp.status === 200 && issueResp.data) {
                // merge renderedFields and fields from the fetched issue
                allIssues[i].renderedFields = issueResp.data.renderedFields || allIssues[i].renderedFields;
                allIssues[i].fields = { ...allIssues[i].fields, ...(issueResp.data.fields || {}) };
                // ensure top-level key is set (API may return id-only in search results)
                allIssues[i].key = issueResp.data.key || issueResp.data.id || allIssues[i].key;
              } else {
                console.warn(`Per-issue fetch failed for ${issue.key}: status ${issueResp.status}`);
              }
            } catch (e) {
              console.warn(`Per-issue fetch error for ${issue.key}:`, e.message);
            }
          }
        }
      } else if (allIssues.length > perIssueFetchCap) {
        console.log(`Skipping per-issue fallback fetch because issue count (${allIssues.length}) exceeds cap (${perIssueFetchCap})`);
      }

      // Map the issues to story objects with enhanced data and robust parsing
      const stories = allIssues.map((issue) => {
        const fields = issue.fields || {};
        const acceptanceCriteria = this.extractAcceptanceCriteria(issue);

        const key = issue.key || issue.id || 'Unknown';

        const summary = (typeof fields.summary === 'string' && fields.summary.trim())
          ? fields.summary
          : (fields.summary?.plainText || `Story ${key}` || 'Untitled Story');

        // Description can be ADF object, string, or rendered HTML in renderedFields
        let description = 'No description provided';
        if (typeof fields.description === 'string' && fields.description.trim()) {
          description = fields.description;
        } else if (fields.description) {
          description = this.extractPlainTextFromADF(fields.description).trim() || description;
        } else if (issue.renderedFields && issue.renderedFields.description) {
          description = this.stripHtml(issue.renderedFields.description) || description;
        }

        const created = fields.created ? (fields.created.split('T')[0] || '') : '';
        const updated = fields.updated ? (fields.updated.split('T')[0] || '') : '';

        return {
          key,
          summary,
          description,
          priority: fields.priority?.name || 'Medium',
          status: fields.status?.name || 'To Do',
          assignee: fields.assignee?.displayName || 'Unassigned',
          dueDate: fields.duedate || '',
          points: fields.customfield_10001 || fields.customfield_10002 || 0,
          acceptanceCriteria: acceptanceCriteria,
          additionalDetails: {
            'Project': projectKey,
            'Type': fields.issuetype?.name || 'Story',
            'Created': created,
            'Updated': updated,
          },
        };
      });

      console.log(`Mapped ${stories.length} stories from Jira (total issues fetched: ${allIssues.length})`);
      return stories;
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessages?.[0] || 
                      error.response?.data?.error_description ||
                      error.message || 
                      'Unknown error';
      console.error('Jira API Error:', errorMsg, error.response?.data);
      throw new Error(
        'Failed to fetch stories from Jira: ' + errorMsg
      );
    }
  }

  async getProjects(baseURL = null, email = null, apiToken = null) {
    try {
      const url = baseURL || this.baseURL;
      const authEmail = email || this.email;
      const authToken = apiToken || this.apiToken;

      const response = await axios.get(
        `${url}/rest/api/3/project`,
        { headers: this.createDynamicAuthHeader(authEmail, authToken) }
      );

      return (Array.isArray(response.data) ? response.data : response.data.values).map(project => ({
        key: project.key,
        name: project.name,
        id: project.id,
        description: project.description || '',
      }));
    } catch (error) {
      throw new Error(
        'Failed to fetch projects from Jira: ' +
          (error.response?.data?.errorMessages?.[0] || error.message)
      );
    }
  }

  async getSprints(projectKey, baseURL = null, email = null, apiToken = null) {
    try {
      const url = baseURL || this.baseURL;
      const authEmail = email || this.email;
      const authToken = apiToken || this.apiToken;

      const response = await axios.get(
        `${url}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`,
        { headers: this.createDynamicAuthHeader(authEmail, authToken) }
      );
      return response.data.values || response.data;
    } catch (error) {
      throw new Error(
        'Failed to fetch sprints from Jira: ' +
          (error.response?.data?.errorMessages?.[0] || error.message)
      );
    }
  }

  // Fetch a single issue with renderedFields and return mapped data
  async getIssue(issueKey, baseURL = null, email = null, apiToken = null) {
    try {
      const url = baseURL || this.baseURL;
      const authEmail = email || this.email;
      const authToken = apiToken || this.apiToken;

      const apiURL = `${url}/rest/api/3/issue/${issueKey}`;
      const response = await axios.get(apiURL, {
        params: { expand: 'renderedFields', fields: 'summary,description,priority,status,assignee,duedate,issuetype,created,updated' },
        headers: this.createDynamicAuthHeader(authEmail, authToken),
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        const errorMsg = response.data?.errorMessages?.[0] || response.data?.error_description || response.data?.error || `API returned status ${response.status}`;
        throw new Error(errorMsg);
      }

      const issue = response.data;
      const fields = issue.fields || {};

      // Extract description (ADF or renderedFields)
      let description = 'No description provided';
      if (typeof fields.description === 'string' && fields.description.trim()) {
        description = fields.description;
      } else if (fields.description) {
        description = this.extractPlainTextFromADF(fields.description).trim() || description;
      } else if (issue.renderedFields && issue.renderedFields.description) {
        description = this.stripHtml(issue.renderedFields.description) || description;
      }

      const acceptanceCriteria = this.extractAcceptanceCriteria(issue);

      return {
        key: issue.key || issue.id,
        summary: fields.summary || '',
        description,
        priority: fields.priority?.name || 'Medium',
        status: fields.status?.name || 'To Do',
        assignee: fields.assignee?.displayName || 'Unassigned',
        dueDate: fields.duedate || '',
        points: fields.customfield_10001 || fields.customfield_10002 || 0,
        acceptanceCriteria,
        additionalDetails: {
          Project: fields.project?.key || '',
          Type: fields.issuetype?.name || 'Story',
          Created: fields.created?.split('T')[0] || '',
          Updated: fields.updated?.split('T')[0] || '',
        },
      };
    } catch (error) {
      const errorMsg = error.response?.data?.errorMessages?.[0] || error.message || 'Unknown error';
      throw new Error('Failed to fetch issue from Jira: ' + errorMsg);
    }
  }
}

export default new JiraService();
