// ======================================================
// Aman AI v4.0
// Premium Frontend
// COMPLETE SCRIPT
// ======================================================


// ======================================================
// API
// ======================================================

const API =
"https://amanai-mdtj.onrender.com/chat";


// ======================================================
// DOM
// ======================================================

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


// ======================================================
// USER ID
// ======================================================

let userId =
localStorage.getItem("AmanUser");


// Create permanent browser identity
// only if one does not already exist.

if (!userId) {

    userId =
    "user_" + Date.now();

    localStorage.setItem(
        "AmanUser",
        userId
    );
}


// ======================================================
// CURRENT CHAT ID
// ======================================================

// IMPORTANT:
// Never allow 0, "0", "null", "undefined"
// or empty values to become a chat ID.

let currentChatId =
localStorage.getItem("AmanChat");


function isValidChatId(id) {

    if (!id) {
        return false;
    }

    if (id === "0") {
        return false;
    }

    if (id === 0) {
        return false;
    }

    if (id === "null") {
        return false;
    }

    if (id === "undefined") {
        return false;
    }

    if (typeof id !== "string") {
        return false;
    }

    if (!id.startsWith("chat_")) {
        return false;
    }

    return true;
}


// Remove old/broken chat ID.

if (!isValidChatId(currentChatId)) {

    currentChatId = null;

    localStorage.removeItem(
        "AmanChat"
    );
}


// ======================================================
// SIDEBAR
// ======================================================

function openSidebar() {

    sidebar.classList.add("open");

    overlay.classList.add("show");
}


function closeSidebar() {

    sidebar.classList.remove("open");

    overlay.classList.remove("show");
}


if (menuBtn) {
    menuBtn.onclick = openSidebar;
}


if (closeSidebarBtn) {
    closeSidebarBtn.onclick =
    closeSidebar;
}


if (overlay) {
    overlay.onclick =
    closeSidebar;
}


document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {

            closeSidebar();

        }

    }
);


// ======================================================
// AUTO RESIZE
// ======================================================

if (input) {

    input.addEventListener(
        "input",
        () => {

            input.style.height =
            "auto";

            input.style.height =
            input.scrollHeight + "px";

        }
    );

}


// ======================================================
// PLUS BUTTON
// ======================================================

const plusButton =
document.createElement("button");

plusButton.className =
"composer-btn";

plusButton.innerHTML =
"➕";


const composer =
document.querySelector(".composer");


if (composer && voiceBtn) {

    composer.insertBefore(
        plusButton,
        voiceBtn
    );

}


plusButton.onclick = () => {

    if (fileInput) {
        fileInput.click();
    }

};


if (fileInput) {

    fileInput.onchange = () => {

        const file =
        fileInput.files[0];

        if (!file) {
            return;
        }

        addMessage(
            "📎 " + file.name,
            "user"
        );

    };

}


// ======================================================
// WELCOME
// ======================================================

function showWelcome() {

    chat.innerHTML = `

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


// ======================================================
// CLEAR CHAT
// ======================================================

function clearChat() {

    chat.innerHTML = "";

}


// ======================================================
// MARKDOWN
// ======================================================

function renderMarkdown(text) {

    if (
        typeof marked !==
        "undefined"
    ) {

        return marked.parse(text);

    }

    return text;

}


// ======================================================
// COPY CODE BUTTONS
// ======================================================

function attachCodeCopyButtons(
    container
) {

    const blocks =
    container.querySelectorAll(
        "pre"
    );


    blocks.forEach(
        (pre) => {

            if (
                pre.querySelector(
                    ".copy-code-btn"
                )
            ) {

                return;

            }


            const btn =
            document.createElement(
                "button"
            );


            btn.className =
            "copy-code-btn";

            btn.textContent =
            "📋 Copy";


            btn.onclick = () => {

                const code =
                pre.querySelector(
                    "code"
                );


                if (!code) {
                    return;
                }


                navigator.clipboard
                .writeText(
                    code.innerText
                );


                btn.textContent =
                "✅ Copied";


                setTimeout(
                    () => {

                        btn.textContent =
                        "📋 Copy";

                    },
                    2000
                );

            };


            pre.style.position =
            "relative";


            pre.appendChild(btn);

        }
    );

}


// ======================================================
// SCROLL
// ======================================================

function scrollChat() {

    chat.scrollTop =
    chat.scrollHeight;

}


// ======================================================
// ADD MESSAGE
// ======================================================

function addMessage(
    content,
    role
) {

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


    wrapper.appendChild(
        bubble
    );


    chat.appendChild(
        wrapper
    );


    attachCodeCopyButtons(
        bubble
    );


    scrollChat();


    if (role === "ai") {

        addMessageActions(
            wrapper,
            content
        );

    }


    return bubble;

}


// ======================================================
// LOADING / TYPING
// ======================================================

function createLoading() {

    const wrapper =
    document.createElement(
        "div"
    );


    wrapper.className =
    "message ai";


    wrapper.innerHTML = `

        <div class="bubble">

            <div class="typing">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    chat.appendChild(
        wrapper
    );


    scrollChat();


    return wrapper;

}


// ======================================================
// AI TYPING EFFECT
// ======================================================

async function typeAI(
    element,
    text
) {

    element.innerHTML =
    "";


    let output = "";


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        output += text[i];

        element.innerHTML =
        output;

        scrollChat();


        await new Promise(
            (resolve) =>
            setTimeout(
                resolve,
                12
            )
        );

    }


    element.innerHTML =
    renderMarkdown(text);


    attachCodeCopyButtons(
        element
    );

}


// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage() {

    const message =
    input.value.trim();


    if (!message) {
        return;
    }


    if (
        document.querySelector(
            ".empty-chat"
        )
    ) {

        clearChat();

    }


    addMessage(
        message,
        "user"
    );


    input.value = "";

    input.style.height =
    "auto";


    const loading =
    createLoading();


    try {

        /*
        ==================================================
        IMPORTANT

        If there is no valid current chat,
        DO NOT send 0/null/undefined.

        The backend will create a real chat.
        ==================================================
        */

        const requestBody = {

            message,

            userId

        };


        if (
            isValidChatId(
                currentChatId
            )
        ) {

            requestBody.chatId =
            currentChatId;

        }


        console.log(
            "SENDING:",
            requestBody
        );


        const res =
        await fetch(
            API,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                    "application/json"

                },

                body:
                JSON.stringify(
                    requestBody
                )

            }
        );


        const data =
        await res.json();


        loading.remove();


        /*
        ==================================================
        SERVER MUST RETURN A REAL CHAT ID
        ==================================================
        */

        if (
            data.chatId &&
            isValidChatId(
                data.chatId
            )
        ) {

            currentChatId =
            data.chatId;


            localStorage.setItem(
                "AmanChat",
                currentChatId
            );


            console.log(
                "CURRENT CHAT:",
                currentChatId
            );

        }


        /*
        ==================================================
        ERROR RESPONSE
        ==================================================
        */

        if (
            data.success === false
        ) {

            addMessage(
                data.reply ||
                "⚠️ Aman AI returned an error.",
                "ai"
            );

            return;

        }


        /*
        ==================================================
        AI RESPONSE
        ==================================================
        */

        const bubble =
        addMessage(
            "",
            "ai"
        );


        await typeAI(
            bubble,
            data.reply ||
            "No response."
        );


        loadChats();


    }
    catch (err) {

        loading.remove();


        addMessage(
            "⚠️ Unable to connect to Aman AI server.",
            "ai"
        );


        console.error(
            "CHAT ERROR:",
            err
        );

    }

}


if (sendBtn) {

    sendBtn.onclick =
    sendMessage;

}


if (input) {

    input.addEventListener(
        "keydown",
        (e) => {

            if (
                e.key === "Enter" &&
                !e.shiftKey
            ) {

                e.preventDefault();

                sendMessage();

            }

        }
    );

}


// ======================================================
// MESSAGE ACTIONS
// ======================================================

function addMessageActions(
    messageBox,
    text
) {

    const actions =
    document.createElement(
        "div"
    );


    actions.className =
    "message-actions";


    actions.innerHTML = `

        <button>📋</button>
        <button>👍</button>
        <button>👎</button>
        <button>🔗</button>

    `;


    const btn =
    actions.querySelectorAll(
        "button"
    );


    btn[0].onclick =
    () => {

        navigator.clipboard
        .writeText(text);

    };


    btn[1].onclick =
    () => {

        btn[1].innerHTML =
        "👍✅";

    };


    btn[2].onclick =
    () => {

        btn[2].innerHTML =
        "👎✅";

    };


    btn[3].onclick =
    async () => {

        if (
            navigator.share
        ) {

            navigator.share({
                text
            });

        }
        else {

            navigator.clipboard
            .writeText(text);

        }

    };


    messageBox.appendChild(
        actions
    );

}


// ======================================================
// LOAD CHATS
// ======================================================

async function loadChats() {

    try {

        const res =
        await fetch(
            `${API}/chats/${userId}`
        );


        if (!res.ok) {

            throw new Error(
                "Failed to load chats"
            );

        }


        const chats =
        await res.json();


        chatList.innerHTML =
        "";


        /*
        ==================================================
        NEW POSTGRESQL FORMAT

        Backend returns:

        [
            {
                chat_id: "...",
                title: "..."
            }
        ]

        ==================================================
        */

        if (
            Array.isArray(chats)
        ) {

            chats.forEach(
                (item) => {

                    const id =
                    item.chat_id;


                    if (
                        !isValidChatId(
                            id
                        )
                    ) {

                        return;

                    }


                    const div =
                    document.createElement(
                        "div"
                    );


                    div.className =
                    "chat-item";


                    div.innerHTML =
                    "💬 " +
                    (
                        item.title ||
                        "New Chat"
                    );


                    div.onclick =
                    () => {

                        currentChatId =
                        id;


                        localStorage.setItem(
                            "AmanChat",
                            id
                        );


                        loadCurrentChat();

                        closeSidebar();

                    };


                    chatList.appendChild(
                        div
                    );

                }
            );

        }


        /*
        ==================================================
        OLD FORMAT SUPPORT

        This keeps compatibility if an older
        server response is ever encountered.
        ==================================================
        */

        else if (
            chats &&
            typeof chats === "object"
        ) {

            Object.keys(chats)
            .forEach(
                (id) => {

                    if (
                        !isValidChatId(
                            id
                        )
                    ) {

                        return;

                    }


                    const div =
                    document.createElement(
                        "div"
                    );


                    div.className =
                    "chat-item";


                    div.innerHTML =
                    "💬 " +
                    (
                        chats[id]
                        ?.title ||
                        "New Chat"
                    );


                    div.onclick =
                    () => {

                        currentChatId =
                        id;


                        localStorage.setItem(
                            "AmanChat",
                            id
                        );


                        loadCurrentChat();

                        closeSidebar();

                    };


                    chatList.appendChild(
                        div
                    );

                }
            );

        }

    }
    catch (err) {

        console.error(
            "LOAD CHATS ERROR:",
            err
        );

    }

}


// ======================================================
// LOAD CURRENT CHAT
// ======================================================

async function loadCurrentChat() {

    if (
        !isValidChatId(
            currentChatId
        )
    ) {

        currentChatId =
        null;


        localStorage.removeItem(
            "AmanChat"
        );


        showWelcome();

        return;

    }


    try {

        const res =
        await fetch(
            `${API}/${userId}/${currentChatId}`
        );


        if (!res.ok) {

            /*
            ==============================================
            If the browser has a chat ID that no longer
            exists in PostgreSQL, remove it safely.
            ==============================================
            */

            currentChatId =
            null;


            localStorage.removeItem(
                "AmanChat"
            );


            showWelcome();

            return;

        }


        const data =
        await res.json();


        chat.innerHTML =
        "";


        (
            data.history || []
        )
        .forEach(
            (msg) => {

                addMessage(

                    msg.content,

                    msg.role === "user"
                    ? "user"
                    : "ai"

                );

            }
        );


        if (
            !data.history ||
            data.history.length === 0
        ) {

            showWelcome();

        }

    }
    catch (err) {

        console.error(
            "LOAD CHAT ERROR:",
            err
        );

    }

}


// ======================================================
// NEW CHAT
// ======================================================

async function createNewChat() {

    try {

        const res =
        await fetch(
            `${API}/new-chat`,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                    "application/json"

                },

                body:
                JSON.stringify({

                    userId

                })

            }
        );


        const data =
        await res.json();


        /*
        ==================================================
        ONLY ACCEPT A REAL DATABASE CHAT ID
        ==================================================
        */

        if (
            !data.chatId ||
            !isValidChatId(
                data.chatId
            )
        ) {

            console.error(
                "INVALID CHAT ID:",
                data
            );

            return;

        }


        currentChatId =
        data.chatId;


        localStorage.setItem(
            "AmanChat",
            currentChatId
        );


        showWelcome();


        loadChats();


        closeSidebar();


        console.log(
            "NEW CHAT:",
            currentChatId
        );

    }
    catch (err) {

        console.error(
            "CREATE CHAT ERROR:",
            err
        );

    }

}


if (newChatBtn) {

    newChatBtn.onclick =
    createNewChat;

}


// ======================================================
// DELETE CURRENT CHAT
// ======================================================

async function deleteCurrentChat() {

    if (
        !isValidChatId(
            currentChatId
        )
    ) {

        currentChatId =
        null;


        localStorage.removeItem(
            "AmanChat"
        );


        showWelcome();

        return;

    }


    try {

        await fetch(
            `${API}/${userId}/${currentChatId}`,
            {

                method: "DELETE"

            }
        );

    }
    catch (err) {

        console.error(
            "DELETE CHAT ERROR:",
            err
        );

    }


    currentChatId =
    null;


    localStorage.removeItem(
        "AmanChat"
    );


    showWelcome();


    loadChats();

}


if (deleteChatBtn) {

    deleteChatBtn.onclick =
    deleteCurrentChat;

}


// ======================================================
// VOICE
// ======================================================

if (voiceBtn) {

    voiceBtn.onclick =
    () => {

        alert(
            "🎤 Voice Mode coming soon."
        );

    };

}


// ======================================================
// START APPLICATION
// ======================================================

if (
    !isValidChatId(
        currentChatId
    )
) {

    currentChatId =
    null;

    localStorage.removeItem(
        "AmanChat"
    );

    showWelcome();

}
else {

    loadCurrentChat();

}


loadChats();


// ======================================================
// END
// ======================================================
