// ======================================================
// Aman AI v4.0
// Premium Frontend
// PART 1
// ======================================================

// ----------------------
// API
// ----------------------

const API =
"https://amanai-mdtj.onrender.com/chat";

// ----------------------
// DOM
// ----------------------

const sidebar=document.getElementById("sidebar");
const overlay=document.getElementById("overlay");
const chat=document.getElementById("chat");
const input=document.getElementById("input");
const sendBtn=document.getElementById("sendBtn");
const voiceBtn=document.getElementById("voiceBtn");
const menuBtn=document.getElementById("menuBtn");
const closeSidebarBtn=document.getElementById("closeSidebarBtn");
const deleteChatBtn=document.getElementById("deleteChatBtn");
const newChatBtn=document.getElementById("newChatBtn");
const chatList=document.getElementById("chatList");
const fileInput=document.getElementById("fileInput");

// ----------------------
// USER
// ----------------------

let userId=localStorage.getItem("AmanUser");

if(!userId){

userId="user_"+Date.now();

localStorage.setItem(
"AmanUser",
userId
);

}

let currentChatId=
localStorage.getItem("AmanChat");

if(currentChatId==="null"){

currentChatId=null;

}

// ----------------------
// SIDEBAR
// ----------------------

function openSidebar(){

sidebar.classList.add("open");

overlay.classList.add("show");

}

function closeSidebar(){

sidebar.classList.remove("open");

overlay.classList.remove("show");

}

menuBtn.onclick=openSidebar;

closeSidebarBtn.onclick=closeSidebar;

overlay.onclick=closeSidebar;

document.addEventListener("keydown",e=>{

if(e.key==="Escape"){

closeSidebar();

}

});

// ----------------------
// AUTO RESIZE
// ----------------------

input.addEventListener("input",()=>{

input.style.height="auto";

input.style.height=input.scrollHeight+"px";

});

// ----------------------
// PLUS BUTTON
// ----------------------

const plusButton=document.createElement("button");

plusButton.className="composer-btn";

plusButton.innerHTML="➕";

document.querySelector(".composer").insertBefore(

plusButton,

voiceBtn

);

plusButton.onclick=()=>{

fileInput.click();

};

fileInput.onchange=()=>{

const file=fileInput.files[0];

if(!file)return;

addMessage(

"📎 "+file.name,

"user"

);

};

// ----------------------
// WELCOME
// ----------------------

function showWelcome(){

chat.innerHTML=`

<div class="empty-chat">

<h1>🤖</h1>

<h2>Welcome to Aman AI</h2>

<p>

Ask anything...

Generate code...

Upload files...

Learn faster...

</p>

</div>

`;

}

// ----------------------
// CLEAR CHAT
// ----------------------

function clearChat(){

chat.innerHTML="";

}

// ----------------------
// START
// ----------------------

if(!currentChatId){

showWelcome();

}
// ======================================================
// PART 2 - CHAT ENGINE
// ======================================================

// ----------------------
// Markdown
// ----------------------

function renderMarkdown(text){

    if(typeof marked !== "undefined"){

        return marked.parse(text);

    }

    return text;

}

// ----------------------
// Copy Button
// ----------------------

function attachCodeCopyButtons(container){

    const blocks=container.querySelectorAll("pre");

    blocks.forEach(pre=>{

        if(pre.querySelector(".copy-code-btn")) return;

        const btn=document.createElement("button");

        btn.className="copy-code-btn";

        btn.textContent="📋 Copy";

        btn.onclick=()=>{

            const code=pre.querySelector("code");

            navigator.clipboard.writeText(code.innerText);

            btn.textContent="✅ Copied";

            setTimeout(()=>{

                btn.textContent="📋 Copy";

            },2000);

        };

        pre.style.position="relative";

        pre.appendChild(btn);

    });

}

// ----------------------
// Scroll
// ----------------------

function scrollChat(){

    chat.scrollTop=chat.scrollHeight;

}

// ----------------------
// Message
// ----------------------

function addMessage(content,role){

    const wrapper=document.createElement("div");

    wrapper.className="message "+role;

    const bubble=document.createElement("div");

    bubble.className="bubble";

    bubble.innerHTML=renderMarkdown(content);

    wrapper.appendChild(bubble);

    chat.appendChild(wrapper);

    attachCodeCopyButtons(bubble);

    scrollChat();

    if(role==="ai"){

        addMessageActions(wrapper,content);

    }

    return bubble;

}

// ----------------------
// Typing
// ----------------------

function createLoading(){

    const wrapper=document.createElement("div");

    wrapper.className="message ai";

    wrapper.innerHTML=`

    <div class="bubble">

        <div class="typing">

            <span></span>

            <span></span>

            <span></span>

        </div>

    </div>

    `;

    chat.appendChild(wrapper);

    scrollChat();

    return wrapper;

}

// ----------------------
// AI Typing Effect
// ----------------------

async function typeAI(element,text){

    element.innerHTML="";

    let output="";

    for(let i=0;i<text.length;i++){

        output+=text[i];

        element.innerHTML=output;

        scrollChat();

        await new Promise(r=>setTimeout(r,12));

    }

    element.innerHTML=renderMarkdown(text);

    attachCodeCopyButtons(element);

}

// ----------------------
// Send Message
// ----------------------

async function sendMessage(){

    const message=input.value.trim();

    if(!message) return;

    if(document.querySelector(".empty-chat")){

        clearChat();

    }

    addMessage(message,"user");

    input.value="";

    input.style.height="auto";

    const loading=createLoading();

    try{

        const res=await fetch(API,{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                message,

                userId,

                chatId:currentChatId

            })

        });

        const data=await res.json();

        loading.remove();

        if(data.chatId){

            currentChatId=data.chatId;

            localStorage.setItem(

                "AmanChat",

                currentChatId

            );

        }

        const bubble=addMessage("","ai");

        await typeAI(

            bubble,

            data.reply || "No response."

        );

        loadChats();

    }

    catch(err){

        loading.remove();

        addMessage(

            "⚠️ Unable to connect to Aman AI server.",

            "ai"

        );

        console.error(err);

    }

}

sendBtn.onclick=sendMessage;

input.addEventListener("keydown",e=>{

    if(e.key==="Enter" && !e.shiftKey){

        e.preventDefault();

        sendMessage();

    }

});

// ======================================================
// PART 3 - MEMORY + CHAT HISTORY
// ======================================================

// ----------------------
// Message Actions
// ----------------------

function addMessageActions(messageBox,text){

    const actions=document.createElement("div");

    actions.className="message-actions";

    actions.innerHTML=`
<button>📋</button>
<button>👍</button>
<button>👎</button>
<button>🔗</button>
`;

    const btn=actions.querySelectorAll("button");

    btn[0].onclick=()=>navigator.clipboard.writeText(text);

    btn[1].onclick=()=>btn[1].innerHTML="👍✅";

    btn[2].onclick=()=>btn[2].innerHTML="👎✅";

    btn[3].onclick=async()=>{

        if(navigator.share){

            navigator.share({text});

        }else{

            navigator.clipboard.writeText(text);

        }

    };

    messageBox.appendChild(actions);

}

// ----------------------
// Load Chats
// ----------------------

async function loadChats(){

    try{

        const res=await fetch(

            `${API}/chats/${userId}`

        );

        const chats=await res.json();

        chatList.innerHTML="";

        Object.keys(chats).forEach(id=>{

            const div=document.createElement("div");

            div.className="chat-item";

            div.innerHTML="💬 "+(chats[id].title||"New Chat");

            div.onclick=()=>{

                currentChatId=id;

                localStorage.setItem(

                    "AmanChat",

                    id

                );

                loadCurrentChat();

                closeSidebar();

            };

            chatList.appendChild(div);

        });

    }

    catch(err){

        console.error(err);

    }

}

// ----------------------
// Load Current Chat
// ----------------------

async function loadCurrentChat(){

    if(!currentChatId){

        showWelcome();

        return;

    }

    try{

        const res=await fetch(

            `${API}/${userId}/${currentChatId}`

        );

        const data=await res.json();

        chat.innerHTML="";

        (data.history||[]).forEach(msg=>{

            addMessage(

                msg.content,

                msg.role==="user"

                ?"user"

                :"ai"

            );

        });

    }

    catch(err){

        console.error(err);

    }

}

// ----------------------
// New Chat
// ----------------------

async function createNewChat(){

    try{

        const res=await fetch(

            `${API}/new-chat`,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    userId

                })

            }

        );

        const data=await res.json();

        currentChatId=data.chatId;

        localStorage.setItem(

            "AmanChat",

            currentChatId

        );

        showWelcome();

        loadChats();

    }

    catch(err){

        console.error(err);

    }

}

newChatBtn.onclick=createNewChat;

// ----------------------
// Delete Chat
// ----------------------

async function deleteCurrentChat(){

    if(!currentChatId) return;

    try{

        await fetch(

            `${API}/${userId}/${currentChatId}`,

            {

                method:"DELETE"

            }

        );

    }

    catch(err){

        console.error(err);

    }

    currentChatId=null;

    localStorage.removeItem("AmanChat");

    showWelcome();

    loadChats();

}

deleteChatBtn.onclick=deleteCurrentChat;

// ----------------------
// Voice
// ----------------------

voiceBtn.onclick=()=>{

    alert("🎤 Voice Mode coming soon.");

};

// ----------------------
// Start
// ----------------------

loadChats();

if(currentChatId){

    loadCurrentChat();

}