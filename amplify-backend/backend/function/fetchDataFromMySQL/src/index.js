

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
  let leantoolid = JSON.parse(event.body).leantoolid; // Access lentool id from the event body.
  
  let query = `
    SELECT 
      c.id as chapter_id, 
      c.title as chapter_title, 
      s.id as section_id, 
      s.title as section_title, 
      ss.id as sub_section_id, 
      ss.title as sub_section_title, 
      p.content as post_content
    FROM 
      chapters c
    LEFT JOIN 
      sections s ON s.chapter_id = c.id
    LEFT JOIN 
      sub_sections ss ON ss.section_id = s.id
    LEFT JOIN 
      posts p ON (c.post_id IS NOT NULL AND p.id = c.post_id) 
               OR (s.post_id IS NOT NULL AND p.id = s.post_id) 
               OR (ss.post_id IS NOT NULL AND p.id = ss.post_id)
    WHERE 
      c.learning_id = ${mysql.escape(leantoolid)} 
    ORDER BY 
      c.id,
      c.position, 
      s.position, 
      ss.position
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
