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
        const email = event.email;
        const reportId = event.reportId;

        const reportURL = `https://lfbranch.d35pt9zfpzj94h.amplifyapp.com/report/${reportId}`;
        const emailText = `You have been added to this report as Assignees. Click on this link to access the report: ${reportURL}`;

        await ses.sendEmail({
            Source: 'info@vibestack.example',
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Text: {
                        Charset: 'UTF-8',
                        Data: emailText
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: `Report - ${reportId}`
                }
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify('Email sent successfully'),
        };
    } catch (error) {
        console.error("Error occurred:", error);
        return {
            statusCode: 500,
            body: JSON.stringify('An error occurred'),
        };
    }
};
