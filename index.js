const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// API writing for hashed password using bcrypt
// register user is done through this API
app.post("/users/", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = '${username}'`;
  const dbresponse = await db.get(selectUserQuery);
  if (dbresponse === undefined) {
    // Create a username
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    // userName already exists so given userName is invalid

    response.status(400);
    response.send("User already exists");
  }
});
// now we will write login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT 
        * 
    FROM 
        user 
    WHERE 
        username = '${username}'`;
  const dbuser = await db.get(selectUserQuery);
  if (dbuser === undefined) {
    // username doesn't exist
    response.status(400);
    response.send("userName is invalid");
  } else {
    // compare password with hashed password
    const isPasswordMatched = await bcrypt.compare(password, dbuser.password);
    if (isPasswordMatched === true) {
      response.send("login success!");
    } else {
      response.status(400);
      response.send("password doesnot match");
    }
  }
});
