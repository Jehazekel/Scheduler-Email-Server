
const {describe, expect, test, beforeEach, afterEach} = require('@jest/globals');
const firebase = require('./firebase') ;
describe('./firebase.js Testcases:', ()=>{

    //beforeEach(()=>{firebase = require('./firebase');})

    test('Test 1.0: Check if a user is An Admin', async()=>{

        let userId = 'dX87L2xMQPbMOj1wcvirwbSo37q2'
        let response = await firebase.isAdmin(userId) 
        expect( response ).toBe(true)
        
        //return Promise.resolve(true)
    })

    test('Test 1.1: Check if a user is An Admin (Using non-admin userID)', async()=>{

        let userId = '8VWQTJwwfFawdt3IHAmvjDbfQAf1'
        let response = await firebase.isAdmin(userId) 
        console.log("Test response 2:", response)
        expect(response).toBe(false)
        //return Promise.resolve(true)
        
    })

    test('Test 2.0: Get a Database reference to path', async()=>{

        let path = 'users'
        let response = await firebase.getDBRefValues(path) 
        let length = response ?  Object.entries(response).length : 0

        console.log("Length of response: ", length)
        console.table(response)
        //Iterate json data as object & Check length of returned data > zero
        expect( length  ).toBeGreaterThan(0)
        
        //return Promise.resolve(true)
    })

    test('Test 3.0: Check if a user is exists (using existing userID)', async()=>{

        let userId = 'dX87L2xMQPbMOj1wcvirwbSo37q2'
        let response = await firebase.userExist(userId) 
        
        expect(response).toBe(true)
        //return Promise.resolve(true)
        
    })

    test('Test 3.0: Check if a user is exists (using existing userID)', async()=>{

        let userId = 'reradsadasd'
        let response = await firebase.userExist(userId) 
        
        expect(response).toBe(false)
        //return Promise.resolve(true)
        
    })

    test('Test 4.0: Edit a user account data', async()=>{

        let userData =  {
            "userToUpdate" : "dX87L2xMQPbMOj1wcvirwbSo37q2",
          "email" : "jeremiahstrong321@gmail.com",
          "name" : "Jeremiah",
           "password" : "password1",
          "account_type" : "Admin"
          }
          
        let response = await firebase.editUserAccount(userData) 
        
        expect(response).toBe(true)
        //return Promise.resolve(true)
        
    })

    test('Test 5.0: Delete a user account (using a valid userID)', async()=>{

        let userData =  {
          "userToUpdate" : "dX87L2xMQPbMOj1wcvirwbSo37q2",
          "email" : "jeremiahstrong321@gmail.com",
          "name" : "Jeremiah",
          "password" : "password",
          "account_type" : "Admin"
          }
          
        let response = await firebase.editUserAccount(userData) 
        
        expect(response).toBe(true)
        //return Promise.resolve(true)
        
    })

    test('Test 5.1: Delete a user account (using an invalid userID)', async()=>{

        let userData =  {
          "userToUpdate" : "reradsadasd",
          "email" : "random@gmail.com",
          "name" : "radmon guy",
          "password" : "password1",
          "account_type" : "Admin"
          }
          
        let response = await firebase.editUserAccount(userData) 
        
        expect(response).toBe(false)
        //return Promise.resolve(true)
        
    })

} )
