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
const liveVoiceBtn = document.getElementById("liveVoiceBtn");
const liveVoicePanel = document.getElementById("liveVoicePanel");
const liveVoiceTitle = document.getElementById("liveVoiceTitle");
const liveVoiceStatus = document.getElementById("liveVoiceStatus");
const liveVoiceHint = document.getElementById("liveVoiceHint");
const endLiveVoiceBtn = document.getElementById("endLiveVoiceBtn");


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

const creatorBtn =
document.getElementById("creatorBtn");

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
// CREATOR MODE
// ======================================================

const CREATOR_POLL_MS =
    3500;

const CREATOR_MAX_POLLS =
    240;


function escapeHtml(
    value
) {

    return String(
        value || ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function sleep(
    ms
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


function renderCreatorResult({
    mediaType,
    url,
    prompt
}) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message ai creator-message";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble creator-result";


    const safeUrl =
        escapeHtml(
            url
        );

    const safePrompt =
        escapeHtml(
            prompt
        );


    if (
        mediaType ===
        "video"
    ) {

        bubble.innerHTML = `
            <div class="creator-result-head">
                <span>🎬 Created video</span>
            </div>

            <video
                class="creator-media creator-video"
                controls
                playsinline
                preload="metadata"
                src="${safeUrl}"
            ></video>

            <div class="creator-caption">
                ${safePrompt}
            </div>

            <a
                class="creator-open-link"
                href="${safeUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Open video
            </a>
        `;

    } else {

        bubble.innerHTML = `
            <div class="creator-result-head">
                <span>🎨 Created image</span>
            </div>

            <img
                class="creator-media creator-image"
                src="${safeUrl}"
                alt="${safePrompt}"
                loading="lazy"
            >

            <div class="creator-caption">
                ${safePrompt}
            </div>

            <a
                class="creator-open-link"
                href="${safeUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Open image
            </a>
        `;
    }


    wrapper.appendChild(
        bubble
    );

    chat.appendChild(
        wrapper
    );

    scrollChat();
}


function renderCreatorProgress(
    mediaType
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message ai creator-progress-message";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "bubble creator-progress";


    bubble.innerHTML = `
        <div class="creator-progress-line">
            <span class="creator-spinner"></span>
            <span>
                ${
                    mediaType === "video"
                        ? "Creating video…"
                        : "Creating image…"
                }
            </span>
        </div>

        <div class="creator-progress-sub">
            You can keep Aman AI open while generation continues.
        </div>
    `;


    wrapper.appendChild(
        bubble
    );

    chat.appendChild(
        wrapper
    );

    scrollChat();

    return {
        wrapper,
        bubble
    };
}


async function pollCreatorJob({
    requestId,
    mediaType,
    prompt,
    progress
}) {

    for (
        let attempt = 0;
        attempt < CREATOR_MAX_POLLS;
        attempt++
    ) {

        await sleep(
            CREATOR_POLL_MS
        );


        const res =
            await fetch(
                `${API}/creator/${encodeURIComponent(requestId)}/status`,
                {
                    credentials:
                        "same-origin"
                }
            );


        const data =
            await res.json()
                .catch(
                    () => ({})
                );


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Creator Mode status check failed."
            );
        }


        if (
            data.status ===
            "COMPLETED"
        ) {

            progress.wrapper.remove();

            renderCreatorResult({
                mediaType,
                url:
                    data.url,
                prompt
            });

            return;
        }


        if (
            data.status ===
            "FAILED"
        ) {

            throw new Error(
                data.message ||
                "Media generation failed."
            );
        }


        const queueText =
            data.status ===
            "IN_QUEUE"
                ? (
                    data.queuePosition !==
                    null &&
                    data.queuePosition !==
                    undefined
                        ? `Queued • position ${data.queuePosition}`
                        : "Queued…"
                )
                : "Generating…";


        progress.bubble.innerHTML = `
            <div class="creator-progress-line">
                <span class="creator-spinner"></span>
                <span>
                    ${
                        mediaType === "video"
                            ? "Creating video…"
                            : "Creating image…"
                    }
                </span>
            </div>

            <div class="creator-progress-sub">
                ${escapeHtml(queueText)}
            </div>
        `;
    }


    throw new Error(
        "Generation is taking longer than expected. Try checking again shortly."
    );
}


async function startCreatorGeneration({
    mediaType,
    prompt,
    imageSize,
    duration,
    aspectRatio,
    generateAudio
}) {

    const cleanPrompt =
        String(
            prompt || ""
        ).trim();


    if (!cleanPrompt) {

        alert(
            "Describe what you want Aman AI to create."
        );

        return;
    }


    /*
    Show the user's request in the conversation.
    */
    addMessage(
        `${
            mediaType === "video"
                ? "🎬"
                : "🎨"
        } ${cleanPrompt}`,
        "user"
    );


    const progress =
        renderCreatorProgress(
            mediaType
        );


    try {

        const res =
            await fetch(
                `${API}/creator/${mediaType}`,
                {
                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            prompt:
                                cleanPrompt,

                            imageSize,

                            duration,

                            aspectRatio,

                            generateAudio
                        })
                }
            );


        const data =
            await res.json()
                .catch(
                    () => ({})
                );


        if (!res.ok) {

            throw new Error(
                data.message ||
                "Creator Mode could not start."
            );
        }


        await pollCreatorJob({
            requestId:
                data.requestId,
            mediaType,
            prompt:
                cleanPrompt,
            progress
        });


    } catch (error) {

        progress.wrapper.remove();

        addMessage(
            `⚠️ ${
                error.message ||
                "Creator Mode failed."
            }`,
            "ai"
        );

        console.error(
            "CREATOR MODE ERROR:",
            error
        );
    }
}


function openCreatorMode() {

    openActionModal(
        "Creator Mode",
        `
        <div class="creator-panel">

            <div class="creator-tabs">
                <button
                    type="button"
                    class="creator-tab active"
                    data-creator-mode="image"
                >
                    🎨 Image
                </button>

                <button
                    type="button"
                    class="creator-tab"
                    data-creator-mode="video"
                >
                    🎬 Video
                </button>
            </div>

            <label class="creator-label">
                Describe what to create
            </label>

            <textarea
                id="creatorPrompt"
                class="creator-prompt"
                rows="5"
                maxlength="4000"
                placeholder="Example: A cinematic Tanzania safari poster at golden hour..."
            ></textarea>

            <div
                id="creatorImageOptions"
                class="creator-options"
            >
                <label>
                    Image shape

                    <select
                        id="creatorImageSize"
                    >
                        <option value="landscape_4_3">
                            Landscape
                        </option>

                        <option value="landscape_16_9">
                            Wide 16:9
                        </option>

                        <option value="square_hd">
                            Square HD
                        </option>

                        <option value="portrait_4_3">
                            Portrait
                        </option>

                        <option value="portrait_16_9">
                            Tall 9:16
                        </option>
                    </select>
                </label>
            </div>

            <div
                id="creatorVideoOptions"
                class="creator-options"
                hidden
            >
                <label>
                    Duration

                    <select
                        id="creatorDuration"
                    >
                        <option value="5">
                            5 seconds
                        </option>

                        <option value="8">
                            8 seconds
                        </option>

                        <option value="10">
                            10 seconds
                        </option>
                    </select>
                </label>

                <label>
                    Video shape

                    <select
                        id="creatorAspectRatio"
                    >
                        <option value="16:9">
                            Landscape 16:9
                        </option>

                        <option value="9:16">
                            Vertical 9:16
                        </option>

                        <option value="1:1">
                            Square
                        </option>
                    </select>
                </label>

                <label class="creator-check">
                    <input
                        id="creatorAudio"
                        type="checkbox"
                    >
                    Generate audio
                </label>
            </div>

            <button
                id="creatorGenerateBtn"
                class="modal-primary-btn creator-generate-btn"
                type="button"
            >
                ✦ Create
            </button>

        </div>
        `
    );


    let mode =
        "image";


    const tabs =
        actionModalBody
            ?.querySelectorAll(
                "[data-creator-mode]"
            ) ||
        [];


    const imageOptions =
        document.getElementById(
            "creatorImageOptions"
        );

    const videoOptions =
        document.getElementById(
            "creatorVideoOptions"
        );


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    mode =
                        tab.dataset
                            .creatorMode;


                    tabs.forEach(
                        item =>
                            item.classList
                                .toggle(
                                    "active",
                                    item === tab
                                )
                    );


                    if (imageOptions) {

                        imageOptions.hidden =
                            mode !==
                            "image";
                    }


                    if (videoOptions) {

                        videoOptions.hidden =
                            mode !==
                            "video";
                    }
                }
            );
        }
    );


    document
        .getElementById(
            "creatorGenerateBtn"
        )
        ?.addEventListener(
            "click",
            async () => {

                const prompt =
                    document
                        .getElementById(
                            "creatorPrompt"
                        )
                        ?.value ||
                    "";


                const payload = {

                    mediaType:
                        mode,

                    prompt,

                    imageSize:
                        document
                            .getElementById(
                                "creatorImageSize"
                            )
                            ?.value ||
                        "landscape_4_3",

                    duration:
                        document
                            .getElementById(
                                "creatorDuration"
                            )
                            ?.value ||
                        "5",

                    aspectRatio:
                        document
                            .getElementById(
                                "creatorAspectRatio"
                            )
                            ?.value ||
                        "16:9",

                    generateAudio:
                        Boolean(
                            document
                                .getElementById(
                                    "creatorAudio"
                                )
                                ?.checked
                        )
                };


                closeActionModal();


                await startCreatorGeneration(
                    payload
                );
            }
        );
}


if (creatorBtn) {

    creatorBtn.addEventListener(
        "click",
        openCreatorMode
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


let creatingChatPromise = null;

async function ensureCurrentChatId() {

    if (
        isValidChatId(
            currentChatId
        )
    ) {
        return currentChatId;
    }

    if (creatingChatPromise) {
        return creatingChatPromise;
    }

    creatingChatPromise =
        (async () => {

            const res =
                await fetch(
                    `${API}/new-chat`,
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
                await res.json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                !isValidChatId(
                    data.chatId
                )
            ) {
                throw new Error(
                    data.message ||
                    "Could not create a chat."
                );
            }

            currentChatId =
                data.chatId;

            localStorage.setItem(
                "AmanChat",
                currentChatId
            );

            return currentChatId;
        })();

    try {
        return await creatingChatPromise;
    }
    finally {
        creatingChatPromise = null;
    }
}


async function sendMessageWithText(
    message,
    showUserMessage = true,
    uploadFile = null,
    options = {}
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
        CHAT ID GUARANTEE

        Create/reuse one real database chat BEFORE
        sending the message.

        This prevents duplicate first-message chats
        and prevents CHAT ID: undefined.
        ==================================================
        */

        await ensureCurrentChatId();

        const requestBody = {

            message,

            workspace:
                currentWorkspace

        };


        requestBody.chatId =
            currentChatId;


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
                uploadFile,
                options
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


        const finalReply =
            data.reply ||
            "No response.";

        await typeAI(
            bubble,
            finalReply
        );

        if (
            options.liveVoice &&
            liveVoiceMode
        ) {
            await speakLiveReply(
                finalReply
            );
        }

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

let activeSpeechButton = null;
let activeSpeechUtterance = null;

const SPEECH_LOCALES = {
    en: "en-US",
    sw: "sw-TZ",
    fr: "fr-FR",
    es: "es-ES",
    pt: "pt-BR",
    de: "de-DE",
    ar: "ar-SA",
    hi: "hi-IN",
    zh: "zh-CN",
    ja: "ja-JP"
};

function getPreferredSpeechLocale() {
    const language =
        uiPreferences?.language ||
        document.documentElement.lang ||
        "en";

    return (
        SPEECH_LOCALES[language] ||
        "en-US"
    );
}

function cleanSpeechText(text) {
    return String(text || "")
        .replace(/```[\s\S]*?```/g, " code block ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/#{1,6}\s*/g, "")
        .replace(/[*_~>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function chooseSpeechVoice(locale) {
    if (!("speechSynthesis" in window)) {
        return null;
    }

    const voices =
        window.speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }

    const exact =
        voices.find(
            voice =>
                voice.lang
                    ?.toLowerCase() ===
                locale.toLowerCase()
        );

    if (exact) {
        return exact;
    }

    const base =
        locale
            .split("-")[0]
            .toLowerCase();

    return (
        voices.find(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    .startsWith(base)
        ) ||
        null
    );
}

function stopReadAloud() {
    if (
        "speechSynthesis" in window
    ) {
        window.speechSynthesis.cancel();
    }

    if (activeSpeechButton) {
        activeSpeechButton.textContent =
            "🔊";

        activeSpeechButton.classList.remove(
            "speaking"
        );
    }

    activeSpeechButton =
        null;

    activeSpeechUtterance =
        null;
}

function readAloud(
    text,
    button = null
) {

    if (
        !("speechSynthesis" in window)
    ) {

        alert(
            "Read aloud is not supported by this browser."
        );

        return;
    }

    if (
        activeSpeechButton === button &&
        window.speechSynthesis.speaking
    ) {
        stopReadAloud();
        return;
    }

    stopReadAloud();

    const spokenText =
        cleanSpeechText(text);

    if (!spokenText) {
        return;
    }

    const locale =
        getPreferredSpeechLocale();

    const utterance =
        new SpeechSynthesisUtterance(
            spokenText
        );

    utterance.lang =
        locale;

    utterance.rate =
        1;

    utterance.pitch =
        1;

    utterance.volume =
        1;

    const voice =
        chooseSpeechVoice(
            locale
        );

    if (voice) {
        utterance.voice =
            voice;
    }

    activeSpeechButton =
        button;

    activeSpeechUtterance =
        utterance;

    if (button) {
        button.textContent =
            "⏹";

        button.classList.add(
            "speaking"
        );
    }

    utterance.onend =
    utterance.onerror =
        () => {
            if (
                activeSpeechUtterance ===
                utterance
            ) {
                stopReadAloud();
            }
        };

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



const READ_ALOUD_LABELS = {"en": "Read aloud", "sw": "Soma kwa sauti", "zh": "朗读", "fr": "Lire à voix haute", "es": "Leer en voz alta", "pt": "Ler em voz alta", "de": "Vorlesen", "ar": "قراءة بصوت عالٍ", "hi": "ज़ोर से पढ़ें", "ja": "読み上げ"};

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

    const readLabel =
        READ_ALOUD_LABELS[
            uiPreferences?.language ||
            "en"
        ] ||
        READ_ALOUD_LABELS.en;

    buttons[3].setAttribute(
        "title",
        readLabel
    );

    buttons[3].setAttribute(
        "aria-label",
        readLabel
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
                text,
                buttons[3]
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

    if (creatingChatPromise) {

        try {
            await creatingChatPromise;
        }
        catch {}
    }

    currentChatId =
        null;

    localStorage.removeItem(
        "AmanChat"
    );

    try {

        const id =
            await ensureCurrentChatId();

        showWelcome();

        loadChats();

        closeSidebar();

        console.log(
            "NEW CHAT:",
            id
        );

        return id;
    }
    catch (err) {

        console.error(
            "CREATE CHAT ERROR:",
            err
        );

        return null;
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
// LIVE VOICE CONVERSATION MODE v11
// Mobile-safe: MediaRecorder -> Groq Whisper -> Aman AI
// -> speechSynthesis. Does NOT depend on webkitSpeechRecognition.
// ======================================================

const LIVE_VOICE_COPY = {
    en:{title:"Live Voice",ready:"Ready",listening:"Listening…",thinking:"Thinking…",speaking:"Speaking…",hint:"Speak naturally. Pause when you finish and Aman AI will answer.",end:"End voice chat",tooltip:"Live Voice"},
    sw:{title:"Mazungumzo ya Sauti",ready:"Tayari",listening:"Ninasikiliza…",thinking:"Nafikiria…",speaking:"Ninazungumza…",hint:"Ongea kawaida. Ukimaliza, nyamaza kidogo na Aman AI itajibu.",end:"Maliza mazungumzo",tooltip:"Mazungumzo ya Sauti"},
    zh:{title:"实时语音",ready:"准备就绪",listening:"正在聆听…",thinking:"正在思考…",speaking:"正在说话…",hint:"自然说话即可。说完后停顿一下，Aman AI 会回答。",end:"结束语音聊天",tooltip:"实时语音"},
    fr:{title:"Voix en direct",ready:"Prêt",listening:"Écoute…",thinking:"Réflexion…",speaking:"Parle…",hint:"Parlez naturellement. Faites une courte pause quand vous avez terminé.",end:"Terminer le chat vocal",tooltip:"Voix en direct"},
    es:{title:"Voz en vivo",ready:"Listo",listening:"Escuchando…",thinking:"Pensando…",speaking:"Hablando…",hint:"Habla con naturalidad. Haz una pausa al terminar y Aman AI responderá.",end:"Finalizar chat de voz",tooltip:"Voz en vivo"},
    pt:{title:"Voz ao vivo",ready:"Pronto",listening:"Ouvindo…",thinking:"Pensando…",speaking:"Falando…",hint:"Fale naturalmente. Faça uma pausa ao terminar e Aman AI responderá.",end:"Encerrar conversa por voz",tooltip:"Voz ao vivo"},
    de:{title:"Live-Sprache",ready:"Bereit",listening:"Hört zu…",thinking:"Denkt nach…",speaking:"Spricht…",hint:"Sprich normal. Mach am Ende eine kurze Pause, dann antwortet Aman AI.",end:"Sprachchat beenden",tooltip:"Live-Sprache"},
    ar:{title:"المحادثة الصوتية المباشرة",ready:"جاهز",listening:"أستمع…",thinking:"أفكر…",speaking:"أتحدث…",hint:"تحدث بشكل طبيعي، ثم توقف قليلًا عندما تنتهي.",end:"إنهاء المحادثة الصوتية",tooltip:"المحادثة الصوتية المباشرة"},
    hi:{title:"लाइव वॉइस",ready:"तैयार",listening:"सुन रहा है…",thinking:"सोच रहा है…",speaking:"बोल रहा है…",hint:"स्वाभाविक रूप से बोलें। पूरा होने पर थोड़ी देर रुकें।",end:"वॉइस चैट समाप्त करें",tooltip:"लाइव वॉइस"},
    ja:{title:"ライブ音声",ready:"準備完了",listening:"聞いています…",thinking:"考えています…",speaking:"話しています…",hint:"自然に話してください。話し終えたら少し間を置いてください。",end:"音声チャットを終了",tooltip:"ライブ音声"}
};

let liveVoiceMode = false;
let liveVoiceBusy = false;
let liveVoiceTimer = null;

let liveMediaStream = null;
let liveMediaRecorder = null;
let liveAudioContext = null;
let liveAnalyser = null;
let liveSourceNode = null;
let liveMeterFrame = null;
let liveChunks = [];
let liveSpeechHeard = false;
let liveLastVoiceAt = 0;
let liveTurnStartedAt = 0;
let liveCancelCurrentTurn = false;

function liveVoiceCopy(){
    const l =
        uiPreferences?.language ||
        document.documentElement.lang ||
        "en";

    return LIVE_VOICE_COPY[l] ||
        LIVE_VOICE_COPY.en;
}

function setLiveVoiceState(state){
    const c = liveVoiceCopy();

    if (!liveVoicePanel) return;

    liveVoicePanel.dataset.state = state;
    liveVoiceTitle.textContent = c.title;
    liveVoiceHint.textContent = c.hint;
    endLiveVoiceBtn.textContent = c.end;
    liveVoiceStatus.textContent =
        c[state] || c.ready;

    liveVoiceBtn.dataset.tooltip = c.tooltip;
    liveVoiceBtn.title = c.tooltip;
    liveVoiceBtn.setAttribute(
        "aria-label",
        c.tooltip
    );
}

function openLiveVoice(){
    liveVoicePanel?.classList.add("open");
    liveVoicePanel?.setAttribute(
        "aria-hidden",
        "false"
    );
    document.body.classList.add(
        "live-voice-open"
    );
}

function closeLiveVoice(){
    liveVoicePanel?.classList.remove("open");
    liveVoicePanel?.setAttribute(
        "aria-hidden",
        "true"
    );
    document.body.classList.remove(
        "live-voice-open"
    );
}

function supportedRecordingMime(){
    const choices = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4"
    ];

    for (const type of choices) {
        if (
            window.MediaRecorder &&
            MediaRecorder.isTypeSupported(type)
        ) {
            return type;
        }
    }

    return "";
}

function blobToBase64(blob){
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onloadend =
                () => {
                    const value =
                        String(
                            reader.result || ""
                        );

                    resolve(
                        value.includes(",")
                            ? value.split(",")[1]
                            : value
                    );
                };

            reader.onerror =
                () =>
                    reject(
                        new Error(
                            "Could not read voice recording."
                        )
                    );

            reader.readAsDataURL(blob);
        }
    );
}

async function transcribeVoiceBlob(blob){
    const audioBase64 =
        await blobToBase64(blob);

    const language =
        getPreferredSpeechLocale()
            .split("-")[0]
            .toLowerCase();

    const response =
        await fetch(
            "/api/voice/transcribe",
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
                        audioBase64,
                        mimeType:
                            blob.type ||
                            "audio/webm",
                        language
                    })
            }
        );

    if (response.status === 401) {
        location.replace("/login");
        throw new Error(
            "Please sign in again."
        );
    }

    const data =
        await response.json()
            .catch(() => ({}));

    if (
        !response.ok ||
        data.success === false
    ) {
        throw new Error(
            data.message ||
            "Could not understand the recording."
        );
    }

    return String(
        data.text || ""
    ).trim();
}

function stopLiveMeter(){
    if (liveMeterFrame) {
        cancelAnimationFrame(
            liveMeterFrame
        );
        liveMeterFrame = null;
    }
}

function releaseLiveMedia(){
    stopLiveMeter();

    if (liveSourceNode) {
        try {
            liveSourceNode.disconnect();
        } catch {}
        liveSourceNode = null;
    }

    if (liveAnalyser) {
        try {
            liveAnalyser.disconnect();
        } catch {}
        liveAnalyser = null;
    }

    if (liveAudioContext) {
        try {
            liveAudioContext.close();
        } catch {}
        liveAudioContext = null;
    }

    if (liveMediaStream) {
        liveMediaStream
            .getTracks()
            .forEach(
                track => track.stop()
            );
        liveMediaStream = null;
    }
}

function stopLiveCapture(cancel=false){
    liveCancelCurrentTurn =
        liveCancelCurrentTurn || cancel;

    stopLiveMeter();

    if (
        liveMediaRecorder &&
        liveMediaRecorder.state !==
            "inactive"
    ) {
        try {
            liveMediaRecorder.stop();
        } catch {}
    }
}

function startSilenceMeter(stream){
    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) {
        clearTimeout(liveVoiceTimer);
        liveVoiceTimer =
            setTimeout(
                () =>
                    stopLiveCapture(false),
                7000
            );
        return;
    }

    if (liveAudioContext) {
        try {
            liveAudioContext.close();
        } catch {}
    }

    liveAudioContext =
        new AudioContextClass();

    liveSourceNode =
        liveAudioContext
            .createMediaStreamSource(
                stream
            );

    liveAnalyser =
        liveAudioContext
            .createAnalyser();

    liveAnalyser.fftSize = 1024;
    liveAnalyser.smoothingTimeConstant =
        0.35;

    liveSourceNode.connect(
        liveAnalyser
    );

    const samples =
        new Uint8Array(
            liveAnalyser.fftSize
        );

    const measure = () => {
        if (
            !liveVoiceMode ||
            !liveMediaRecorder ||
            liveMediaRecorder.state !==
                "recording"
        ) {
            return;
        }

        liveAnalyser.getByteTimeDomainData(
            samples
        );

        let sum = 0;

        for (
            let i = 0;
            i < samples.length;
            i++
        ) {
            const n =
                (samples[i] - 128) /
                128;

            sum += n * n;
        }

        const rms =
            Math.sqrt(
                sum / samples.length
            );

        const now = Date.now();

        if (rms > 0.035) {
            liveSpeechHeard = true;
            liveLastVoiceAt = now;
        }

        const elapsed =
            now - liveTurnStartedAt;

        const silentFor =
            now - liveLastVoiceAt;

        if (
            liveSpeechHeard &&
            elapsed > 900 &&
            silentFor > 1150
        ) {
            stopLiveCapture(false);
            return;
        }

        if (elapsed > 20000) {
            stopLiveCapture(false);
            return;
        }

        if (
            !liveSpeechHeard &&
            elapsed > 8000
        ) {
            stopLiveCapture(false);
            return;
        }

        liveMeterFrame =
            requestAnimationFrame(
                measure
            );
    };

    liveMeterFrame =
        requestAnimationFrame(
            measure
        );
}

async function ensureLiveMicrophone(){
    if (
        !navigator.mediaDevices?.getUserMedia ||
        !window.MediaRecorder
    ) {
        throw new Error(
            "This browser cannot record microphone audio."
        );
    }

    if (
        liveMediaStream &&
        liveMediaStream
            .getAudioTracks()
            .some(
                track =>
                    track.readyState ===
                    "live"
            )
    ) {
        return liveMediaStream;
    }

    liveMediaStream =
        await navigator.mediaDevices
            .getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });

    return liveMediaStream;
}

function scheduleLiveListen(delay=420){
    clearTimeout(liveVoiceTimer);

    if (
        !liveVoiceMode ||
        liveVoiceBusy
    ) {
        return;
    }

    liveVoiceTimer =
        setTimeout(
            startLiveListening,
            delay
        );
}

async function startLiveListening(){
    if (
        !liveVoiceMode ||
        liveVoiceBusy
    ) {
        return;
    }

    try {
        const stream =
            await ensureLiveMicrophone();

        if (!liveVoiceMode) {
            return;
        }

        const mimeType =
            supportedRecordingMime();

        liveChunks = [];
        liveSpeechHeard = false;
        liveLastVoiceAt = Date.now();
        liveTurnStartedAt = Date.now();
        liveCancelCurrentTurn = false;

        liveMediaRecorder =
            mimeType
                ? new MediaRecorder(
                    stream,
                    { mimeType }
                )
                : new MediaRecorder(
                    stream
                );

        liveMediaRecorder.ondataavailable =
            event => {
                if (
                    event.data &&
                    event.data.size > 0
                ) {
                    liveChunks.push(
                        event.data
                    );
                }
            };

        liveMediaRecorder.onerror =
            event => {
                console.error(
                    "LIVE VOICE RECORDER ERROR:",
                    event?.error ||
                    event
                );
            };

        liveMediaRecorder.onstop =
            async () => {
                stopLiveMeter();

                const cancelled =
                    liveCancelCurrentTurn;

                const chunks =
                    liveChunks;

                liveChunks = [];
                liveMediaRecorder = null;

                if (
                    cancelled ||
                    !liveVoiceMode
                ) {
                    return;
                }

                const blob =
                    new Blob(
                        chunks,
                        {
                            type:
                                mimeType ||
                                chunks[0]?.type ||
                                "audio/webm"
                        }
                    );

                if (
                    !liveSpeechHeard ||
                    blob.size < 600
                ) {
                    scheduleLiveListen(
                        350
                    );
                    return;
                }

                liveVoiceBusy = true;
                setLiveVoiceState(
                    "thinking"
                );

                try {
                    const transcript =
                        await transcribeVoiceBlob(
                            blob
                        );

                    if (
                        transcript &&
                        liveVoiceMode
                    ) {
                        await sendMessageWithText(
                            transcript,
                            false,
                            null,
                            {
                                liveVoice: true
                            }
                        );
                    }

                } catch (error) {
                    console.error(
                        "LIVE VOICE ERROR:",
                        error
                    );

                    if (
                        liveVoiceMode
                    ) {
                        liveVoiceStatus.textContent =
                            error?.message ||
                            "Voice failed. Try again.";
                    }

                } finally {
                    liveVoiceBusy = false;

                    if (
                        liveVoiceMode
                    ) {
                        scheduleLiveListen(
                            500
                        );
                    }
                }
            };

        liveMediaRecorder.start(
            250
        );

        setLiveVoiceState(
            "listening"
        );

        startSilenceMeter(
            stream
        );

    } catch (error) {
        console.error(
            "MICROPHONE ERROR:",
            error
        );

        const denied =
            error?.name ===
                "NotAllowedError" ||
            error?.name ===
                "PermissionDeniedError";

        alert(
            denied
                ? "Microphone permission is blocked. Allow microphone access for Aman AI, reload, and try again."
                : (
                    error?.message ||
                    "Aman AI could not start the microphone."
                )
        );

        endLiveVoiceMode();
    }
}

function speakLiveReply(text){
    return new Promise(
        resolve => {
            if (
                !liveVoiceMode ||
                !(
                    "speechSynthesis" in
                    window
                )
            ) {
                resolve();
                return;
            }

            const spoken =
                cleanSpeechText(text);

            if (!spoken) {
                resolve();
                return;
            }

            stopReadAloud();

            const utterance =
                new SpeechSynthesisUtterance(
                    spoken
                );

            const locale =
                getPreferredSpeechLocale();

            utterance.lang =
                locale;

            const voice =
                chooseSpeechVoice(
                    locale
                );

            if (voice) {
                utterance.voice =
                    voice;
            }

            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            setLiveVoiceState(
                "speaking"
            );

            let finished = false;

            const finish = () => {
                if (finished) return;
                finished = true;
                resolve();
            };

            utterance.onend =
                finish;

            utterance.onerror =
                finish;

            window.speechSynthesis
                .speak(utterance);
        }
    );
}

function endLiveVoiceMode(){
    liveVoiceMode = false;
    liveVoiceBusy = false;

    clearTimeout(
        liveVoiceTimer
    );

    stopLiveCapture(true);
    stopVoiceInput();
    stopReadAloud();

    if (
        "speechSynthesis" in window
    ) {
        speechSynthesis.cancel();
    }

    releaseLiveMedia();

    liveVoiceBtn?.classList.remove(
        "active"
    );

    closeLiveVoice();
}

async function startLiveVoiceMode(){
    if (liveVoiceMode) {
        endLiveVoiceMode();
        return;
    }

    if (
        !navigator.mediaDevices
            ?.getUserMedia ||
        !window.MediaRecorder
    ) {
        alert(
            "Live Voice needs microphone recording support. Open Aman AI in a recent Chrome, Edge, Safari, or Android browser."
        );
        return;
    }

    stopVoiceInput();
    stopReadAloud();

    liveVoiceMode = true;
    liveVoiceBusy = false;

    openLiveVoice();

    liveVoiceBtn?.classList.add(
        "active"
    );

    setLiveVoiceState(
        "ready"
    );

    // getUserMedia is called directly from this user tap,
    // which is important for mobile permission handling.
    await startLiveListening();
}

liveVoiceBtn?.addEventListener(
    "click",
    startLiveVoiceMode
);

endLiveVoiceBtn?.addEventListener(
    "click",
    endLiveVoiceMode
);


// ======================================================
// VOICE INPUT
// ======================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null;

let voiceRecognition =
    null;

let voiceListening =
    false;

let voiceBaseText =
    "";

function setVoiceButtonState(
    listening
) {

    voiceListening =
        listening;

    if (!voiceBtn) {
        return;
    }

    voiceBtn.classList.toggle(
        "listening",
        listening
    );

    voiceBtn.textContent =
        listening
            ? "⏹"
            : "🎤";

    const language =
        uiPreferences?.language ||
        "en";

    const t =
        TRANSLATIONS?.[language] ||
        TRANSLATIONS?.en ||
        {};

    const label =
        listening
            ? (
                t.stopVoiceTooltip ||
                "Stop voice input"
            )
            : (
                t.voiceTooltip ||
                "Voice input"
            );

    voiceBtn.dataset.tooltip =
        label;

    voiceBtn.setAttribute(
        "title",
        label
    );

    voiceBtn.setAttribute(
        "aria-label",
        label
    );
}

function autoResizeComposerInput() {
    if (!input) {
        return;
    }

    input.style.height =
        "auto";

    input.style.height =
        Math.min(
            input.scrollHeight,
            180
        ) + "px";
}

function stopVoiceInput() {
    if (
        voiceRecognition &&
        voiceListening
    ) {
        try {
            voiceRecognition.stop();
        }
        catch {}
    }

    setVoiceButtonState(
        false
    );
}

function startVoiceInput() {

    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported by this browser. Try a recent Chrome, Edge or Android browser."
        );

        return;
    }

    if (voiceListening) {
        stopVoiceInput();
        return;
    }

    stopReadAloud();

    voiceRecognition =
        new SpeechRecognition();

    voiceRecognition.lang =
        getPreferredSpeechLocale();

    voiceRecognition.continuous =
        false;

    voiceRecognition.interimResults =
        true;

    voiceRecognition.maxAlternatives =
        1;

    voiceBaseText =
        String(
            input?.value || ""
        ).trim();

    voiceRecognition.onstart =
        () => {
            setVoiceButtonState(
                true
            );
        };

    voiceRecognition.onresult =
        event => {

            let interim =
                "";

            let finalText =
                "";

            for (
                let i =
                    event.resultIndex;
                i <
                    event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0]
                        ?.transcript ||
                    "";

                if (
                    event.results[i]
                        .isFinal
                ) {
                    finalText +=
                        transcript;
                }
                else {
                    interim +=
                        transcript;
                }
            }

            const spoken =
                (
                    finalText +
                    interim
                ).trim();

            const prefix =
                voiceBaseText
                    ? voiceBaseText + " "
                    : "";

            if (input) {
                input.value =
                    prefix +
                    spoken;

                autoResizeComposerInput();

                input.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );
            }
        };

    voiceRecognition.onerror =
        event => {

            setVoiceButtonState(
                false
            );

            const error =
                event?.error ||
                "";

            if (
                error === "not-allowed" ||
                error === "service-not-allowed"
            ) {

                alert(
                    "Microphone permission is blocked. Allow microphone access for Aman AI and try again."
                );

            }
            else if (
                error !== "aborted" &&
                error !== "no-speech"
            ) {

                console.error(
                    "VOICE INPUT ERROR:",
                    error
                );
            }
        };

    voiceRecognition.onend =
        () => {
            setVoiceButtonState(
                false
            );

            voiceRecognition =
                null;

            input?.focus();
        };

    try {
        voiceRecognition.start();
    }
    catch (error) {

        console.error(
            "VOICE START ERROR:",
            error
        );

        setVoiceButtonState(
            false
        );
    }
}

if (voiceBtn) {

    voiceBtn.onclick =
        startVoiceInput;

}


// ======================================================
// AMAN AI v9 — PERSONALIZATION CENTER
// ======================================================

const personalizationModal =
document.getElementById("personalizationModal");

const personalizeBtn =
document.getElementById("personalizeBtn");

const personalizationClose =
document.getElementById("personalizationClose");

const savePreferencesBtn =
document.getElementById("savePreferencesBtn");

const resetPreferencesBtn =
document.getElementById("resetPreferencesBtn");

const prefLanguage =
document.getElementById("prefLanguage");

const prefFontSize =
document.getElementById("prefFontSize");

const prefFontFamily =
document.getElementById("prefFontFamily");

const prefFontColor =
document.getElementById("prefFontColor");

const prefAccent =
document.getElementById("prefAccent");

const prefBackground =
document.getElementById("prefBackground");

const prefDensity =
document.getElementById("prefDensity");

const prefBubbleStyle =
document.getElementById("prefBubbleStyle");

const prefReduceMotion =
document.getElementById("prefReduceMotion");

const prefFontColorValue =
document.getElementById("prefFontColorValue");

const prefAccentValue =
document.getElementById("prefAccentValue");

const customBackgroundInput =
document.getElementById("customBackgroundInput");

const chooseCustomBackgroundBtn =
document.getElementById("chooseCustomBackgroundBtn");

const useCustomBackgroundBtn =
document.getElementById("useCustomBackgroundBtn");

const removeCustomBackgroundBtn =
document.getElementById("removeCustomBackgroundBtn");

const customBackgroundPreview =
document.getElementById("customBackgroundPreview");

const customBackgroundEmpty =
document.getElementById("customBackgroundEmpty");

const customBackgroundStatus =
document.getElementById("customBackgroundStatus");

const backgroundLayer =
document.querySelector(".background");

const MAX_CUSTOM_BACKGROUND_FILE_BYTES =
6 * 1024 * 1024;

const CUSTOM_BACKGROUND_MAX_EDGE =
1600;


const DEFAULT_PREFERENCES = {
    language: "en",
    fontSize: "normal",
    fontFamily: "inter",
    fontColor: "#f8fafc",
    theme: "cinematic",
    accent: "#7c9cff",
    background: "aurora",
    density: "comfortable",
    bubbleStyle: "soft",
    reduceMotion: false
};

let uiPreferences = {
    ...DEFAULT_PREFERENCES
};

const TRANSLATIONS = {
    en: {
        menuTooltip:"Open menu",
        closeSidebarTooltip:"Close sidebar",
        personalizeTooltip:"Personalize",
        deleteTooltip:"Delete chat",
        attachTooltip:"Attach file",
        creatorTooltip:"Creator Mode",
        voiceTooltip:"Voice input",
        stopVoiceTooltip:"Stop voice input",
        sendTooltip:"Send message",
        closeTooltip:"Close",
        dashboardTooltip:"Dashboard",
        newChat: "＋ New Chat",
        chats: "Chats",
        dashboard: "Dashboard",
        sidebarTagline: "Your AI workspace",
        workspace: "Workspace",
        online: "● Online",
        placeholder: "Message Aman AI...",
        composerNote: "Aman AI can make mistakes. Verify important information.",
        actionTitle: "Chat action",
        personalizeKicker: "Aman AI Studio",
        personalizeTitle: "Personalization",
        personalizeSubtitle: "Make Aman AI feel like yours.",
        language: "Language",
        languageHelp: "Changes interface language.",
        theme: "Theme",
        themeHelp: "Choose the mood of the whole workspace.",
        textSize: "Text size",
        font: "Font",
        textColor: "Text color",
        accentColor: "Accent color",
        chatBackground: "Chat background",
        chatBackgroundHelp: "Changes the conversation atmosphere.",
        spacing: "Message spacing",
        bubbleStyle: "Bubble style",
        reduceMotion: "Reduce motion",
        reduceMotionHelp: "Reduces animated backgrounds and transitions.",
        reset: "Reset",
        save: "Save changes",
        saving: "Saving...",
        customPhoto: "Use your own photo",
        customPhotoHelp: "Pick a photo from this phone or computer. It stays on this device and is compressed before saving.",
        noPhoto: "No personal background selected",
        choosePhoto: "📷 Choose photo",
        usePhoto: "Use photo",
        photoInUse: "✓ In use",
        remove: "Remove",
        workspaceNames: {
            general:"🌐 General", school:"🎓 School", coding:"💻 Coding",
            business:"📊 Business", safari:"🦁 Safari", agriculture:"🌱 Agriculture",
            health:"🩺 Health", bible:"📖 Bible"
        },
        themes: {
            cinematic:"Cinematic", midnight:"Midnight", amoled:"AMOLED",
            light:"Light", ocean:"Ocean", sunset:"Sunset"
        },
        sizes: {small:"Small",normal:"Normal",large:"Large",xlarge:"Extra large"},
        fonts: {inter:"Modern",system:"System",serif:"Editorial",rounded:"Rounded",mono:"Mono"},
        backgrounds: {aurora:"Aurora",nebula:"Nebula",grid:"Digital grid",plain:"Plain",forest:"Forest night",sunset:"Sunset haze"},
        densities: {compact:"Compact",comfortable:"Comfortable",spacious:"Spacious"},
        bubbles: {soft:"Soft",glass:"Glass",minimal:"Minimal"}
    },

    sw: {
        menuTooltip:"Fungua menyu",
        closeSidebarTooltip:"Funga menyu",
        personalizeTooltip:"Binafsisha",
        deleteTooltip:"Futa mazungumzo",
        attachTooltip:"Ambatisha faili",
        creatorTooltip:"Creator Mode",
        voiceTooltip:"Ingiza kwa sauti",
        stopVoiceTooltip:"Simamisha sauti",
        sendTooltip:"Tuma ujumbe",
        closeTooltip:"Funga",
        dashboardTooltip:"Dashibodi",
        newChat:"＋ Mazungumzo Mapya", chats:"Mazungumzo", dashboard:"Dashibodi",
        sidebarTagline:"Eneo lako la kazi la AI", workspace:"Eneo la kazi", online:"● Mtandaoni",
        placeholder:"Andika ujumbe kwa Aman AI...",
        composerNote:"Aman AI inaweza kukosea. Hakiki taarifa muhimu.",
        actionTitle:"Kitendo cha mazungumzo", personalizeKicker:"Aman AI Studio",
        personalizeTitle:"Ubinafsishaji", personalizeSubtitle:"Fanya Aman AI iwe yako.",
        language:"Lugha", languageHelp:"Hubadilisha lugha ya menyu.",
        theme:"Mandhari", themeHelp:"Chagua mwonekano wa eneo lote la kazi.",
        textSize:"Ukubwa wa maandishi", font:"Aina ya herufi", textColor:"Rangi ya maandishi",
        accentColor:"Rangi kuu", chatBackground:"Mandharinyuma ya mazungumzo",
        chatBackgroundHelp:"Hubadilisha mwonekano wa eneo la mazungumzo.",
        spacing:"Nafasi za ujumbe", bubbleStyle:"Mtindo wa ujumbe",
        reduceMotion:"Punguza miondoko", reduceMotionHelp:"Hupunguza uhuishaji na mabadiliko.",
        reset:"Rudisha", save:"Hifadhi mabadiliko", saving:"Inahifadhi...",
        customPhoto:"Tumia picha yako", customPhotoHelp:"Chagua picha kutoka simu au kompyuta hii. Inabaki kwenye kifaa hiki na inapunguzwa kabla ya kuhifadhi.",
        noPhoto:"Hakuna picha binafsi iliyochaguliwa", choosePhoto:"📷 Chagua picha", usePhoto:"Tumia picha",
        photoInUse:"✓ Inatumika", remove:"Ondoa",
        workspaceNames:{general:"🌐 Kawaida",school:"🎓 Shule",coding:"💻 Uandishi wa programu",business:"📊 Biashara",safari:"🦁 Safari",agriculture:"🌱 Kilimo",health:"🩺 Afya",bible:"📖 Biblia"},
        themes:{cinematic:"Sinema",midnight:"Usiku",amoled:"AMOLED",light:"Mwanga",ocean:"Bahari",sunset:"Machweo"},
        sizes:{small:"Ndogo",normal:"Kawaida",large:"Kubwa",xlarge:"Kubwa sana"},
        fonts:{inter:"Kisasa",system:"Mfumo",serif:"Kihariri",rounded:"Mviringo",mono:"Mono"},
        backgrounds:{aurora:"Aurora",nebula:"Nebula",grid:"Gridi ya kidijitali",plain:"Rahisi",forest:"Msitu wa usiku",sunset:"Ukungu wa machweo"},
        densities:{compact:"Kubana",comfortable:"Kawaida",spacious:"Nafasi kubwa"},
        bubbles:{soft:"Laini",glass:"Kioo",minimal:"Rahisi"}
    },

    zh: {
        menuTooltip:"打开菜单",
        closeSidebarTooltip:"关闭侧栏",
        personalizeTooltip:"个性化",
        deleteTooltip:"删除对话",
        attachTooltip:"添加文件",
        creatorTooltip:"创作模式",
        voiceTooltip:"语音输入",
        stopVoiceTooltip:"停止语音输入",
        sendTooltip:"发送消息",
        closeTooltip:"关闭",
        dashboardTooltip:"控制面板",
        newChat:"＋ 新对话", chats:"对话", dashboard:"控制面板",
        sidebarTagline:"你的 AI 工作空间", workspace:"工作空间", online:"● 在线",
        placeholder:"给 Aman AI 发消息...",
        composerNote:"Aman AI 可能会出错，请核实重要信息。",
        actionTitle:"对话操作", personalizeKicker:"Aman AI 工作室",
        personalizeTitle:"个性化", personalizeSubtitle:"让 Aman AI 更符合你的喜好。",
        language:"语言", languageHelp:"更改界面语言。",
        theme:"主题", themeHelp:"选择整个工作空间的视觉风格。",
        textSize:"文字大小", font:"字体", textColor:"文字颜色",
        accentColor:"强调色", chatBackground:"聊天背景",
        chatBackgroundHelp:"更改聊天区域的氛围。",
        spacing:"消息间距", bubbleStyle:"气泡样式",
        reduceMotion:"减少动画", reduceMotionHelp:"减少背景动画和界面过渡。",
        reset:"重置", save:"保存更改", saving:"正在保存...",
        customPhoto:"使用自己的照片", customPhotoHelp:"从手机或电脑选择照片。照片只保存在此设备，并会在保存前压缩。",
        noPhoto:"尚未选择个人背景", choosePhoto:"📷 选择照片", usePhoto:"使用照片",
        photoInUse:"✓ 使用中", remove:"移除",
        workspaceNames:{general:"🌐 通用",school:"🎓 学习",coding:"💻 编程",business:"📊 商业",safari:"🦁 旅行",agriculture:"🌱 农业",health:"🩺 健康",bible:"📖 圣经"},
        themes:{cinematic:"电影感",midnight:"午夜",amoled:"AMOLED",light:"明亮",ocean:"海洋",sunset:"日落"},
        sizes:{small:"小",normal:"标准",large:"大",xlarge:"超大"},
        fonts:{inter:"现代",system:"系统",serif:"衬线",rounded:"圆体",mono:"等宽"},
        backgrounds:{aurora:"极光",nebula:"星云",grid:"数字网格",plain:"纯色",forest:"夜间森林",sunset:"日落薄雾"},
        densities:{compact:"紧凑",comfortable:"舒适",spacious:"宽松"},
        bubbles:{soft:"柔和",glass:"玻璃",minimal:"极简"}
    },

    fr: {
        menuTooltip:"Ouvrir le menu",
        closeSidebarTooltip:"Fermer la barre latérale",
        personalizeTooltip:"Personnaliser",
        deleteTooltip:"Supprimer le chat",
        attachTooltip:"Joindre un fichier",
        creatorTooltip:"Mode Créateur",
        voiceTooltip:"Saisie vocale",
        stopVoiceTooltip:"Arrêter la saisie vocale",
        sendTooltip:"Envoyer",
        closeTooltip:"Fermer",
        dashboardTooltip:"Tableau de bord",
        newChat:"＋ Nouveau chat", chats:"Discussions", dashboard:"Tableau de bord",
        sidebarTagline:"Votre espace de travail IA", workspace:"Espace de travail", online:"● En ligne",
        placeholder:"Écrivez à Aman AI...",
        composerNote:"Aman AI peut se tromper. Vérifiez les informations importantes.",
        actionTitle:"Action de discussion", personalizeKicker:"Studio Aman AI",
        personalizeTitle:"Personnalisation", personalizeSubtitle:"Faites d’Aman AI votre espace.",
        language:"Langue", languageHelp:"Change la langue de l’interface.",
        theme:"Thème", themeHelp:"Choisissez l’ambiance de l’espace de travail.",
        textSize:"Taille du texte", font:"Police", textColor:"Couleur du texte",
        accentColor:"Couleur d’accent", chatBackground:"Arrière-plan du chat",
        chatBackgroundHelp:"Change l’atmosphère de la conversation.",
        spacing:"Espacement des messages", bubbleStyle:"Style des bulles",
        reduceMotion:"Réduire les animations", reduceMotionHelp:"Réduit les animations et transitions.",
        reset:"Réinitialiser", save:"Enregistrer", saving:"Enregistrement...",
        customPhoto:"Utiliser votre photo", customPhotoHelp:"Choisissez une photo sur cet appareil. Elle reste sur cet appareil et est compressée avant l’enregistrement.",
        noPhoto:"Aucun arrière-plan personnel", choosePhoto:"📷 Choisir une photo", usePhoto:"Utiliser la photo", photoInUse:"✓ Utilisée", remove:"Supprimer",
        workspaceNames:{general:"🌐 Général",school:"🎓 École",coding:"💻 Programmation",business:"📊 Entreprise",safari:"🦁 Safari",agriculture:"🌱 Agriculture",health:"🩺 Santé",bible:"📖 Bible"},
        themes:{cinematic:"Cinématique",midnight:"Minuit",amoled:"AMOLED",light:"Clair",ocean:"Océan",sunset:"Coucher de soleil"},
        sizes:{small:"Petit",normal:"Normal",large:"Grand",xlarge:"Très grand"},
        fonts:{inter:"Moderne",system:"Système",serif:"Éditoriale",rounded:"Arrondie",mono:"Mono"},
        backgrounds:{aurora:"Aurore",nebula:"Nébuleuse",grid:"Grille numérique",plain:"Uni",forest:"Forêt nocturne",sunset:"Brume du soir"},
        densities:{compact:"Compact",comfortable:"Confortable",spacious:"Aéré"},
        bubbles:{soft:"Doux",glass:"Verre",minimal:"Minimal"}
    },

    es: {
        menuTooltip:"Abrir menú",
        closeSidebarTooltip:"Cerrar barra lateral",
        personalizeTooltip:"Personalizar",
        deleteTooltip:"Eliminar chat",
        attachTooltip:"Adjuntar archivo",
        creatorTooltip:"Modo Creador",
        voiceTooltip:"Entrada de voz",
        stopVoiceTooltip:"Detener entrada de voz",
        sendTooltip:"Enviar mensaje",
        closeTooltip:"Cerrar",
        dashboardTooltip:"Panel",
        newChat:"＋ Nuevo chat", chats:"Chats", dashboard:"Panel",
        sidebarTagline:"Tu espacio de trabajo con IA", workspace:"Espacio de trabajo", online:"● En línea",
        placeholder:"Escribe a Aman AI...", composerNote:"Aman AI puede equivocarse. Verifica la información importante.",
        actionTitle:"Acción del chat", personalizeKicker:"Aman AI Studio", personalizeTitle:"Personalización",
        personalizeSubtitle:"Haz que Aman AI se sienta tuyo.", language:"Idioma", languageHelp:"Cambia el idioma de la interfaz.",
        theme:"Tema", themeHelp:"Elige el ambiente del espacio de trabajo.", textSize:"Tamaño del texto", font:"Fuente",
        textColor:"Color del texto", accentColor:"Color de acento", chatBackground:"Fondo del chat",
        chatBackgroundHelp:"Cambia el ambiente de la conversación.", spacing:"Espaciado de mensajes", bubbleStyle:"Estilo de burbuja",
        reduceMotion:"Reducir movimiento", reduceMotionHelp:"Reduce animaciones y transiciones.", reset:"Restablecer",
        save:"Guardar cambios", saving:"Guardando...", customPhoto:"Usar tu propia foto",
        customPhotoHelp:"Elige una foto de este teléfono u ordenador. Permanece en este dispositivo y se comprime antes de guardarse.",
        noPhoto:"No hay fondo personal seleccionado", choosePhoto:"📷 Elegir foto", usePhoto:"Usar foto", photoInUse:"✓ En uso", remove:"Eliminar",
        workspaceNames:{general:"🌐 General",school:"🎓 Escuela",coding:"💻 Programación",business:"📊 Negocios",safari:"🦁 Safari",agriculture:"🌱 Agricultura",health:"🩺 Salud",bible:"📖 Biblia"},
        themes:{cinematic:"Cinemático",midnight:"Medianoche",amoled:"AMOLED",light:"Claro",ocean:"Océano",sunset:"Atardecer"},
        sizes:{small:"Pequeño",normal:"Normal",large:"Grande",xlarge:"Muy grande"},
        fonts:{inter:"Moderna",system:"Sistema",serif:"Editorial",rounded:"Redondeada",mono:"Mono"},
        backgrounds:{aurora:"Aurora",nebula:"Nebulosa",grid:"Cuadrícula digital",plain:"Simple",forest:"Bosque nocturno",sunset:"Bruma del atardecer"},
        densities:{compact:"Compacto",comfortable:"Cómodo",spacious:"Amplio"},
        bubbles:{soft:"Suave",glass:"Cristal",minimal:"Minimalista"}
    },

    pt: {
        menuTooltip:"Abrir menu",
        closeSidebarTooltip:"Fechar barra lateral",
        personalizeTooltip:"Personalizar",
        deleteTooltip:"Excluir conversa",
        attachTooltip:"Anexar arquivo",
        creatorTooltip:"Modo Criador",
        voiceTooltip:"Entrada de voz",
        stopVoiceTooltip:"Parar entrada de voz",
        sendTooltip:"Enviar mensagem",
        closeTooltip:"Fechar",
        dashboardTooltip:"Painel",
        newChat:"＋ Nova conversa", chats:"Conversas", dashboard:"Painel",
        sidebarTagline:"Seu espaço de trabalho com IA", workspace:"Espaço de trabalho", online:"● Online",
        placeholder:"Mensagem para Aman AI...", composerNote:"Aman AI pode cometer erros. Verifique informações importantes.",
        actionTitle:"Ação da conversa", personalizeKicker:"Aman AI Studio", personalizeTitle:"Personalização",
        personalizeSubtitle:"Deixe o Aman AI com a sua cara.", language:"Idioma", languageHelp:"Altera o idioma da interface.",
        theme:"Tema", themeHelp:"Escolha o visual do espaço de trabalho.", textSize:"Tamanho do texto", font:"Fonte",
        textColor:"Cor do texto", accentColor:"Cor de destaque", chatBackground:"Fundo do chat",
        chatBackgroundHelp:"Altera o clima da conversa.", spacing:"Espaçamento das mensagens", bubbleStyle:"Estilo dos balões",
        reduceMotion:"Reduzir movimento", reduceMotionHelp:"Reduz animações e transições.", reset:"Redefinir",
        save:"Salvar alterações", saving:"Salvando...", customPhoto:"Usar sua própria foto",
        customPhotoHelp:"Escolha uma foto deste aparelho. Ela fica neste dispositivo e é comprimida antes de salvar.",
        noPhoto:"Nenhum fundo pessoal selecionado", choosePhoto:"📷 Escolher foto", usePhoto:"Usar foto", photoInUse:"✓ Em uso", remove:"Remover",
        workspaceNames:{general:"🌐 Geral",school:"🎓 Escola",coding:"💻 Programação",business:"📊 Negócios",safari:"🦁 Safari",agriculture:"🌱 Agricultura",health:"🩺 Saúde",bible:"📖 Bíblia"},
        themes:{cinematic:"Cinemático",midnight:"Meia-noite",amoled:"AMOLED",light:"Claro",ocean:"Oceano",sunset:"Pôr do sol"},
        sizes:{small:"Pequeno",normal:"Normal",large:"Grande",xlarge:"Muito grande"},
        fonts:{inter:"Moderna",system:"Sistema",serif:"Editorial",rounded:"Arredondada",mono:"Mono"},
        backgrounds:{aurora:"Aurora",nebula:"Nebulosa",grid:"Grade digital",plain:"Simples",forest:"Floresta noturna",sunset:"Névoa do pôr do sol"},
        densities:{compact:"Compacto",comfortable:"Confortável",spacious:"Espaçoso"},
        bubbles:{soft:"Suave",glass:"Vidro",minimal:"Minimalista"}
    },

    de: {
        menuTooltip:"Menü öffnen",
        closeSidebarTooltip:"Seitenleiste schließen",
        personalizeTooltip:"Personalisieren",
        deleteTooltip:"Chat löschen",
        attachTooltip:"Datei anhängen",
        creatorTooltip:"Creator-Modus",
        voiceTooltip:"Spracheingabe",
        stopVoiceTooltip:"Spracheingabe stoppen",
        sendTooltip:"Nachricht senden",
        closeTooltip:"Schließen",
        dashboardTooltip:"Übersicht",
        newChat:"＋ Neuer Chat", chats:"Chats", dashboard:"Übersicht",
        sidebarTagline:"Dein KI-Arbeitsbereich", workspace:"Arbeitsbereich", online:"● Online",
        placeholder:"Nachricht an Aman AI...", composerNote:"Aman AI kann Fehler machen. Prüfe wichtige Informationen.",
        actionTitle:"Chat-Aktion", personalizeKicker:"Aman AI Studio", personalizeTitle:"Personalisierung",
        personalizeSubtitle:"Gestalte Aman AI nach deinem Geschmack.", language:"Sprache", languageHelp:"Ändert die Sprache der Oberfläche.",
        theme:"Design", themeHelp:"Wähle die Stimmung des Arbeitsbereichs.", textSize:"Textgröße", font:"Schriftart",
        textColor:"Textfarbe", accentColor:"Akzentfarbe", chatBackground:"Chat-Hintergrund",
        chatBackgroundHelp:"Ändert die Atmosphäre des Chats.", spacing:"Nachrichtenabstand", bubbleStyle:"Blasenstil",
        reduceMotion:"Bewegung reduzieren", reduceMotionHelp:"Reduziert Animationen und Übergänge.", reset:"Zurücksetzen",
        save:"Änderungen speichern", saving:"Speichern...", customPhoto:"Eigenes Foto verwenden",
        customPhotoHelp:"Wähle ein Foto von diesem Gerät. Es bleibt auf diesem Gerät und wird vor dem Speichern komprimiert.",
        noPhoto:"Kein persönlicher Hintergrund ausgewählt", choosePhoto:"📷 Foto auswählen", usePhoto:"Foto verwenden", photoInUse:"✓ Aktiv", remove:"Entfernen",
        workspaceNames:{general:"🌐 Allgemein",school:"🎓 Schule",coding:"💻 Programmierung",business:"📊 Business",safari:"🦁 Safari",agriculture:"🌱 Landwirtschaft",health:"🩺 Gesundheit",bible:"📖 Bibel"},
        themes:{cinematic:"Kino",midnight:"Mitternacht",amoled:"AMOLED",light:"Hell",ocean:"Ozean",sunset:"Sonnenuntergang"},
        sizes:{small:"Klein",normal:"Normal",large:"Groß",xlarge:"Sehr groß"},
        fonts:{inter:"Modern",system:"System",serif:"Serif",rounded:"Abgerundet",mono:"Mono"},
        backgrounds:{aurora:"Aurora",nebula:"Nebel",grid:"Digitales Raster",plain:"Schlicht",forest:"Nachtwald",sunset:"Abendnebel"},
        densities:{compact:"Kompakt",comfortable:"Bequem",spacious:"Weit"},
        bubbles:{soft:"Weich",glass:"Glas",minimal:"Minimal"}
    },

    ar: {
        menuTooltip:"فتح القائمة",
        closeSidebarTooltip:"إغلاق الشريط الجانبي",
        personalizeTooltip:"تخصيص",
        deleteTooltip:"حذف المحادثة",
        attachTooltip:"إرفاق ملف",
        creatorTooltip:"وضع الإنشاء",
        voiceTooltip:"إدخال صوتي",
        stopVoiceTooltip:"إيقاف الإدخال الصوتي",
        sendTooltip:"إرسال الرسالة",
        closeTooltip:"إغلاق",
        dashboardTooltip:"لوحة التحكم",
        newChat:"＋ محادثة جديدة", chats:"المحادثات", dashboard:"لوحة التحكم",
        sidebarTagline:"مساحة عملك بالذكاء الاصطناعي", workspace:"مساحة العمل", online:"● متصل",
        placeholder:"اكتب رسالة إلى Aman AI...", composerNote:"قد يخطئ Aman AI. تحقّق من المعلومات المهمة.",
        actionTitle:"إجراء المحادثة", personalizeKicker:"استوديو Aman AI", personalizeTitle:"التخصيص",
        personalizeSubtitle:"اجعل Aman AI مناسبًا لك.", language:"اللغة", languageHelp:"تغيير لغة الواجهة.",
        theme:"المظهر", themeHelp:"اختر طابع مساحة العمل.", textSize:"حجم النص", font:"الخط",
        textColor:"لون النص", accentColor:"اللون المميز", chatBackground:"خلفية المحادثة",
        chatBackgroundHelp:"تغيير أجواء منطقة المحادثة.", spacing:"تباعد الرسائل", bubbleStyle:"نمط الفقاعات",
        reduceMotion:"تقليل الحركة", reduceMotionHelp:"يقلل الرسوم المتحركة والانتقالات.", reset:"إعادة ضبط",
        save:"حفظ التغييرات", saving:"جارٍ الحفظ...", customPhoto:"استخدام صورتك",
        customPhotoHelp:"اختر صورة من هذا الهاتف أو الكمبيوتر. تبقى على هذا الجهاز ويتم ضغطها قبل الحفظ.",
        noPhoto:"لم يتم اختيار خلفية شخصية", choosePhoto:"📷 اختيار صورة", usePhoto:"استخدام الصورة", photoInUse:"✓ قيد الاستخدام", remove:"إزالة",
        workspaceNames:{general:"🌐 عام",school:"🎓 الدراسة",coding:"💻 البرمجة",business:"📊 الأعمال",safari:"🦁 السفاري",agriculture:"🌱 الزراعة",health:"🩺 الصحة",bible:"📖 الكتاب المقدس"},
        themes:{cinematic:"سينمائي",midnight:"منتصف الليل",amoled:"AMOLED",light:"فاتح",ocean:"المحيط",sunset:"الغروب"},
        sizes:{small:"صغير",normal:"عادي",large:"كبير",xlarge:"كبير جدًا"},
        fonts:{inter:"حديث",system:"النظام",serif:"تحريري",rounded:"مستدير",mono:"أحادي"},
        backgrounds:{aurora:"الشفق",nebula:"السديم",grid:"شبكة رقمية",plain:"بسيط",forest:"غابة ليلية",sunset:"ضباب الغروب"},
        densities:{compact:"مضغوط",comfortable:"مريح",spacious:"واسع"},
        bubbles:{soft:"ناعم",glass:"زجاجي",minimal:"بسيط"}
    },

    hi: {
        menuTooltip:"मेनू खोलें",
        closeSidebarTooltip:"साइडबार बंद करें",
        personalizeTooltip:"व्यक्तिगत करें",
        deleteTooltip:"चैट हटाएँ",
        attachTooltip:"फ़ाइल जोड़ें",
        creatorTooltip:"क्रिएटर मोड",
        voiceTooltip:"वॉइस इनपुट",
        stopVoiceTooltip:"वॉइस इनपुट रोकें",
        sendTooltip:"संदेश भेजें",
        closeTooltip:"बंद करें",
        dashboardTooltip:"डैशबोर्ड",
        newChat:"＋ नई चैट", chats:"चैट", dashboard:"डैशबोर्ड",
        sidebarTagline:"आपका AI कार्यक्षेत्र", workspace:"कार्यक्षेत्र", online:"● ऑनलाइन",
        placeholder:"Aman AI को संदेश लिखें...", composerNote:"Aman AI से गलती हो सकती है। महत्वपूर्ण जानकारी जाँच लें।",
        actionTitle:"चैट कार्रवाई", personalizeKicker:"Aman AI स्टूडियो", personalizeTitle:"व्यक्तिगत सेटिंग",
        personalizeSubtitle:"Aman AI को अपनी पसंद के अनुसार बनाएं।", language:"भाषा", languageHelp:"इंटरफ़ेस की भाषा बदलें।",
        theme:"थीम", themeHelp:"पूरे कार्यक्षेत्र का रूप चुनें।", textSize:"टेक्स्ट आकार", font:"फ़ॉन्ट",
        textColor:"टेक्स्ट रंग", accentColor:"एक्सेंट रंग", chatBackground:"चैट पृष्ठभूमि",
        chatBackgroundHelp:"चैट का वातावरण बदलें।", spacing:"संदेश अंतर", bubbleStyle:"बबल शैली",
        reduceMotion:"एनीमेशन कम करें", reduceMotionHelp:"एनीमेशन और ट्रांज़िशन कम करता है।", reset:"रीसेट",
        save:"बदलाव सहेजें", saving:"सहेजा जा रहा है...", customPhoto:"अपनी फोटो इस्तेमाल करें",
        customPhotoHelp:"इस फोन या कंप्यूटर से फोटो चुनें। यह इसी डिवाइस पर रहती है और सेव होने से पहले संपीड़ित होती है।",
        noPhoto:"कोई निजी पृष्ठभूमि चयनित नहीं", choosePhoto:"📷 फोटो चुनें", usePhoto:"फोटो इस्तेमाल करें", photoInUse:"✓ उपयोग में", remove:"हटाएँ",
        workspaceNames:{general:"🌐 सामान्य",school:"🎓 स्कूल",coding:"💻 कोडिंग",business:"📊 व्यवसाय",safari:"🦁 सफारी",agriculture:"🌱 कृषि",health:"🩺 स्वास्थ्य",bible:"📖 बाइबल"},
        themes:{cinematic:"सिनेमैटिक",midnight:"मिडनाइट",amoled:"AMOLED",light:"लाइट",ocean:"ओशन",sunset:"सनसेट"},
        sizes:{small:"छोटा",normal:"सामान्य",large:"बड़ा",xlarge:"बहुत बड़ा"},
        fonts:{inter:"मॉडर्न",system:"सिस्टम",serif:"सेरिफ",rounded:"राउंडेड",mono:"मोनो"},
        backgrounds:{aurora:"ऑरोरा",nebula:"नेब्युला",grid:"डिजिटल ग्रिड",plain:"सादा",forest:"रात का जंगल",sunset:"सनसेट धुंध"},
        densities:{compact:"कॉम्पैक्ट",comfortable:"आरामदायक",spacious:"खुला"},
        bubbles:{soft:"सॉफ्ट",glass:"ग्लास",minimal:"मिनिमल"}
    },

    ja: {
        newChat:"＋ 新しいチャット", chats:"チャット", dashboard:"ダッシュボード",
        sidebarTagline:"あなたのAIワークスペース", workspace:"ワークスペース", online:"● オンライン",
        placeholder:"Aman AI にメッセージ...", composerNote:"Aman AI は間違えることがあります。重要な情報は確認してください。",
        actionTitle:"チャット操作", personalizeKicker:"Aman AI スタジオ", personalizeTitle:"パーソナライズ",
        personalizeSubtitle:"Aman AI を自分好みに設定しましょう。", language:"言語", languageHelp:"インターフェース言語を変更します。",
        theme:"テーマ", themeHelp:"ワークスペース全体の雰囲気を選びます。", textSize:"文字サイズ", font:"フォント",
        textColor:"文字色", accentColor:"アクセント色", chatBackground:"チャット背景",
        chatBackgroundHelp:"会話画面の雰囲気を変更します。", spacing:"メッセージ間隔", bubbleStyle:"吹き出しスタイル",
        reduceMotion:"動きを減らす", reduceMotionHelp:"アニメーションと画面遷移を減らします。", reset:"リセット",
        save:"変更を保存", saving:"保存中...", customPhoto:"自分の写真を使う",
        customPhotoHelp:"この端末から写真を選びます。写真はこの端末だけに保存され、保存前に圧縮されます。",
        noPhoto:"個人背景が選択されていません", choosePhoto:"📷 写真を選択", usePhoto:"写真を使う", photoInUse:"✓ 使用中", remove:"削除",
        workspaceNames:{general:"🌐 一般",school:"🎓 学習",coding:"💻 コーディング",business:"📊 ビジネス",safari:"🦁 サファリ",agriculture:"🌱 農業",health:"🩺 健康",bible:"📖 聖書"},
        themes:{cinematic:"シネマ",midnight:"ミッドナイト",amoled:"AMOLED",light:"ライト",ocean:"オーシャン",sunset:"サンセット"},
        sizes:{small:"小",normal:"標準",large:"大",xlarge:"特大"},
        fonts:{inter:"モダン",system:"システム",serif:"セリフ",rounded:"丸型",mono:"モノ"},
        backgrounds:{aurora:"オーロラ",nebula:"星雲",grid:"デジタルグリッド",plain:"シンプル",forest:"夜の森",sunset:"夕焼けの霧"},
        densities:{compact:"コンパクト",comfortable:"標準",spacious:"広め"},
        bubbles:{soft:"ソフト",glass:"ガラス",minimal:"ミニマル"}
    }
};

function setText(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined) {
        element.textContent = value;
    }
}

function setOptionText(selectId, values) {
    const select = document.getElementById(selectId);
    if (!select || !values) return;

    [...select.options].forEach(option => {
        if (values[option.value] !== undefined) {
            option.textContent = values[option.value];
        }
    });
}


function setTooltip(id, value) {
    const element =
        document.getElementById(id);

    if (!element || !value) {
        return;
    }

    element.dataset.tooltip =
        value;

    element.setAttribute(
        "title",
        value
    );

    element.setAttribute(
        "aria-label",
        value
    );
}

function applyTooltipTranslations(t) {
    setTooltip("menuBtn", t.menuTooltip);
    setTooltip("closeSidebarBtn", t.closeSidebarTooltip);
    setTooltip("personalizeBtn", t.personalizeTooltip);
    setTooltip("deleteChatBtn", t.deleteTooltip);
    setTooltip("attachBtn", t.attachTooltip);
    setTooltip("creatorBtn", t.creatorTooltip);
    setTooltip("voiceBtn", t.voiceTooltip);
    setTooltip("sendBtn", t.sendTooltip);
    setTooltip("personalizationClose", t.closeTooltip);
    setTooltip("actionModalClose", t.closeTooltip);

    document
        .querySelectorAll(
            ".dashboard-link, .sidebar-dashboard-link"
        )
        .forEach(element => {
            element.dataset.tooltip =
                t.dashboardTooltip;

            element.setAttribute(
                "title",
                t.dashboardTooltip
            );
        });
}

function applyTranslations(language) {
    const t = TRANSLATIONS[language] || TRANSLATIONS.en;

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    applyTooltipTranslations(t);

    if (liveVoicePanel?.classList.contains("open")) {
        setLiveVoiceState(liveVoicePanel.dataset.state || "ready");
    }

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        if (t[key]) element.textContent = t[key];
    });

    setText("sidebarTagline", t.sidebarTagline);
    setText("workspaceSectionTitle", t.workspace);
    setText("headerDashboardLabel", t.dashboard);
    setText("composerNote", t.composerNote);
    setText("actionModalTitle", t.actionTitle);
    setText("personalizationKicker", t.personalizeKicker);
    setText("personalizationTitle", t.personalizeTitle);
    setText("personalizationSubtitle", t.personalizeSubtitle);
    setText("languageLabel", t.language);
    setText("languageHelp", t.languageHelp);
    setText("themeLabel", t.theme);
    setText("themeHelp", t.themeHelp);
    setText("fontSizeLabel", t.textSize);
    setText("fontFamilyLabel", t.font);
    setText("fontColorLabel", t.textColor);
    setText("accentColorLabel", t.accentColor);
    setText("backgroundLabel", t.chatBackground);
    setText("backgroundHelp", t.chatBackgroundHelp);
    setText("densityLabel", t.spacing);
    setText("bubbleStyleLabel", t.bubbleStyle);
    setText("reduceMotionLabel", t.reduceMotion);
    setText("reduceMotionHelp", t.reduceMotionHelp);
    setText("customPhotoLabel", t.customPhoto);
    setText("customPhotoHelp", t.customPhotoHelp);

    if (customBackgroundEmpty && !customBackgroundEmpty.hidden) {
        customBackgroundEmpty.textContent = t.noPhoto;
    }

    if (chooseCustomBackgroundBtn) {
        chooseCustomBackgroundBtn.textContent = t.choosePhoto;
    }

    if (removeCustomBackgroundBtn) {
        removeCustomBackgroundBtn.textContent = t.remove;
    }

    if (useCustomBackgroundBtn) {
        useCustomBackgroundBtn.textContent =
            isCustomBackgroundEnabled() ? t.photoInUse : t.usePhoto;
    }

    if (resetPreferencesBtn) {
        resetPreferencesBtn.textContent = t.reset;
    }

    if (savePreferencesBtn && !savePreferencesBtn.disabled) {
        savePreferencesBtn.textContent = t.save;
    }

    if (input) {
        input.placeholder = t.placeholder;
        input.setAttribute("aria-label", t.placeholder);
    }

    setOptionText("workspaceSelect", t.workspaceNames);
    setOptionText("prefFontSize", t.sizes);
    setOptionText("prefFontFamily", t.fonts);
    setOptionText("prefBackground", t.backgrounds);
    setOptionText("prefDensity", t.densities);
    setOptionText("prefBubbleStyle", t.bubbles);

    document.querySelectorAll(".theme-choice").forEach(button => {
        const preview = button.querySelector(".theme-preview");
        const themeName = t.themes?.[button.dataset.theme];
        if (!themeName) return;

        [...button.childNodes].forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) node.remove();
        });

        if (preview) {
            button.appendChild(document.createTextNode("\n" + themeName));
        }
    });

    // Keep current workspace badge translated.
    if (workspaceBadge) {
        const current = workspaceSelect?.value || "general";
        const translated =
            t.workspaceNames?.[current] ||
            t.workspaceNames.general;

        workspaceBadge.textContent =
            translated.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    }
}



function customBackgroundStorageKey() {
    return (
        "AmanCustomBackground:" +
        (accountUserId || "device")
    );
}

function customBackgroundEnabledKey() {
    return (
        "AmanCustomBackgroundEnabled:" +
        (accountUserId || "device")
    );
}

function getStoredCustomBackground() {
    try {
        return localStorage.getItem(
            customBackgroundStorageKey()
        );
    }
    catch {
        return null;
    }
}

function isCustomBackgroundEnabled() {
    try {
        return (
            localStorage.getItem(
                customBackgroundEnabledKey()
            ) === "true"
        );
    }
    catch {
        return false;
    }
}

function setCustomBackgroundStatus(
    message = "",
    type = ""
) {
    if (!customBackgroundStatus) {
        return;
    }

    customBackgroundStatus.textContent =
    message;

    customBackgroundStatus.className =
    "custom-background-status" +
    (type ? " " + type : "");
}

function refreshCustomBackgroundPreview() {

    const imageData =
    getStoredCustomBackground();

    const enabled =
    isCustomBackgroundEnabled();

    if (customBackgroundPreview) {

        if (imageData) {
            customBackgroundPreview.style.backgroundImage =
            `linear-gradient(
                rgba(4,8,16,.18),
                rgba(4,8,16,.18)
            ),
            url("${imageData}")`;

            customBackgroundPreview.classList.add(
                "has-image"
            );

            if (customBackgroundEmpty) {
                customBackgroundEmpty.hidden =
                true;
            }
        }
        else {
            customBackgroundPreview.style.backgroundImage =
            "";

            customBackgroundPreview.classList.remove(
                "has-image"
            );

            if (customBackgroundEmpty) {
                customBackgroundEmpty.hidden =
                false;
            }
        }
    }

    if (useCustomBackgroundBtn) {
        useCustomBackgroundBtn.disabled =
        !imageData || enabled;

        const t =
        TRANSLATIONS[uiPreferences.language] ||
        TRANSLATIONS.en;

        useCustomBackgroundBtn.textContent =
        enabled
            ? t.photoInUse
            : t.usePhoto;
    }

    if (removeCustomBackgroundBtn) {
        removeCustomBackgroundBtn.disabled =
        !imageData;
    }
}

function clearCustomBackgroundVisual() {

    if (!backgroundLayer) {
        return;
    }

    backgroundLayer.classList.remove(
        "custom-user-background"
    );

    backgroundLayer.style.removeProperty(
        "--custom-background-image"
    );
}

function applyCustomBackgroundVisual() {

    const imageData =
    getStoredCustomBackground();

    if (
        !imageData ||
        !isCustomBackgroundEnabled() ||
        !backgroundLayer
    ) {
        clearCustomBackgroundVisual();
        refreshCustomBackgroundPreview();
        return false;
    }

    backgroundLayer.style.setProperty(
        "--custom-background-image",
        `url("${imageData}")`
    );

    backgroundLayer.classList.add(
        "custom-user-background"
    );

    document.documentElement.dataset.chatBackground =
    "custom";

    refreshCustomBackgroundPreview();

    return true;
}

function disableCustomBackground(
    keepStoredImage = true
) {

    try {
        localStorage.setItem(
            customBackgroundEnabledKey(),
            "false"
        );

        if (!keepStoredImage) {
            localStorage.removeItem(
                customBackgroundStorageKey()
            );
        }
    }
    catch {}

    clearCustomBackgroundVisual();
    refreshCustomBackgroundPreview();
}

function enableCustomBackground() {

    if (!getStoredCustomBackground()) {
        return;
    }

    try {
        localStorage.setItem(
            customBackgroundEnabledKey(),
            "true"
        );
    }
    catch {}

    applyCustomBackgroundVisual();

    setCustomBackgroundStatus(
        "Your photo is now the chat background.",
        "ok"
    );
}

function loadImageFromFile(file) {

    return new Promise(
        (resolve, reject) => {

            const objectUrl =
            URL.createObjectURL(file);

            const image =
            new Image();

            image.onload =
            () => {
                URL.revokeObjectURL(
                    objectUrl
                );

                resolve(image);
            };

            image.onerror =
            () => {
                URL.revokeObjectURL(
                    objectUrl
                );

                reject(
                    new Error(
                        "Could not read this image."
                    )
                );
            };

            image.src =
            objectUrl;
        }
    );
}

async function compressCustomBackground(file) {

    if (!file) {
        throw new Error(
            "Choose an image first."
        );
    }

    if (
        ![
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.type)
    ) {
        throw new Error(
            "Choose a JPG, PNG or WebP image."
        );
    }

    if (
        file.size >
        MAX_CUSTOM_BACKGROUND_FILE_BYTES
    ) {
        throw new Error(
            "Please choose an image under 6 MB."
        );
    }

    const image =
    await loadImageFromFile(file);

    const longest =
    Math.max(
        image.naturalWidth,
        image.naturalHeight
    );

    const scale =
    longest >
    CUSTOM_BACKGROUND_MAX_EDGE
        ? CUSTOM_BACKGROUND_MAX_EDGE /
          longest
        : 1;

    let width =
    Math.max(
        1,
        Math.round(
            image.naturalWidth *
            scale
        )
    );

    let height =
    Math.max(
        1,
        Math.round(
            image.naturalHeight *
            scale
        )
    );

    const canvas =
    document.createElement(
        "canvas"
    );

    canvas.width =
    width;

    canvas.height =
    height;

    const context =
    canvas.getContext(
        "2d",
        {
            alpha: false
        }
    );

    if (!context) {
        throw new Error(
            "This browser could not prepare the image."
        );
    }

    context.fillStyle =
    "#07101a";

    context.fillRect(
        0,
        0,
        width,
        height
    );

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    let dataUrl =
    canvas.toDataURL(
        "image/webp",
        .80
    );

    /*
    Keep the saved image small enough for normal browser
    localStorage. If still large, shrink once more.
    */
    if (
        dataUrl.length >
        1_800_000
    ) {

        const reducedScale =
        Math.min(
            1,
            1280 /
            Math.max(
                width,
                height
            )
        );

        width =
        Math.max(
            1,
            Math.round(
                width *
                reducedScale
            )
        );

        height =
        Math.max(
            1,
            Math.round(
                height *
                reducedScale
            )
        );

        const smaller =
        document.createElement(
            "canvas"
        );

        smaller.width =
        width;

        smaller.height =
        height;

        const smallerContext =
        smaller.getContext(
            "2d",
            {
                alpha: false
            }
        );

        smallerContext.fillStyle =
        "#07101a";

        smallerContext.fillRect(
            0,
            0,
            width,
            height
        );

        smallerContext.drawImage(
            canvas,
            0,
            0,
            width,
            height
        );

        dataUrl =
        smaller.toDataURL(
            "image/webp",
            .68
        );
    }

    if (
        dataUrl.length >
        2_200_000
    ) {
        throw new Error(
            "This image is still too large after compression. Try a smaller photo."
        );
    }

    return dataUrl;
}

async function saveCustomBackgroundFile(
    file
) {

    setCustomBackgroundStatus(
        "Preparing your photo…"
    );

    if (chooseCustomBackgroundBtn) {
        chooseCustomBackgroundBtn.disabled =
        true;
    }

    try {

        const dataUrl =
        await compressCustomBackground(
            file
        );

        localStorage.setItem(
            customBackgroundStorageKey(),
            dataUrl
        );

        localStorage.setItem(
            customBackgroundEnabledKey(),
            "true"
        );

        applyCustomBackgroundVisual();

        setCustomBackgroundStatus(
            "Saved on this device.",
            "ok"
        );
    }
    catch (error) {

        console.error(
            "CUSTOM BACKGROUND ERROR:",
            error
        );

        setCustomBackgroundStatus(
            error.message ||
            "Could not use this photo.",
            "error"
        );
    }
    finally {

        if (chooseCustomBackgroundBtn) {
            chooseCustomBackgroundBtn.disabled =
            false;
        }

        if (customBackgroundInput) {
            customBackgroundInput.value =
            "";
        }
    }
}

function removeCustomBackground() {

    try {
        localStorage.removeItem(
            customBackgroundStorageKey()
        );

        localStorage.removeItem(
            customBackgroundEnabledKey()
        );
    }
    catch {}

    clearCustomBackgroundVisual();

    /*
    Restore the selected preset immediately.
    */
    document.documentElement.dataset.chatBackground =
    prefBackground?.value ||
    uiPreferences.background ||
    "aurora";

    refreshCustomBackgroundPreview();

    setCustomBackgroundStatus(
        "Personal background removed."
    );
}

if (chooseCustomBackgroundBtn) {
    chooseCustomBackgroundBtn.addEventListener(
        "click",
        () => {
            customBackgroundInput?.click();
        }
    );
}

if (customBackgroundInput) {
    customBackgroundInput.addEventListener(
        "change",
        () => {
            const file =
            customBackgroundInput
                .files?.[0];

            if (file) {
                saveCustomBackgroundFile(
                    file
                );
            }
        }
    );
}

if (useCustomBackgroundBtn) {
    useCustomBackgroundBtn.addEventListener(
        "click",
        enableCustomBackground
    );
}

if (removeCustomBackgroundBtn) {
    removeCustomBackgroundBtn.addEventListener(
        "click",
        removeCustomBackground
    );
}

if (prefBackground) {
    prefBackground.addEventListener(
        "change",
        () => {
            /*
            Choosing a built-in preset turns the personal
            photo off, but keeps it saved so the user can
            press "Use photo" later without uploading again.
            */
            disableCustomBackground(
                true
            );

            setCustomBackgroundStatus(
                "Preset background selected. Your photo is still saved on this device."
            );
        }
    );
}


function applyPreferences(preferences) {

    uiPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(preferences || {})
    };

    const root =
    document.documentElement;

    root.dataset.theme =
    uiPreferences.theme;

    root.dataset.chatBackground =
    uiPreferences.background;

    root.dataset.density =
    uiPreferences.density;

    root.dataset.bubbleStyle =
    uiPreferences.bubbleStyle;

    root.dataset.fontSize =
    uiPreferences.fontSize;

    root.dataset.fontFamily =
    uiPreferences.fontFamily;

    root.dataset.reduceMotion =
    uiPreferences.reduceMotion
        ? "true"
        : "false";

    root.style.setProperty(
        "--user-text",
        uiPreferences.fontColor
    );

    root.style.setProperty(
        "--user-accent",
        uiPreferences.accent
    );

    root.style.setProperty(
        "--primary",
        uiPreferences.accent
    );

    applyTranslations(
        uiPreferences.language
    );

    syncPreferenceControls();

    /*
    A personal image is intentionally device-local.
    It overrides the account preset only on this browser.
    */
    if (!applyCustomBackgroundVisual()) {
        document.documentElement.dataset.chatBackground =
        uiPreferences.background;
    }
}

function syncPreferenceControls() {

    if (!prefLanguage) {
        return;
    }

    prefLanguage.value =
    uiPreferences.language;

    prefFontSize.value =
    uiPreferences.fontSize;

    prefFontFamily.value =
    uiPreferences.fontFamily;

    prefFontColor.value =
    uiPreferences.fontColor;

    prefAccent.value =
    uiPreferences.accent;

    prefBackground.value =
    uiPreferences.background;

    prefDensity.value =
    uiPreferences.density;

    prefBubbleStyle.value =
    uiPreferences.bubbleStyle;

    prefReduceMotion.checked =
    Boolean(
        uiPreferences.reduceMotion
    );

    if (prefFontColorValue) {
        prefFontColorValue.textContent =
        uiPreferences.fontColor;
    }

    if (prefAccentValue) {
        prefAccentValue.textContent =
        uiPreferences.accent;
    }

    document
        .querySelectorAll(
            "[data-theme]"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.theme ===
                uiPreferences.theme
            );
        });
}

function collectPreferences() {

    return {
        language:
            prefLanguage?.value ||
            "en",

        fontSize:
            prefFontSize?.value ||
            "normal",

        fontFamily:
            prefFontFamily?.value ||
            "inter",

        fontColor:
            prefFontColor?.value ||
            "#f8fafc",

        theme:
            document
                .querySelector(
                    ".theme-choice.active"
                )
                ?.dataset
                ?.theme ||
            uiPreferences.theme ||
            "cinematic",

        accent:
            prefAccent?.value ||
            "#7c9cff",

        background:
            prefBackground?.value ||
            "aurora",

        density:
            prefDensity?.value ||
            "comfortable",

        bubbleStyle:
            prefBubbleStyle?.value ||
            "soft",

        reduceMotion:
            Boolean(
                prefReduceMotion?.checked
            )
    };
}

async function loadUiPreferences() {

    try {

        const response =
        await fetch(
            "/api/auth/preferences",
            {
                credentials:
                    "same-origin"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Could not load preferences."
            );
        }

        const data =
        await response.json();

        applyPreferences(
            data.preferences
        );

    }
    catch (error) {

        console.warn(
            "PREFERENCES LOAD:",
            error
        );

        const cached =
        localStorage.getItem(
            "AmanUIPreferences"
        );

        if (cached) {
            try {
                applyPreferences(
                    JSON.parse(cached)
                );
                return;
            }
            catch {}
        }

        applyPreferences(
            DEFAULT_PREFERENCES
        );
    }
}

async function saveUiPreferences() {

    const next =
    collectPreferences();

    applyPreferences(next);

    localStorage.setItem(
        "AmanUIPreferences",
        JSON.stringify(next)
    );

    if (savePreferencesBtn) {
        savePreferencesBtn.disabled =
        true;

        savePreferencesBtn.textContent =
        (TRANSLATIONS[uiPreferences.language] || TRANSLATIONS.en).saving;
    }

    try {

        const response =
        await fetch(
            "/api/auth/preferences",
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials:
                    "same-origin",

                body:
                    JSON.stringify(next)
            }
        );

        const data =
        await response
            .json()
            .catch(() => ({}));

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Could not save preferences."
            );
        }

        applyPreferences(
            data.preferences
        );

        closePersonalization();

    }
    catch (error) {

        console.error(
            "SAVE PREFERENCES ERROR:",
            error
        );

        alert(
            "Your appearance changed on this device, but Aman AI could not sync it to your account yet."
        );
    }
    finally {

        if (savePreferencesBtn) {
            savePreferencesBtn.disabled =
            false;

            savePreferencesBtn.textContent =
            (TRANSLATIONS[uiPreferences.language] || TRANSLATIONS.en).save;
        }
    }
}

function openPersonalization() {

    if (!personalizationModal) {
        return;
    }

    syncPreferenceControls();
    refreshCustomBackgroundPreview();

    personalizationModal.classList.add(
        "open"
    );

    personalizationModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "personalization-open"
    );
}

function closePersonalization() {

    if (!personalizationModal) {
        return;
    }

    personalizationModal.classList.remove(
        "open"
    );

    personalizationModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "personalization-open"
    );
}

if (personalizeBtn) {
    personalizeBtn.onclick =
    openPersonalization;
}

if (personalizationClose) {
    personalizationClose.onclick =
    closePersonalization;
}

if (personalizationModal) {
    personalizationModal.addEventListener(
        "click",
        event => {
            if (
                event.target ===
                personalizationModal
            ) {
                closePersonalization();
            }
        }
    );
}

document
    .querySelectorAll(
        ".theme-choice"
    )
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".theme-choice"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                applyPreferences({
                    ...collectPreferences(),
                    theme:
                        button.dataset.theme
                });
            }
        );
    });

[
    prefLanguage,
    prefFontSize,
    prefFontFamily,
    prefFontColor,
    prefAccent,
    prefBackground,
    prefDensity,
    prefBubbleStyle,
    prefReduceMotion
]
.filter(Boolean)
.forEach(control => {
    control.addEventListener(
        "input",
        () => {

            if (prefFontColorValue) {
                prefFontColorValue.textContent =
                prefFontColor.value;
            }

            if (prefAccentValue) {
                prefAccentValue.textContent =
                prefAccent.value;
            }

            applyPreferences(
                collectPreferences()
            );
        }
    );
});

if (resetPreferencesBtn) {
    resetPreferencesBtn.onclick =
    () => {
        disableCustomBackground(
            true
        );

        applyPreferences({
            ...DEFAULT_PREFERENCES
        });

        setCustomBackgroundStatus(
            "Appearance reset. Your uploaded photo is still saved on this device."
        );
    };
}

if (savePreferencesBtn) {
    savePreferencesBtn.onclick =
    saveUiPreferences;
}

document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape" &&
            personalizationModal
                ?.classList
                .contains("open")
        ) {
            closePersonalization();
        }
    }
);


// ======================================================
// START APPLICATION
// ======================================================

async function startApplication() {

    const authenticated =
    await loadAuthenticatedAccount();

    if (!authenticated) {
        return;
    }

    await loadUiPreferences();

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
