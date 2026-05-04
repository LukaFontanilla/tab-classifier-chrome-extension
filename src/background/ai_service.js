/**
 * AI Service for Tab Classification
 * Interacts with the local LanguageModel API.
 */

/**
 * Checks if the LanguageModel API is available and ready.
 * @returns {Promise<boolean>}
 */
export async function checkAIAvailability() {
  if (typeof LanguageModel === 'undefined') {
    console.warn('LanguageModel API is not defined in this browser.');
    return false;
  }
  
  try {
    // Some implementations might have a capabilities call
    if (typeof LanguageModel.capabilities === 'function') {
      const caps = await LanguageModel.capabilities();
      return caps.available === 'readily';
    }
    return true;
  } catch (error) {
    console.error('Error checking AI availability:', error);
    return false;
  }
}

/**
 * Classifies a list of tabs into groups.
 * @param {Array} tabs - List of chrome.tabs.Tab objects.
 * @param {Array<string>} existingGroupTitles - Titles of existing groups.
 * @returns {Promise<Object>} A mapping of group names to arrays of tab IDs.
 */
export async function classifyTabs(tabs, existingGroupTitles = []) {
  const available = await checkAIAvailability();
  if (!available) {
    throw new Error('AI Classification is not available. Please ensure Gemini Nano is enabled.');
  }

  const session = await LanguageModel.create();
  
  const tabList = tabs.map(t => `ID: ${t.id}, Title: ${t.title}, URL: ${t.url}`).join('\n');
  
  let prompt = `Context:
Tabs to group:
${tabList}
`;

  if (existingGroupTitles.length > 0) {
    prompt += `Existing groups in this window: ${existingGroupTitles.join(', ')}\n`;
  }

  prompt += `
Task:
Think silently. Based on the tabs listed above, group them into logical categories based on their title and URL. You should consider placing tabs into existing groups if they fit.

Constraints:
You are expected to perform deductions based strictly on the provided tab data. Return a JSON object where the keys are the category names (or existing group names) and the values are arrays of tab IDs. Do not introduce external information. Avoid generic names like "Other" or "Misc".`;

  const schema = {
    "type": "object",
    "additionalProperties": {
      "type": "array",
      "items": {
        "type": "integer"
      }
    }
  };

  try {
    const response = await session.prompt(prompt, {
      responseConstraint: schema
    });
    
    return parseAIResponse(response);
  } catch (error) {
    console.error('Error during AI prompting:', error);
    throw error;
  } finally {
    // Clean up session if it has a destroy method
    if (session && typeof session.destroy === 'function') {
      await session.destroy();
    }
  }
}

/**
 * Robustly parses the AI response to handle potential markdown wrappers.
 * @param {string} response - The raw response from the AI.
 * @returns {Object} The parsed JSON object.
 */
function parseAIResponse(response) {
  const trimmed = response.trim();
  
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    console.log('Standard JSON parsing failed, attempting to extract from markdown blocks.');
    
    // Try to match JSON code blocks
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = trimmed.match(jsonBlockRegex);
    
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerError) {
        console.error('Failed to parse extracted JSON block:', innerError);
      }
    }
    
    // Fallback: try to find the first '{' and last '}'
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.substring(start, end + 1));
      } catch (fallbackError) {
        console.error('Failed to parse substring JSON:', fallbackError);
      }
    }
    
    throw new Error('Failed to parse AI response as JSON.');
  }
}
