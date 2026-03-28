/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });

exports.handler = async (event) => {
    try {
        // Log the raw event first
        console.log('Raw event:', event);
        console.log('Event type:', typeof event);
        console.log('Event body type:', typeof event.body);
        
        let email, reportURL;
        
        // Handle both string and parsed JSON body
        if (typeof event.body === 'string') {
            const parsedBody = JSON.parse(event.body);
            email = parsedBody.email;
            reportURL = parsedBody.reportURL;
        } else {
            email = event.body.email;
            reportURL = event.body.reportURL;
        }

        console.log('Parsed values:', { email, reportURL });

        const emailParams = {
            Source: 'info@vibestack.example',
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Html: {
                        Data: `
                            <h2>You've been added to a Report as an Assignee</h2>
                            <p>Click the link below to access the report:</p>
                            <a href="${reportURL}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
                                Access Report
                            </a>
                            <p>If you can't click the button, copy and paste this URL into your browser:</p>
                            <p>${reportURL}</p>
                        `
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: `Report Assignment - ${reportURL.split('/').pop()}`
                }
            }
        };

        console.log('Attempting to send email with params:', JSON.stringify(emailParams, null, 2));
        
        const result = await ses.sendEmail(emailParams).promise();
        console.log('SES Response:', JSON.stringify(result, null, 2));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: 'Email sent successfully',
                messageId: result.MessageId,
                email: email,
                reportURL: reportURL
            }),
        };
    } catch (error) {
        console.error("Detailed error:", {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            requestId: error.requestId,
            stack: error.stack
        });
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: "Error sending email",
                error: error.message,
                errorDetails: {
                    code: error.code,
                    statusCode: error.statusCode,
                    requestId: error.requestId
                }
            }),
        };
    }
};
