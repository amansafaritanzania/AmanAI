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

const attachBtn =
document.getElementById("attachBtn");

const workspaceSelect =
document.getElementById("workspaceSelect");

const workspaceBadge =
document.getElementById("workspaceBadge");

const actionModal =
document.getElementById("actionModal");

const actionModalBody =
document.getElementById("actionModalBody");

const actionModalTitle =
document.getElementById("actionModalTitle");

const actionModalClose =
document.getElementById("actionModalClose");

let selectedFile =
null;


// ======================================================
// AUTHENTICATED ACCOUNT IDENTITY
// ======================================================

/*
The browser no longer creates or chooses a userId.

The secure HTTP-only session cookie identifies the user
on the server.

All fetch requests use credentials:"same-origin".
*/

let accountUserId = null;

async function loadAuthenticatedAccount() {

    try {

        const res =
        await fetch(
            "/api/auth/me",
            {
                credentials:
                "same-origin"
            }
        );

        if (!res.ok) {

            location.replace(
                "/login"
            );

            return false;
        }

        const data =
        await res.json();

        accountUserId =
        data.user?.userId ||
        data.userId ||
        null;

        if (!accountUserId) {

            console.error(
                "ACCOUNT ID MISSING"
            );

            location.replace(
                "/login"
            );

            return false;
        }

        /*
        ==================================================
        ACCOUNT ↔ LOCAL CHAT MIGRATION

        AmanChat is only a pointer to the last-opened
        chat on THIS browser.

        If a different Aman AI account signs in on the
        same browser, never reuse the previous account's
        stored AmanChat value.

        This does NOT delete any chat from PostgreSQL.
        It only clears the local pointer.
        ==================================================
        */

        const previousAccountUserId =
        localStorage.getItem(
            "AmanAccountUser"
        );

        if (
            previousAccountUserId &&
            previousAccountUserId !==
            accountUserId
        ) {

            localStorage.removeItem(
                "AmanChat"
            );

            currentChatId = null;

            console.log(
                "ACCOUNT CHANGED: cleared old local chat pointer"
            );
        }

        localStorage.setItem(
            "AmanAccountUser",
            accountUserId
        );

        /*
        Remove the old pre-account browser identity.
        It must never control chat ownership again.
        */

        localStorage.removeItem(
            "AmanUser"
        );

        return true;

    }
    catch (error) {

        console.error(
            "ACCOUNT CHECK ERROR:",
            error
        );

        location.replace(
            "/login"
        );

        return false;
    }

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
// SIDEBAR — DESKTOP + MOBILE SAFE
// ======================================================

function setSidebarState(
    open
) {

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle(
        "open",
        open
    );

    if (overlay) {
        overlay.classList.toggle(
            "show",
            open
        );

        overlay.setAttribute(
            "aria-hidden",
            open
                ? "false"
                : "true"
        );
    }

    sidebar.setAttribute(
        "aria-hidden",
        open
            ? "false"
            : "true"
    );

    if (menuBtn) {
        menuBtn.setAttribute(
            "aria-expanded",
            open
                ? "true"
                : "false"
        );
    }

    document.body.classList.toggle(
        "sidebar-open",
        open
    );
}


function openSidebar() {

    setSidebarState(
        true
    );

}


function closeSidebar() {

    setSidebarState(
        false
    );

}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            const open =
                sidebar?.classList
                    .contains(
                        "open"
                    );

            setSidebarState(
                !open
            );

        }
    );

}


if (closeSidebarBtn) {

    closeSidebarBtn.addEventListener(
        "click",
        closeSidebar
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeSidebar();

        }

    }
);


/*
Close mobile sidebar after rotating/resizing
into desktop layout so the overlay never gets stuck.
*/

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth >
            900
        ) {

            closeSidebar();

        }

    }
);


/*
Simple swipe-to-close support on phones.
*/

let sidebarTouchStartX =
    null;


if (sidebar) {

    sidebar.addEventListener(
        "touchstart",
        (event) => {

            sidebarTouchStartX =
                event.touches?.[0]
                    ?.clientX ?? null;

        },
        {
            passive: true
        }
    );


    sidebar.addEventListener(
        "touchend",
        (event) => {

            if (
                sidebarTouchStartX ===
                null
            ) {
                return;
            }

            const endX =
                event.changedTouches?.[0]
                    ?.clientX ?? sidebarTouchStartX;

            const delta =
                endX -
                sidebarTouchStartX;

            sidebarTouchStartX =
                null;

            if (
                delta < -70
            ) {

                closeSidebar();

            }

        },
        {
            passive: true
        }
    );

}


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
// FILE ATTACHMENT
// ======================================================

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]);

const FILE_EXTENSIONS = new Set([
    ".pdf",".docx",".txt",".md",".csv",".json",
    ".js",".mjs",".cjs",".ts",".tsx",".jsx",
    ".html",".htm",".css",".scss",".py",".java",
    ".php",".rb",".go",".rs",".c",".h",".cpp",
    ".hpp",".cs",".sql",".xml",".yaml",".yml",
    ".sh",".bat",".ps1",".ini",".toml"
]);

function fileExt(name = "") {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function resetAttachment() {
    selectedFile = null;

    if (fileInput) {
        fileInput.value = "";
    }

    if (attachBtn) {
        attachBtn.classList.remove("has-attachment");
        attachBtn.textContent = "＋";
    }
}

function addUserFileMessage(message, file) {
    if (IMAGE_TYPES.has(file.type)) {
        const wrapper = document.createElement("div");
        wrapper.className = "message user image-message";

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const image = document.createElement("img");
        image.className = "uploaded-image-preview";
        image.alt = file.name || "Uploaded image";

        const url = URL.createObjectURL(file);
        image.src = url;
        image.addEventListener(
            "load",
            () => URL.revokeObjectURL(url),
            { once: true }
        );

        bubble.appendChild(image);

        if (message) {
            const caption = document.createElement("div");
            caption.className = "image-message-caption";
            caption.textContent = message;
            bubble.appendChild(caption);
        }

        wrapper.appendChild(bubble);
        chat.appendChild(wrapper);
        scrollChat();
        return;
    }

    addMessage(
        `📎 ${file.name}\n\n${message}`,
        "user"
    );
}

if (attachBtn) {
    attachBtn.addEventListener(
        "click",
        () => fileInput?.click()
    );
}

if (fileInput) {
    fileInput.addEventListener(
        "change",
        () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            const allowed =
                IMAGE_TYPES.has(file.type) ||
                FILE_EXTENSIONS.has(fileExt(file.name));

            if (!allowed) {
                resetAttachment();
                alert("This file type is not supported yet.");
                return;
            }

            if (file.size > MAX_FILE_BYTES) {
                resetAttachment();
                alert("Please choose a file under 20 MB.");
                return;
            }

            selectedFile = file;
            attachBtn.classList.add("has-attachment");
            attachBtn.textContent = "✓";
            input.focus();
        }
    );
}


// ======================================================
// ACTION MODAL
// ======================================================

function closeActionModal() {

    if (!actionModal) {
        return;
    }

    actionModal.classList.remove(
        "show"
    );

    actionModal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (actionModalBody) {
        actionModalBody.innerHTML = "";
    }
}


function openActionModal(
    title,
    html
) {

    if (
        !actionModal ||
        !actionModalBody ||
        !actionModalTitle
    ) {
        return;
    }

    actionModalTitle.textContent =
        title;

    actionModalBody.innerHTML =
        html;

    actionModal.classList.add(
        "show"
    );

    actionModal.setAttribute(
        "aria-hidden",
        "false"
    );
}


if (actionModalClose) {

    actionModalClose.addEventListener(
        "click",
        closeActionModal
    );
}


if (actionModal) {

    actionModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                actionModal
            ) {

                closeActionModal();
            }
        }
    );
}


// ======================================================
// WORKSPACES
// ======================================================

const WORKSPACES = {

    general:
        "General",

    school:
        "School",

    coding:
        "Coding",

    business:
        "Business",

    safari:
        "Safari",

    agriculture:
        "Agriculture",

    health:
        "Health",

    bible:
        "Bible"

};


let currentWorkspace =
    localStorage.getItem(
        "AmanWorkspace"
    ) ||
    "general";


if (
    !WORKSPACES[
        currentWorkspace
    ]
) {

    currentWorkspace =
        "general";

}


function updateWorkspaceUI() {

    if (workspaceSelect) {

        workspaceSelect.value =
            currentWorkspace;

    }

    if (workspaceBadge) {

        workspaceBadge.textContent =
            WORKSPACES[
                currentWorkspace
            ] ||
            "General";

    }

}


function setWorkspace(
    workspace
) {

    if (
        !WORKSPACES[
            workspace
        ]
    ) {
        return;
    }

    currentWorkspace =
        workspace;

    localStorage.setItem(
        "AmanWorkspace",
        currentWorkspace
    );

    /*
    Switching workspace changes the active working mode,
    but must never hide or delete account chat history.
    */
    currentChatId = null;

    localStorage.removeItem(
        "AmanChat"
    );

    updateWorkspaceUI();

    showWelcome();

    loadChats();

    closeSidebar();

}


if (workspaceSelect) {

    workspaceSelect.addEventListener(
        "change",
        (event) => {

            setWorkspace(
                event.target.value
            );

        }
    );

}


updateWorkspaceUI();


// ======================================================
// WELCOME
// ======================================================

function showWelcome() {

    const workspaceName =
        WORKSPACES[
            currentWorkspace
        ] ||
        "General";

    chat.innerHTML = `

        <div class="empty-chat">

            <div class="welcome-mark">
                A
            </div>

            <h1>
                ${workspaceName}
                Workspace
            </h1>

            <p>
                Ask Aman AI anything related to this workspace.
                Your account, chats and memory remain connected.
            </p>

            <div class="quick-prompts">

                <button
                    type="button"
                    data-prompt="Help me start something useful in this workspace."
                >
                    Start something
                </button>

                <button
                    type="button"
                    data-prompt="Explain the most important thing I should focus on here."
                >
                    What should I focus on?
                </button>

                <button
                    type="button"
                    data-prompt="Give me a practical plan for my next task."
                >
                    Make a plan
                </button>

            </div>

        </div>

    `;

    chat
        .querySelectorAll(
            "[data-prompt]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        input.value =
                            button.dataset
                                .prompt ||
                            "";

                        input.focus();

                    }
                );

            }
        );

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
    role,
    messageId = null
) {

    const wrapper =
    document.createElement(
        "div"
    );


    wrapper.className =
    "message " + role;

    if (messageId) {

        wrapper.dataset.messageId =
            String(messageId);
    }


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
            content,
            messageId
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

    let message =
        input.value.trim();

    if (
        !message &&
        !selectedFile
    ) {
        return;
    }

    const uploadFile =
        selectedFile;

    if (
        uploadFile &&
        !message
    ) {
        message =
            IMAGE_TYPES.has(uploadFile.type)
                ? "Analyze this image."
                : "Analyze this uploaded file.";
    }

    input.value =
        "";

    input.style.height =
        "auto";

    resetAttachment();

    await sendMessageWithText(
        message,
        true,
        uploadFile
    );
}


async function sendMessageWithText(
    message,
    showUserMessage = true,
    uploadFile = null
) {

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


    if (showUserMessage) {

        if (uploadFile) {

            addUserFileMessage(
                message,
                uploadFile
            );

        } else {

            addMessage(
                message,
                "user"
            );
        }
    }


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

            workspace:
                currentWorkspace

        };


        if (
            isValidChatId(
                currentChatId
            )
        ) {

            requestBody.chatId =
                currentChatId;
        }


        let fetchOptions;


        if (uploadFile) {

            const formData =
                new FormData();

            formData.append(
                "message",
                message
            );

            formData.append(
                "workspace",
                currentWorkspace
            );

            if (
                requestBody.chatId
            ) {

                formData.append(
                    "chatId",
                    requestBody.chatId
                );
            }

            formData.append(
                "file",
                uploadFile,
                uploadFile.name
            );

            fetchOptions = {
                method:
                    "POST",

                credentials:
                    "same-origin",

                body:
                    formData
            };

        } else {

            fetchOptions = {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials:
                    "same-origin",

                body:
                    JSON.stringify(
                        requestBody
                    )
            };
        }


        console.log(
            "SENDING:",
            {
                ...requestBody,
                hasImage:
                    Boolean(
                        uploadFile
                    )
            }
        );


        const res =
            await fetch(
                API,
                fetchOptions
            );


        const data =
        await res.json()
            .catch(
                () => ({})
            );


        loading.remove();


        if (
            res.status === 401
        ) {

            location.replace(
                "/login"
            );

            return;
        }


        /*
        ==================================================
        STALE CHAT RECOVERY

        If a browser still has a chat pointer that the
        signed-in account cannot use, clear ONLY that
        local pointer and retry this message once.

        The old database chat remains untouched.
        ==================================================
        */

        if (
            !res.ok &&
            isValidChatId(
                currentChatId
            )
        ) {

            console.warn(
                "Chat unavailable for current account. Retrying in a fresh chat."
            );

            currentChatId =
            null;

            localStorage.removeItem(
                "AmanChat"
            );

            return sendMessageWithText(
                message,
                false,
                uploadFile
            );
        }


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
            "ai",
            data.assistantMessageId
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
// ADVANCED RESPONSE ACTIONS
// ======================================================

function readAloud(
    text
) {

    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Read aloud is not supported by this browser."
        );

        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.rate =
        1;

    window.speechSynthesis.speak(
        utterance
    );
}


async function rateResponse(
    messageId,
    rating,
    button
) {

    if (
        !messageId ||
        !currentChatId
    ) {
        return;
    }

    try {

        const res =
            await fetch(
                `${API}/${currentChatId}/feedback`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "same-origin",

                    body:
                        JSON.stringify({
                            messageId,
                            rating
                        })
                }
            );

        if (
            res.status === 401
        ) {

            location.replace(
                "/login"
            );

            return;
        }

        if (!res.ok) {

            throw new Error(
                "Could not save feedback."
            );
        }

        button.classList.add(
            "selected"
        );

    } catch (error) {

        console.error(
            "FEEDBACK ERROR:",
            error
        );
    }
}


async function branchFromMessage(
    messageId
) {

    if (
        !messageId ||
        !currentChatId
    ) {
        return;
    }

    try {

        const res =
            await fetch(
                `${API}/${currentChatId}/branch`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "same-origin",

                    body:
                        JSON.stringify({
                            messageId
                        })
                }
            );

        const data =
            await res
                .json()
                .catch(
                    () => ({})
                );

        if (!res.ok) {

            throw new Error(
                data.message ||
                "Could not create branch."
            );
        }

        currentChatId =
            data.chatId;

        localStorage.setItem(
            "AmanChat",
            currentChatId
        );

        await loadCurrentChat();

        await loadChats();

        closeSidebar();

    } catch (error) {

        console.error(
            "BRANCH ERROR:",
            error
        );
    }
}


async function regenerateLastResponse() {

    if (!currentChatId) {
        return;
    }

    const loading =
        createLoading();

    try {

        const res =
            await fetch(
                `${API}/${currentChatId}/regenerate`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "same-origin",

                    body:
                        JSON.stringify({
                            workspace:
                                currentWorkspace
                        })
                }
            );

        const data =
            await res
                .json()
                .catch(
                    () => ({})
                );

        loading.remove();

        if (
            res.status === 401
        ) {

            location.replace(
                "/login"
            );

            return;
        }

        if (!res.ok) {

            throw new Error(
                data.message ||
                data.reply ||
                "Could not regenerate."
            );
        }

        await loadCurrentChat();

        await loadChats();

    } catch (error) {

        loading.remove();

        console.error(
            "REGENERATE ERROR:",
            error
        );
    }
}


function addMessageActions(
    messageBox,
    text,
    messageId
) {

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "message-actions";

    actions.innerHTML = `
        <button
            type="button"
            title="Copy"
            aria-label="Copy response"
        >
            📋
        </button>

        <button
            type="button"
            title="Helpful"
            aria-label="Helpful"
        >
            👍
        </button>

        <button
            type="button"
            title="Not helpful"
            aria-label="Not helpful"
        >
            👎
        </button>

        <button
            type="button"
            title="Read aloud"
            aria-label="Read aloud"
        >
            🔊
        </button>

        <button
            type="button"
            title="Regenerate"
            aria-label="Regenerate response"
        >
            ↻
        </button>

        <button
            type="button"
            title="Branch"
            aria-label="Branch from here"
        >
            🌿
        </button>

        <button
            type="button"
            title="Share"
            aria-label="Share response"
        >
            ↗
        </button>
    `;

    const buttons =
        actions.querySelectorAll(
            "button"
        );

    buttons[0].onclick =
        async () => {

            await navigator.clipboard
                .writeText(
                    text
                );

            buttons[0].textContent =
                "✅";

            setTimeout(
                () => {
                    buttons[0].textContent =
                        "📋";
                },
                1200
            );
        };


    buttons[1].onclick =
        () =>
            rateResponse(
                messageId,
                1,
                buttons[1]
            );


    buttons[2].onclick =
        () =>
            rateResponse(
                messageId,
                -1,
                buttons[2]
            );


    buttons[3].onclick =
        () =>
            readAloud(
                text
            );


    buttons[4].onclick =
        regenerateLastResponse;


    buttons[5].onclick =
        () =>
            branchFromMessage(
                messageId
            );


    buttons[6].onclick =
        async () => {

            if (
                navigator.share
            ) {

                await navigator.share({
                    text
                });

            } else {

                await navigator.clipboard
                    .writeText(
                        text
                    );
            }
        };


    messageBox.appendChild(
        actions
    );
}


// ======================================================
// CHAT MANAGEMENT
// ======================================================

async function updateChat(
    chatId,
    changes
) {

    const res =
        await fetch(
            `${API}/${chatId}`,
            {
                method:
                    "PATCH",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials:
                    "same-origin",

                body:
                    JSON.stringify(
                        changes
                    )
            }
        );

    const data =
        await res
            .json()
            .catch(
                () => ({})
            );

    if (!res.ok) {

        throw new Error(
            data.message ||
            "Could not update chat."
        );
    }

    return data.chat;
}


function openChatMenu(
    item
) {

    const pinned =
        Boolean(
            item.is_pinned
        );

    const archived =
        Boolean(
            item.is_archived
        );

    openActionModal(
        "Chat options",
        `
        <div class="chat-action-stack">

            <button
                id="renameChatAction"
                type="button"
            >
                ✏ Rename
            </button>

            <button
                id="pinChatAction"
                type="button"
            >
                ${pinned
                    ? "📌 Unpin"
                    : "📌 Pin"}
            </button>

            <button
                id="moveChatAction"
                type="button"
            >
                🗂 Move workspace
            </button>

            <button
                id="archiveChatAction"
                type="button"
            >
                ${archived
                    ? "📥 Unarchive"
                    : "📦 Archive"}
            </button>

            <button
                id="shareChatAction"
                type="button"
            >
                ↗ Share chat
            </button>

            <button
                id="deleteChatAction"
                class="danger-action"
                type="button"
            >
                🗑 Delete
            </button>

        </div>
        `
    );


    document
        .getElementById(
            "renameChatAction"
        )
        ?.addEventListener(
            "click",
            () => {

                openActionModal(
                    "Rename chat",
                    `
                    <form
                        id="renameChatForm"
                        class="modal-form"
                    >
                        <input
                            id="renameChatInput"
                            maxlength="100"
                            value="${String(
                                item.title ||
                                ""
                            )
                            .replace(/&/g,"&amp;")
                            .replace(/"/g,"&quot;")
                            .replace(/</g,"&lt;")
                            .replace(/>/g,"&gt;")}"
                            required
                        >

                        <button
                            type="submit"
                        >
                            Save name
                        </button>
                    </form>
                    `
                );

                document
                    .getElementById(
                        "renameChatForm"
                    )
                    ?.addEventListener(
                        "submit",
                        async event => {

                            event.preventDefault();

                            const title =
                                document
                                    .getElementById(
                                        "renameChatInput"
                                    )
                                    .value
                                    .trim();

                            if (!title) {
                                return;
                            }

                            await updateChat(
                                item.chat_id,
                                {
                                    title
                                }
                            );

                            closeActionModal();

                            await loadChats();
                        }
                    );
            }
        );


    document
        .getElementById(
            "pinChatAction"
        )
        ?.addEventListener(
            "click",
            async () => {

                await updateChat(
                    item.chat_id,
                    {
                        isPinned:
                            !pinned
                    }
                );

                closeActionModal();

                await loadChats();
            }
        );


    document
        .getElementById(
            "moveChatAction"
        )
        ?.addEventListener(
            "click",
            () => {

                openActionModal(
                    "Move workspace",
                    `
                    <div class="modal-form">

                        <select
                            id="moveWorkspaceSelect"
                        >
                            ${
                                Object.entries(
                                    WORKSPACES
                                )
                                .map(
                                    ([id,name]) =>
                                        `<option value="${id}" ${
                                            item.workspace === id
                                                ? "selected"
                                                : ""
                                        }>${name}</option>`
                                )
                                .join("")
                            }
                        </select>

                        <button
                            id="moveWorkspaceSave"
                            type="button"
                        >
                            Move chat
                        </button>

                    </div>
                    `
                );

                document
                    .getElementById(
                        "moveWorkspaceSave"
                    )
                    ?.addEventListener(
                        "click",
                        async () => {

                            const workspace =
                                document
                                    .getElementById(
                                        "moveWorkspaceSelect"
                                    )
                                    .value;

                            await updateChat(
                                item.chat_id,
                                {
                                    workspace
                                }
                            );

                            closeActionModal();

                            await loadChats();
                        }
                    );
            }
        );


    document
        .getElementById(
            "archiveChatAction"
        )
        ?.addEventListener(
            "click",
            async () => {

                await updateChat(
                    item.chat_id,
                    {
                        isArchived:
                            !archived
                    }
                );

                closeActionModal();

                await loadChats();
            }
        );


    document
        .getElementById(
            "shareChatAction"
        )
        ?.addEventListener(
            "click",
            async () => {

                const shareText =
                    `${item.title || "Aman AI chat"} — Aman AI`;

                if (
                    navigator.share
                ) {

                    await navigator.share({
                        title:
                            item.title ||
                            "Aman AI chat",
                        text:
                            shareText
                    });

                } else {

                    await navigator.clipboard
                        .writeText(
                            shareText
                        );
                }

                closeActionModal();
            }
        );


    document
        .getElementById(
            "deleteChatAction"
        )
        ?.addEventListener(
            "click",
            async () => {

                await fetch(
                    `${API}/${item.chat_id}`,
                    {
                        method:
                            "DELETE",

                        credentials:
                            "same-origin"
                    }
                );

                if (
                    currentChatId ===
                    item.chat_id
                ) {

                    currentChatId =
                        null;

                    localStorage.removeItem(
                        "AmanChat"
                    );

                    showWelcome();
                }

                closeActionModal();

                await loadChats();
            }
        );
}


function createChatListItem(
    item
) {

    const id =
        item.chat_id;

    if (
        !isValidChatId(
            id
        )
    ) {

        return null;
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "chat-item";

    if (
        item.is_archived
    ) {

        row.classList.add(
            "archived"
        );
    }

    const main =
        document.createElement(
            "button"
        );

    main.type =
        "button";

    main.className =
        "chat-item-main";

    main.innerHTML =
        `
        <span class="chat-item-title">
            ${
                item.is_pinned
                    ? "📌 "
                    : "💬 "
            }${item.title || "New Chat"}
        </span>

        <span class="chat-item-workspace">
            ${WORKSPACES[item.workspace] || "General"}
        </span>
        `;

    main.addEventListener(
        "click",
        () => {

            currentChatId =
                id;

            localStorage.setItem(
                "AmanChat",
                id
            );

            /*
            Opening an older chat restores that chat's
            own workspace in the UI.
            */
            const chatWorkspace =
                WORKSPACES[
                    item.workspace
                ]
                    ? item.workspace
                    : "general";

            currentWorkspace =
                chatWorkspace;

            localStorage.setItem(
                "AmanWorkspace",
                currentWorkspace
            );

            updateWorkspaceUI();

            loadCurrentChat();

            closeSidebar();
        }
    );

    const menu =
        document.createElement(
            "button"
        );

    menu.type =
        "button";

    menu.className =
        "chat-item-menu";

    menu.textContent =
        "⋯";

    menu.setAttribute(
        "aria-label",
        "Chat options"
    );

    menu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            openChatMenu(
                item
            );
        }
    );

    row.append(
        main,
        menu
    );

    return row;
}


// ======================================================
// LOAD CHATS
// ======================================================

async function loadChats() {

    try {

        /*
        Sidebar chat history is ACCOUNT-WIDE.

        Do not filter it by workspace.
        Each chat already displays its own workspace label,
        so the user can always find old conversations.
        */
        const res =
            await fetch(
                `${API}/chats`,
                {
                    credentials:
                        "same-origin"
                }
            );

        if (
            res.status === 401
        ) {

            location.replace(
                "/login"
            );

            return;
        }

        if (!res.ok) {

            throw new Error(
                "Failed to load chats"
            );
        }

        const chats =
            await res.json();

        chatList.innerHTML =
            "";

        if (
            !Array.isArray(
                chats
            )
        ) {

            return;
        }

        if (
            chats.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "chat-list-empty";

            empty.textContent =
                "No chats yet.";

            chatList.appendChild(
                empty
            );

            return;
        }

        chats.forEach(
            item => {

                const row =
                    createChatListItem(
                        item
                    );

                if (row) {

                    chatList.appendChild(
                        row
                    );
                }
            }
        );

    } catch (error) {

        console.error(
            "LOAD CHATS ERROR:",
            error
        );

        if (chatList) {

            chatList.innerHTML =
                "";

            const failed =
                document.createElement(
                    "div"
                );

            failed.className =
                "chat-list-empty";

            failed.textContent =
                "Could not load chats.";

            chatList.appendChild(
                failed
            );
        }
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
            `${API}/${currentChatId}`,
            {
                credentials:
                "same-origin"
            }
        );


        if (!res.ok) {

            /*
            ==============================================
            STALE / FOREIGN LOCAL CHAT POINTER

            The database chat is NOT deleted.

            We only remove this browser's AmanChat value
            so the signed-in account cannot accidentally
            reuse a chat owned by another account.
            ==============================================
            */

            console.warn(
                "Stored chat is unavailable for this account. Clearing local pointer."
            );

            currentChatId =
            null;

            localStorage.removeItem(
                "AmanChat"
            );

            showWelcome();

            await loadChats();

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

                let content =
                    msg.content;

                if (
                    msg.role === "user" &&
                    msg.has_image
                ) {
                    content = `📷 ${msg.content}`;
                } else if (
                    msg.role === "user" &&
                    msg.has_file
                ) {
                    content =
                        `📎 ${msg.file_name || "Uploaded file"}\n\n${msg.content}`;
                }


                addMessage(

                    content,

                    msg.role === "user"
                    ? "user"
                    : "ai",

                    msg.id

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

                credentials:
                "same-origin",

                body:
                JSON.stringify({
                    workspace:
                        currentWorkspace
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
            `${API}/${currentChatId}`,
            {

                method: "DELETE",

                credentials:
                "same-origin"

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

async function startApplication() {

    const authenticated =
    await loadAuthenticatedAccount();

    if (!authenticated) {
        return;
    }

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

}

startApplication();


// ======================================================
// END
// ======================================================
