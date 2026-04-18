// Utility to fill a Markdown template with test plan data
import templateString from '../test_plan_template/testPlan_template_clean.md?raw';

export const fillTestPlanTemplate = (plan, overrides = {}) => {
  // Merge plan data with any overrides (e.g., for multi-plan export)
  const data = { ...plan, ...overrides };
  let output = templateString;
  // Replace all {{placeholder}} with values from data (or blank if missing)
  output = output.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const value = data[key.trim()];
    if (Array.isArray(value)) return value.join('\n');
    return value !== undefined ? value : '';
  });
  return output;
};
// Generate a combined Markdown test plan for multiple plans
export const generateCombinedTestPlanMarkdown = (testPlans) => {
  if (!Array.isArray(testPlans)) testPlans = [testPlans];
  let markdown = `# Combined Test Plan\n\n`;
  markdown += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
  testPlans.forEach((plan, idx) => {
    markdown += `---\n\n## Test Plan ${idx + 1}: ${plan.name || 'Untitled'}\n`;
    markdown += `**Objective:** ${plan.objective || 'N/A'}\n\n`;
    markdown += `**Scope:**\n`;
    markdown += `- In Scope: ${(plan.inScope || []).join(', ') || 'N/A'}\n`;
    markdown += `- Out of Scope: ${(plan.outOfScope || []).join(', ') || 'N/A'}\n`;
    markdown += `**Test Types:** ${(plan.testTypes || []).join(', ') || 'N/A'}\n`;
    markdown += `**Entry Criteria:** ${(plan.entryCriteria || []).join(', ') || 'N/A'}\n`;
    markdown += `**Exit Criteria:** ${(plan.exitCriteria || []).join(', ') || 'N/A'}\n`;
    markdown += `**Risks:** ${(plan.risks || []).join(', ') || 'N/A'}\n`;
    markdown += `\n`;
  });
  return markdown;
};
// Export utility functions for Test Orchestrator

export const exportToMarkdown = (filename, content) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/markdown' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.md`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportToCSV = (filename, data) => {
  // Convert data to CSV format
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  if (Array.isArray(data) && data.length > 0) {
    // Get headers from first object
    const headers = Object.keys(data[0]);
    csvContent += headers.join(',') + '\n';
    
    // Add rows
    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });
  }
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (filename, data) => {
  const element = document.createElement('a');
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.json`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const generateTestPlanMarkdown = (testPlan) => {
  let markdown = `# Test Plan: ${testPlan.name}\n\n`;
  markdown += `**Date:** ${new Date().toLocaleDateString()}\n\n`;
  markdown += `## Objective\n${testPlan.objective || 'N/A'}\n\n`;
  markdown += `## Scope\n\n### In Scope\n`;
  (testPlan.inScope || []).forEach((item) => {
    markdown += `- ${item}\n`;
  });
  markdown += `\n### Out of Scope\n`;
  (testPlan.outOfScope || []).forEach((item) => {
    markdown += `- ${item}\n`;
  });
  markdown += `\n## Test Types\n`;
  (testPlan.testTypes || []).forEach((type) => {
    markdown += `- ${type}\n`;
  });
  markdown += `\n## Entry Criteria\n`;
  (testPlan.entryCriteria || []).forEach((criteria) => {
    markdown += `- ${criteria}\n`;
  });
  markdown += `\n## Exit Criteria\n`;
  (testPlan.exitCriteria || []).forEach((criteria) => {
    markdown += `- ${criteria}\n`;
  });
  markdown += `\n## Risks\n`;
  (testPlan.risks || []).forEach((risk) => {
    markdown += `- ${risk}\n`;
  });
  return markdown;
};

export const generateTestCasesMarkdown = (testCases) => {
  let markdown = `# Test Cases\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
  markdown += `**Total Test Cases:** ${testCases.length}\n\n`;
  
  testCases.forEach((tc) => {
    markdown += `## ${tc.id}: ${tc.title}\n\n`;
    markdown += `**Module:** ${tc.module}\n`;
    markdown += `**Priority:** ${tc.priority}\n`;
    markdown += `**Type:** ${tc.type}\n`;
    markdown += `**Status:** ${tc.status}\n\n`;
    
    markdown += `### Pre-conditions\n`;
    (tc.preconditions || []).forEach((pc) => {
      markdown += `- ${pc}\n`;
    });
    
    markdown += `\n### Test Steps\n`;
    (tc.testSteps || []).forEach((step) => {
      markdown += `${step.step_number}. **Action:** ${step.action}\n`;
      markdown += `   **Expected:** ${step.expected_result}\n`;
    });
    
    markdown += `\n### Expected Outcome\n${tc.expectedOutcome || 'N/A'}\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
};

// Simple HTML to PDF conversion (using browser print functionality)
export const exportToPDF = (filename, htmlContent) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #0066cc; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status { padding: 5px 10px; border-radius: 3px; display: inline-block; }
        .pass { background-color: #dffcf0; color: #22863a; }
        .fail { background-color: #ffeaea; color: #cb2431; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
