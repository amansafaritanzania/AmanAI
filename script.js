// =====================================================
// Aman AI v3.0
// Premium Frontend
// Part 1 - Foundation
// =====================================================


// ============================================
// DOM
// ============================================

const sidebar =
document.getElementById("sidebar");

const overlay =
document.getElementById("overlay");

const chat =
document.getElementById("chat");

const input =
document.getElementById("input");

const sendBtn =
document.getElementById("sendBtn");

const voiceBtn =
document.getElementById("voiceBtn");

const menuBtn =
document.getElementById("menuBtn");

const closeSidebarBtn =
document.getElementById("closeSidebarBtn");

const deleteChatBtn =
document.getElementById("deleteChatBtn");

const newChatBtn =
document.getElementById("newChatBtn");

const chatList =
document.getElementById("chatList");

const fileInput =
document.getElementById("fileInput");


// ============================================
// USER
// ============================================

let userId =
localStorage.getItem(
"AmanUser"
);

if(!userId){

userId =
"user_" +
Date.now();

localStorage.setItem(
"AmanUser",
userId
);

}

let currentChatId =
localStorage.getItem(
"AmanChat"
) || null;



// ============================================
// SIDEBAR
// ============================================

function openSidebar(){

sidebar.classList.add(
"open"
);

overlay.classList.add(
"show"
);

}


function closeSidebar(){

sidebar.classList.remove(
"open"
);

overlay.classList.remove(
"show"
);

}


function toggleSidebar(){

if(
sidebar.classList.contains(
"open"
)
){

closeSidebar();

}
else{

openSidebar();

}

}



// ============================================
// EVENTS
// ============================================

menuBtn.onclick =
openSidebar;

closeSidebarBtn.onclick =
closeSidebar;

overlay.onclick =
closeSidebar;



document.addEventListener(
"keydown",
e=>{

if(
e.key==="Escape"
){

closeSidebar();

}

}
);



// ============================================
// AUTO RESIZE INPUT
// ============================================

input.addEventListener(
"input",
()=>{

input.style.height=
"auto";

input.style.height=
input.scrollHeight+
"px";

}
);



// ============================================
// FILE PICKER
// ============================================

const plusButton =
document.createElement(
"button"
);

plusButton.innerHTML="➕";

plusButton.className=
"composer-btn";

document.querySelector(
".composer"
).insertBefore(

plusButton,

voiceBtn

);



plusButton.onclick=()=>{

fileInput.click();

};



fileInput.onchange=()=>{

const file =
fileInput.files[0];

if(!file)
return;

console.log(
"Selected:",
file.name
);

// Upload logic
// Part 3

};



// ============================================
// EMPTY CHAT
// ============================================

function showWelcome(){

chat.innerHTML=`

<div class="empty-chat">

<h1>
🤖
</h1>

<h2>
Welcome to Aman AI
</h2>

<p>

Ask anything...

Upload files...

Generate code...

Learn faster...

</p>

</div>

`;

}



// ============================================
// START
// ============================================

showWelcome();
// =====================================================
// PART 2 - CHAT ENGINE
// =====================================================



// ============================================
// MARKDOWN SETUP
// ============================================

function renderMarkdown(text){

    if(typeof marked !== "undefined"){

        return marked.parse(text);

    }

    return text;

}
function attachCodeCopyButtons(container){

    const blocks =
    container.querySelectorAll("pre");

    blocks.forEach(pre=>{

        if(pre.querySelector(".copy-code-btn"))
        return;

        const button =
        document.createElement("button");

        button.className =
        "copy-code-btn";

        button.textContent =
        "📋 Copy";

        button.onclick = ()=>{

            const code =
            pre.querySelector("code");

            navigator.clipboard.writeText(
                code.innerText
            );

            button.textContent =
            "✅ Copied";

            setTimeout(()=>{

                button.textContent =
                "📋 Copy";

            },2000);

        };

        pre.style.position =
        "relative";

        pre.appendChild(button);

    });

}




// ============================================
// ADD MESSAGE
// ============================================

function addMessage(
    content,
    role
){

    const wrapper =
    document.createElement(
        "div"
    );


    wrapper.className =
    "message " + role;



    const bubble =
    document.createElement(
        "div"
    );


    bubble.className =
    "bubble";


    bubble.innerHTML =
    renderMarkdown(content);
    
    attachCodeCopyButtons(
        bubble
    );



    wrapper.appendChild(
        bubble
    );



    chat.appendChild(
        wrapper
    );


    scrollChat();



    if(role === "ai"){

        addMessageActions(
            wrapper,
            content
        );

    }


    return wrapper;

}





// ============================================
// TYPING EFFECT
// ============================================

async function typeAI(
    element,
    text
){

    element.innerHTML="";


    let current="";


    for(
        let i=0;
        i<text.length;
        i++
    ){

        current +=
        text[i];


        element.innerHTML =
        current;


        scrollChat();


        await new Promise(
            resolve =>
            setTimeout(
                resolve,
                15
            )
        );

    }


    element.innerHTML =
    renderMarkdown(text);

    attachCodeCopyButtons(
        element
    );


}





// ============================================
// SCROLL
// ============================================

function scrollChat(){

    chat.scrollTop =
    chat.scrollHeight;

}





// ============================================
// LOADING MESSAGE
// ============================================

function createLoading(){

    const wrapper =
    document.createElement(
        "div"
    );


    wrapper.className =
    "message ai";


    const bubble =
    document.createElement(
        "div"
    );


    bubble.className =
    "bubble";


    bubble.innerHTML=`

    <div class="typing">

        <span></span>
        <span></span>
        <span></span>

    </div>

    `;


    wrapper.appendChild(
        bubble
    );


    chat.appendChild(
        wrapper
    );


    scrollChat();


    return bubble;

}





// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage(){


    const message =
    input.value.trim();


    if(!message)
    return;



    // remove welcome screen

    if(
        document.querySelector(
        ".empty-chat"
        )
    ){

        chat.innerHTML="";

    }



    addMessage(
        message,
        "user"
    );


    input.value="";

    input.style.height="auto";



    const loading =
    createLoading();




    try{


        const response =
        await fetch(

        "http://localhost:3000/chat",

        {

        method:"POST",

        headers:{

        "Content-Type":
        "application/json"

        },


        body:JSON.stringify({

            message,

            userId,

            chatId:
            currentChatId

        })

        }

        );



        const data =
        await response.json();




        if(data.chatId){


            currentChatId =
            data.chatId;


            localStorage.setItem(

            "AmanChat",

            currentChatId

            );

        }



        loading.parentElement.remove();



        const aiMessage =
        addMessage(
            "",
            "ai"
        );


        const bubble =
        aiMessage.querySelector(
        ".bubble"
        );


        await typeAI(

            bubble,

            data.reply ||
            "No response received."

        );



        loadChats();



    }


    catch(error){


        loading.parentElement.remove();



        addMessage(

        "⚠️ Unable to connect to Aman AI server.",

        "ai"

        );


        console.error(
        error
        );


    }



}





// ============================================
// BUTTON EVENTS
// ============================================


sendBtn.onclick =
sendMessage;



input.addEventListener(
"keydown",
e=>{

if(
e.key==="Enter" &&
!e.shiftKey
){

e.preventDefault();

sendMessage();

}

});
// =====================================================
// PART 3 - ACTIONS + MEMORY
// =====================================================



// ============================================
// MESSAGE ACTION BUTTONS
// ============================================

function addMessageActions(
    messageBox,
    text
){

    const actions =
    document.createElement(
        "div"
    );


    actions.className =
    "message-actions";


    actions.innerHTML=`

    <button title="Copy">
        📋
    </button>

    <button title="Like">
        👍
    </button>

    <button title="Dislike">
        👎
    </button>

    <button title="Share">
        🔗
    </button>

    `;



    const buttons =
    actions.querySelectorAll(
    "button"
    );



    // Copy

    buttons[0].onclick =
    ()=>{

        navigator.clipboard.writeText(
            text
        );


        buttons[0].innerHTML="✅";


    };



    // Like

    buttons[1].onclick =
    ()=>{

        buttons[1].innerHTML=
        "👍✅";

    };



    // Dislike

    buttons[2].onclick =
    ()=>{

        buttons[2].innerHTML=
        "👎✅";

    };



    // Share

    buttons[3].onclick =
    async ()=>{


        if(
        navigator.share
        ){

            await navigator.share({

                text:text

            });


        }

        else{


            navigator.clipboard.writeText(
                text
            );


        }


    };



    messageBox.appendChild(
        actions
    );


}




// ============================================
// LOAD CHAT HISTORY
// ============================================

async function loadChats(){


    try{


        const res =
        await fetch(

        "http://localhost:3000/chat/chats/"
        +
        userId

        );



        const chats =
        await res.json();



        chatList.innerHTML="";



        Object.keys(chats)
        .forEach(id=>{


            const item =
            document.createElement(
                "div"
            );


            item.className=
            "chat-item";



            item.innerHTML=

            "💬 "
            +
            (
            chats[id].title
            ||
            "New Chat"
            );



            item.onclick =
            ()=>{


                currentChatId=id;


                localStorage.setItem(

                "AmanChat",

                id

                );


                closeSidebar();


                loadCurrentChat();


            };



            chatList.appendChild(
                item
            );


        });


    }

    catch(error){

        console.error(
        "History error",
        error
        );

    }


}





// ============================================
// LOAD SINGLE CHAT
// ============================================

async function loadCurrentChat(){


    if(!currentChatId)
    return;



    try{


        const res =
        await fetch(

        "http://localhost:3000/chat/"
        +
        userId
        +
        "/"
        +
        currentChatId

        );



        const data =
        await res.json();



        chat.innerHTML="";



        const history =
        data.history || [];



        history.forEach(
        msg=>{


            addMessage(

            msg.content,

            msg.role === "user"
            ?
            "user"
            :
            "ai"

            );


        });



    }

    catch(error){

        console.error(error);

    }


}





// ============================================
// NEW CHAT
// ============================================

async function createNewChat(){


    const res =
    await fetch(

    "http://localhost:3000/chat/new-chat",

    {

    method:"POST",

    headers:{

    "Content-Type":
    "application/json"

    },


    body:JSON.stringify({

        userId

    })

    }

    );



    const data =
    await res.json();



    currentChatId =
    data.chatId;



    localStorage.setItem(

    "AmanChat",

    currentChatId

    );



    chat.innerHTML="";



    showWelcome();


    loadChats();


}





newChatBtn.onclick =
createNewChat;





// ============================================
// DELETE CHAT
// ============================================

async function deleteCurrentChat(){


    if(!currentChatId)
    return;



    await fetch(

    "http://localhost:3000/chat/"
    +
    userId
    +
    "/"
    +
    currentChatId,

    {

    method:"DELETE"

    }

    );



    currentChatId=null;



    localStorage.removeItem(
    "AmanChat"
    );



    chat.innerHTML="";


    showWelcome();


    loadChats();


}



deleteChatBtn.onclick =
deleteCurrentChat;





// ============================================
// FILE SELECT
// ============================================

fileInput.addEventListener(
"change",
()=>{


    const file =
    fileInput.files[0];



    if(!file)
    return;



    addMessage(

    "📎 Selected file: "
    +
    file.name,

    "user"

    );


});





// ============================================
// VOICE PLACEHOLDER
// ============================================

voiceBtn.onclick =
()=>{

    alert(
    "🎤 Voice input will be added soon."
    );

};





// ============================================
// START APP
// ============================================

loadChats();

if(currentChatId){

    loadCurrentChat();

}