
//Creating the server 
const fs = require("fs");
const cors = require("cors");
const express = require("express");
//THIS APPROACH works for all os, to obtain theproject folder
const path = require('path');  //import the module path

const rootDirectory = path.dirname(require.main.filename ); //returns the directory name of the file that is running aka "app.js" parent folder

const nodemailer = require("nodemailer");
const multer = require("multer"); //for handleing Multipart forms ONLY
const {google} = require("googleapis");
const { request } = require("express");


const { getDBRefValues, isAdmin, deleteUser } = require('./firebase');
require("dotenv").config();

// to update the node mai with a refresh token each time an email is sending
const OAuth2 = google.auth.OAuth2;  
//createTransporter to connect to the playground
const createTransporter = async () =>{
    //connects our application to Google Playground: used for updating refreshToken
    const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );
    
    oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const accessToken = await new Promise( (resolve, reject) =>{
        //here we authenticate ourselve to get a refreshToken using our accessToken
        oauth2Client.getAccessToken( (err, token) =>{
            if(err){
                reject("Failed to create access token :( " + err);
            }
            resolve(token);
        });
    } );

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            
            type: "OAuth2",
            user: process.env.SENDER_EMAIL,
            accessToken : accessToken,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        }
    });

    transporter.on('token', (token)=>{
        console.log(`\n\nOAuth Token has successful refreshed: ${token}\n\n\n`)
    })
    return transporter;
};





//creating an instance of express function
const app= express();
app.use(cors());
const port = process.env.PORT || 3000;


//Set a storage engien to store recieved files locally
const Storage = multer.diskStorage({
    destination: function(req, file, callback){
        //call back( error, destination)
        if ( file )
        callback(null, path.join(rootDirectory, "attachments", ));
    },
    filename: function (req, file, callback){
        //callback( error, fileName)
        if ( file )
        callback(null, `${Date.now()}_${file.originalname}`);
    }
});

const attachmentUpload = multer({
    storage: Storage,
}).single("attachment")  //name of multipart form field to process 

//To remove file off the server
function deleteUploadedFile(attachmentPath){
    let filePath =  attachmentPath
    console.log(`File PAth to be deleted: ${filePath}`)
    fs.unlink( filePath, function(err){
        if(err)
            console.log(err);
        else
            console.log("File Removed from server!")

    })
}

//Alternative to installing body-parser & using:  app.use( bodyParser.urlencoded({extended:false}) );
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.get("/", (req, res)=>{
    //console.log( "requested From", req)
    res.send("Server is running!")
})

app.post('/delete/user', async (req, res)=>{
    console.log(req)
    if( !req.body.userToDelete || !req.body.currentUser)
        res.send({"error": "Invalid Request"})
    else {
        try{
            let check = await isAdmin(req.body.currentUser)
            if( check==false ) res.send({"error": "User not authorized to delete accounts!"}) 
            else if(check){
                let deleted = await deleteUser(req.body.userToDelete)
                if( !deleted ) res.send({"error": "Failed to deleted User"}) 
                else if (deleted) res.send({"message": "User deleted!"}) 
            }
        }
        catch(error){
            console.log(`Error occured in delete route: ${error}`)
            res.send({"error": "Failed to deleted User"}) 
        }
    }
    

})

app.post("/send_email",  (req, res)=>{
    console.log(req)
    
    attachmentUpload( req, res, async function(error){
        if (error){
            console.log(error);
            return res.send("Error uploading file");
        } else{
            const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            let recipient = "jeremiahstrong321@gmail.com";  //default recipient
            let name = "Assessment Scheduler App";  //default name 
            
            if( req.body.recipient != null ){ 
                name =  req.body.name;
                recipient = await getDBRefValues(`users/${req.body.recipient}/email`) ||  recipient //email admin if invalid request
            }
                
            //If the sender is not present 
            const sender =`Assessment Scheduler App Notification<${process.env.SENDER_EMAIL}>`;
            const subject = req.body.subject;
            const message =  recipient == "jeremiahstrong321@gmail.com" ? "Error occured on the Assessment Scheduler server" : `Message From \nSender: ${name} (${sender}) \n` + req.body.message ;
            let attachmentPath = null;

    
            console.log("recipient:", recipient);
            console.log("subject:", subject);
            console.log("message:", message);
            
            
    
            //email option
            let mailOptions = {
                from : sender,
                to: recipient,
                subject: subject,
                text: message,
                attachments: []
            };

            if ( req.file ){
                attachmentPath = req.file.path;
                console.log("attachmentPath:", attachmentPath);
                mailOptions.attachments = [{
                    path: attachmentPath,
                }]
            }
            
           try{
                    //To send out email
                let emailTransporter = await createTransporter();
                
                emailTransporter.sendMail(mailOptions, function(err, data){
                    if(err){
                        console.log(err)
                        return res.send(`{"error": "${err}" }`)
                    }
                    else{
                        console.log(`\n\nData: ${JSON.stringify(data)}`)
                        if(attachmentPath !=null)
                            deleteUploadedFile(attachmentPath)
                        console.log("Email sent successfully!");
                        return res.send(`{"message": "Email sent successfully to ${recipient}" }`)
                    }
                });
    
           } catch(error){
                console.log(error);
                return res.send(`{"error": "${error}" }`)

           }
    
        } //end of first else
    }) //end of attachmentUpload

}) //end of post method

app.listen(port, ()=>{
    console.log(`Server is runnning on port ${port} from ${rootDirectory}`)
})
