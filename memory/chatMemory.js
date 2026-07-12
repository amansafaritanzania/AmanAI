// ===============================
// Aman AI Advanced Chat Memory
// Multi Chat System
// ===============================


const fs = require("fs");
const path = require("path");



const filePath =
path.join(
    __dirname,
    "chats.json"
);





// ===============================
// LOAD DATABASE
// ===============================

function loadDatabase(){


    if(!fs.existsSync(filePath)){


        fs.writeFileSync(

            filePath,

            JSON.stringify({})

        );


    }



    const data =
    fs.readFileSync(
        filePath,
        "utf8"
    );



    return JSON.parse(data);



}





// ===============================
// SAVE DATABASE
// ===============================

function saveDatabase(data){


    fs.writeFileSync(

        filePath,

        JSON.stringify(
            data,
            null,
            2
        )

    );


}





// ===============================
// CREATE CHAT ID
// ===============================

function createChatId(){


    return (
        "chat_" +
        Date.now()
    );


}






// ===============================
// CREATE NEW CHAT
// ===============================

function createChat(userId,title="New Chat"){


    const db =
    loadDatabase();



    if(!db[userId]){

        db[userId] = {};

    }



    const chatId =
    createChatId();



    db[userId][chatId]={


        title:title,


        messages:[]


    };



    saveDatabase(db);



    return chatId;


}





// ===============================
// GET ALL USER CHATS
// ===============================

function getUserChats(userId){


    const db =
    loadDatabase();



    return db[userId] || {};



}







// ===============================
// GET CHAT MESSAGES
// ===============================

function getChat(userId,chatId){


    const db =
    loadDatabase();



    if(
        db[userId] &&
        db[userId][chatId]
    ){

        return db[userId][chatId]
        .messages;

    }



    return [];



}







// ===============================
// SAVE MESSAGE
// ===============================

function saveMessage(
    userId,
    chatId,
    role,
    content
){


    const db =
    loadDatabase();


    if(!db[userId]){
        db[userId] = {};
    }
    
    if(!db[userId] [chatId]){
        db[userId] [chatId] = {
            title:"New Chat",
            messages:[]
        };
    }


    db[userId][chatId]
    .messages
    .push({

        role,

        content,

        time:
        new Date()
        .toISOString()

    });



    // Auto title from first user message

    if(
        db[userId][chatId]
        .title === "New Chat"
        &&
        role === "user"
    ){


        db[userId][chatId]
        .title =
        content
        .substring(0,35);


    }



    saveDatabase(db);



}






// ===============================
// DELETE CHAT
// ===============================

function deleteChat(
    userId,
    chatId
){


    const db =
    loadDatabase();



    if(
        db[userId]
    ){

        delete db[userId][chatId];

    }



    saveDatabase(db);


}






// ===============================
// DELETE ALL USER CHATS
// ===============================

function deleteAllChats(userId){


    const db =
    loadDatabase();



    delete db[userId];



    saveDatabase(db);



}







module.exports={


createChat,

getUserChats,

getChat,

saveMessage,

deleteChat,

deleteAllChats


};