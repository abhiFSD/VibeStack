

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const mysql = require('mysql');

let connection = mysql.createConnection({
  host: 'VibeStack.cek0uljrzoho.us-west-2.rds.amazonaws.com',
  user: 'admin', 
  password: 'gIUrvhQHsiNcvQkWnWHi', 
  database: 'VibeStack' 
});

exports.handler = async (event, context) => {
  let learningId = event.learningId; // Access learning id from the event body.
  
  let query = `
    SELECT * 
    FROM quizzes 
    WHERE learning_id = ${mysql.escape(learningId)}
  `; 

  return new Promise((resolve, reject) => {
    connection.query(query, function (error, results, fields) {
      if (error) {
        console.error("Database query failed: ", error);
        resolve({
          statusCode: 500,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: "Internal server error" }),
        });
      } else {
        resolve({
          statusCode: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(results),
        });
      }
    });
  });
};
