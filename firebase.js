const admin = require('firebase-admin');
const { initializeApp} = require('firebase-admin/app');
require('dotenv').config()



const private_key = process.env.PRIVATE_KEY.replace(/\\n/g, '\n') //to replace any "\\" that may be added when saving key

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert({
    "projectId": process.env.PROJECT_ID,
    "private_key": private_key,
    "client_email": process.env.SERVICE_ACC,
  }),
    databaseURL: process.env.DB_URL
  },
  "Scheduler");

//console.log("My Auth", firebaseApp.auth())
const auth = admin.auth(firebaseApp)
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database(firebaseApp);

const getDBRefValues = async (path)=>{
  console.log("Calling getDBRefValues for..."+ path)
  const ref = db.ref(path);

  let results; 
  // Attach an asynchronous callback to read the data at our posts reference
  await ref.once('value', (snapshot) => {
    results = snapshot.val()
    console.log(results);
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name);
  }); 

  return results
}

const listAllUsers = (nextPageToken) => {
  // List batch of users, 1000 at a time.
  auth
    .listUsers(1000, nextPageToken)
    .then((listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        console.log('user', userRecord.toJSON());
      });
      if (listUsersResult.pageToken) {
        // List next batch of users.
        listAllUsers(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    });
};
// Start listing users from the beginning, 1000 at a time.
//listAllUsers();
//getDBRefValues('courses');


module.exports = { getDBRefValues }