const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });

// Add GraphQL client for fetching email templates
const https = require('https');
const { URL } = require('url');

// GraphQL query to fetch email templates
const getEmailTemplateQuery = `
query GetEmailTemplate($filter: ModelEmailTemplateFilterInput) {
  listEmailTemplates(filter: $filter) {
    items {
      id
      type
      subject
      htmlTemplate
      isEnabled
      customType
    }
  }
}
`;

// Function to execute GraphQL query
async function executeGraphQLQuery(query, variables) {
    try {
        // Get environment variables from environment
        const endpoint = process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT;
        const apiKey = process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT;

        // Print environment variables for debugging (redact part of API key for security)
        console.log('Environment variables:');
        console.log('API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT:', endpoint);
        console.log('API_LFAPI_GRAPHQLAPIKEYOUTPUT exists:', !!apiKey);
        if (apiKey) {
            const keyLength = apiKey.length;
            const redactedKey = apiKey.substring(0, 4) + '...' + apiKey.substring(keyLength - 4);
            console.log('API Key (redacted):', redactedKey);
        }

        if (!endpoint || !apiKey) {
            console.error('Missing required environment variables for GraphQL API');
            throw new Error('Missing API configuration');
        }

        const url = new URL(endpoint);
        
        console.log('Making GraphQL query to:', url.hostname);
        console.log('GraphQL query:', query.trim().replace(/\s+/g, ' ').substring(0, 100) + '...');
        
        const data = JSON.stringify({
            query: query,
            variables: variables
        });
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        };
        
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        console.log('GraphQL raw response:', responseData);
                        const parsedData = JSON.parse(responseData);
                        
                        // Check for GraphQL errors
                        if (parsedData.errors) {
                            console.error('GraphQL errors:', JSON.stringify(parsedData.errors));
                        }
                        
                        resolve(parsedData);
                    } catch (error) {
                        console.error('Failed to parse response:', error);
                        reject(new Error('Failed to parse response: ' + error.message));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('Request error:', error);
                reject(new Error('Request error: ' + error.message));
            });
            
            req.write(data);
            req.end();
        });
    } catch (error) {
        console.error('Error executing GraphQL query:', error);
        throw error;
    }
}

// Helper function to get email template from database
async function getEmailTemplate(type, organizationID) {
    try {
        if (!type || !organizationID) {
            console.error('Type and organizationID are required for fetching email template');
            return null;
        }

        console.log(`Fetching email template for type: ${type}, organization: ${organizationID}`);
        
        // First try searching by type directly with pagination support
        let query = `
            query ListEmailTemplates($nextToken: String) {
                listEmailTemplates(
                    filter: {
                        organizationID: { eq: "${organizationID}" },
                        type: { eq: "${type}" }
                    },
                    limit: 100,
                    nextToken: $nextToken
                ) {
                    items {
                        id
                        type
                        subject
                        htmlTemplate
                        isEnabled
                        customType
                    }
                    nextToken
                }
            }
        `;
        
        // Step 1: Get templates matching the exact type and organization (with pagination)
        let allTemplates = [];
        let nextToken = null;
        
        do {
            let response = await executeGraphQLQuery(query, { nextToken });
            
            console.log(`Step 1 Query Response (page):`, JSON.stringify(response, null, 2));
            
            if (response.data && 
                response.data.listEmailTemplates && 
                response.data.listEmailTemplates.items) {
                
                allTemplates = allTemplates.concat(response.data.listEmailTemplates.items);
                nextToken = response.data.listEmailTemplates.nextToken;
                
                console.log(`Fetched ${response.data.listEmailTemplates.items.length} templates, total so far: ${allTemplates.length}, nextToken: ${nextToken}`);
            } else {
                break;
            }
        } while (nextToken);
        
        console.log(`Step 1 Complete: Found ${allTemplates.length} templates matching type ${type}`);
        
        if (allTemplates.length > 0) {
            // Return the first enabled template, or the first one if none are explicitly enabled
            const enabledTemplate = allTemplates.find(t => t.isEnabled === true);
            const anyTemplate = allTemplates[0];
            
            if (enabledTemplate) {
                console.log('Found enabled template:', enabledTemplate.id);
                return enabledTemplate;
            } else if (anyTemplate) {
                console.log('Found template (enabled status unclear):', anyTemplate.id, 'isEnabled:', anyTemplate.isEnabled);
                return anyTemplate;
            }
        } else {
            console.log('No templates found in Step 1');
        }
        
        // Step 2: Try to find any template for this organization (even if disabled) with pagination
        query = `
            query ListEmailTemplates($nextToken: String) {
                listEmailTemplates(
                    filter: {
                        organizationID: { eq: "${organizationID}" }
                    },
                    limit: 100,
                    nextToken: $nextToken
                ) {
                    items {
                        id
                        type
                        subject
                        htmlTemplate
                        isEnabled
                        customType
                    }
                    nextToken
                }
            }
        `;
        
        // Get all templates for this organization with pagination
        let allOrgTemplates = [];
        nextToken = null;
        
        do {
            let response = await executeGraphQLQuery(query, { nextToken });
            
            console.log(`Step 2 Query Response (page):`, JSON.stringify(response, null, 2));
            
            if (response.data && 
                response.data.listEmailTemplates && 
                response.data.listEmailTemplates.items) {
                
                allOrgTemplates = allOrgTemplates.concat(response.data.listEmailTemplates.items);
                nextToken = response.data.listEmailTemplates.nextToken;
                
                console.log(`Step 2: Fetched ${response.data.listEmailTemplates.items.length} templates, total so far: ${allOrgTemplates.length}, nextToken: ${nextToken}`);
            } else {
                break;
            }
        } while (nextToken);
        
        console.log(`Step 2 Complete: Found ${allOrgTemplates.length} total templates for organization`);
        
        if (allOrgTemplates.length > 0) {
            // Filter templates based on type or customType
            const matchingTemplates = allOrgTemplates.filter(
                template => template.type === type || template.customType === type
            );
            
            if (matchingTemplates.length > 0) {
                console.log('Found disabled template for organization - can be enabled');
                return matchingTemplates[0];
            }
        }
        
        // Step 3: Try to find template with type CUSTOM_NOTIFICATION and matching customType with pagination
        query = `
            query ListEmailTemplates($nextToken: String) {
                listEmailTemplates(
                    filter: {
                        type: { eq: "CUSTOM_NOTIFICATION" },
                        organizationID: { eq: "${organizationID}" }
                    },
                    limit: 100,
                    nextToken: $nextToken
                ) {
                    items {
                        id
                        type
                        subject
                        htmlTemplate
                        isEnabled
                        customType
                    }
                    nextToken
                }
            }
        `;
        
        // Get all CUSTOM_NOTIFICATION templates for this organization with pagination
        let allCustomTemplates = [];
        nextToken = null;
        
        do {
            let response = await executeGraphQLQuery(query, { nextToken });
            
            console.log(`Step 3 Query Response (page):`, JSON.stringify(response, null, 2));
            
            if (response.data && 
                response.data.listEmailTemplates && 
                response.data.listEmailTemplates.items) {
                
                allCustomTemplates = allCustomTemplates.concat(response.data.listEmailTemplates.items);
                nextToken = response.data.listEmailTemplates.nextToken;
                
                console.log(`Step 3: Fetched ${response.data.listEmailTemplates.items.length} templates, total so far: ${allCustomTemplates.length}, nextToken: ${nextToken}`);
            } else {
                break;
            }
        } while (nextToken);
        
        console.log(`Step 3 Complete: Found ${allCustomTemplates.length} CUSTOM_NOTIFICATION templates for organization`);
        
        if (allCustomTemplates.length > 0) {
            // Filter templates with matching customType
            const matchingTemplates = allCustomTemplates.filter(
                template => template.customType === type
            );
            
            if (matchingTemplates.length > 0) {
                console.log('Found CUSTOM_NOTIFICATION template with matching customType');
                return matchingTemplates[0];
            }
        }
        
        console.log('No template found in database for type:', type);
        return null;
    } catch (error) {
        console.error('Error fetching email template:', error);
        return null;
    }
}

// Helper function to replace placeholders in template
function replaceTemplatePlaceholders(template, data) {
    if (!template) return '';
    
    // Simple handlebars-like implementation
    // Replace all {{placeholders}} with corresponding values from data
    let processedTemplate = template;
    
    // Handle conditionals {{#if var}}content{{/if}}
    processedTemplate = processedTemplate.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
        return data[key] ? content : '';
    });
    
    // Replace variables {{var}}
    processedTemplate = processedTemplate.replace(/{{(\w+)}}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
    
    return processedTemplate;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Parse the request body
        const requestBody = JSON.parse(event.body);
        const { to, template, data, organizationID } = requestBody;
        
        console.log('Received request:', JSON.stringify(requestBody, null, 2));
        
        if (!to || !template || !data || !organizationID) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: "Missing required fields: to, template, data, organizationID"
                })
            };
        }

        // Try to get the template from the database first
        console.log(`Looking for template: ${template} for organization: ${organizationID}`);
        let templateData = null;
        const customTemplate = await getEmailTemplate(template, organizationID);
        
        if (customTemplate) {
            console.log(`Template found: ID=${customTemplate.id}, Type=${customTemplate.type}, CustomType=${customTemplate.customType || 'none'}`);
            templateData = {
                subject: customTemplate.subject,
                html: customTemplate.htmlTemplate
            };
            console.log('Using custom template from database');
        } else {
            console.log('No template found in database for type:', template);
            // Do not send email if no template is found in the database
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "Email not sent - no template found in database",
                    template: template,
                    organizationID: organizationID
                })
            };
        }

        // Process the template by replacing placeholders
        const processedSubject = replaceTemplatePlaceholders(templateData.subject, data);
        const processedHtml = replaceTemplatePlaceholders(templateData.html, data);

        const emailParams = {
            Source: 'hello@vibestack.example',
            Destination: {
                ToAddresses: Array.isArray(to) ? to : [to]
            },
            Message: {
                Body: {
                    Html: {
                        Data: processedHtml
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: processedSubject
                }
            }
        };

        console.log('Sending email with params:', JSON.stringify(emailParams, null, 2));
        
        const result = await ses.sendEmail(emailParams).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Email sent successfully',
                messageId: result.MessageId
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: "Error sending email",
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
