const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });
const appsync = new AWS.AppSync({ region: 'us-west-2' });

exports.handler = async (event) => {
    try {
        const { email, organizationId, organizationName } = JSON.parse(event.body);
        
        // Generate a unique invitation token
        const token = Buffer.from(`${organizationId}:${email}:${Date.now()}`).toString('base64');
        
        // Create the invitation URL
        const inviteUrl = `https://lfbranch.d35pt9zfpzj94h.amplifyapp.com/invite?token=${token}`;
        
        // Email template
        const emailParams = {
            Source: 'hello@vibestack.example', // Using verified Gmail address
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Subject: {
                    Data: `Invitation to join ${organizationName}`
                },
                Body: {
                    Html: {
                        Data: `
                            <h2>You've been invited to join ${organizationName}</h2>
                            <p>Click the link below to accept the invitation:</p>
                            <a href="${inviteUrl}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
                                Accept Invitation
                            </a>
                            <p>If you can't click the button, copy and paste this URL into your browser:</p>
                            <p>${inviteUrl}</p>
                        `
                    }
                }
            }
        };

        // Send the email
        await ses.sendEmail(emailParams).promise();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: "Invitation sent successfully",
                token: token
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: "Error sending invitation",
                error: error.message
            }),
        };
    }
};