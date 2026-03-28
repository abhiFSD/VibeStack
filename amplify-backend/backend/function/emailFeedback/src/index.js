

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-west-2' });

exports.handler = async (event) => {
  try {
    const email = 'info@vibestack.example';
    
    // Parse body once and handle potential issues
    let bodyStr = event.body;
    if (event.isBase64Encoded) {
      bodyStr = Buffer.from(event.body, 'base64').toString('utf-8');
    }
    
    // Clean up any potential formatting issues
    bodyStr = bodyStr.replace(/\n/g, '').replace(/\r/g, '');
    
    const body = JSON.parse(bodyStr);
    const emailText = body.emailText;
    const ccEmail = body.email;

    await ses.sendEmail({
      Source: 'info@vibestack.example',
      Destination: {
        ToAddresses: [email],
        CcAddresses: [ccEmail],
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: emailText,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Feedback',
        },
      },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify('Email sent successfully'),
    };
  } catch (error) {
    console.error("Error occurred:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify('An error occurred'),
    };
  }
};

