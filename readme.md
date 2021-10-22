# Basic Authentication API
Here's a basic API for user authentication using **Node JS**, **Express JS**, and **Passport JS**, complete with tests.

It uses an email and password for signup and subsequent logins, with *JWT* authentication for subsequent requests. Blacklisted refresh tokens are stored in the user model, and access tokens only last for 10 mins, although the token validity could be configured.

## Installation
- git clone
- npm install
- create a config/config.json in the project root, and choose your database (SQL) dialect
- run *npx sequelize-cli db:migrate*
- create a **Sendgrid** account, and update the API key and your email template Ids
- an example *.env* file is provided. Create your own, using it as a template, and fill out all the fields

## Running
- To run the development server: *npm run dev*
- To run the production server: *npm start*

## Testing
- To test, run *npm test*