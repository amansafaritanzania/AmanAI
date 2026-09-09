
(() => {
    "use strict";

    const API_BASE = "/api/auth";
    const DEFAULT_LOGOUT_MINUTES = 15;

    let lockOnHidden = true;
    let autoLogoutMinutes = DEFAULT_LOGOUT_MINUTES;
    let inactivityTimer = null;
    let locked = false;
    let initialized = false;

    const activityEvents = [
        "pointerdown",
        "keydown",
        "touchstart",
        "scroll"
    ];

    function createLockScreen() {
        if (document.getElementById("amanPrivacyLock")) {
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "amanPrivacyLock";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.innerHTML = `
            <div class="aman-privacy-card">
                <div class="aman-privacy-mark">A</div>
                <h2>Aman AI is locked</h2>
                <p>Your conversation is hidden for privacy.</p>

                <form id="amanPrivacyUnlockForm">
                    <input
                        id="amanPrivacyPassword"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Enter password"
                        aria-label="Password"
                        required
                    >

                    <button
                        id="amanPrivacyUnlockBtn"
                        type="submit"
                    >
                        Unlock
                    </button>
                </form>

                <div
                    id="amanPrivacyMessage"
                    class="aman-privacy-message"
                    aria-live="polite"
                ></div>

                <button
                    id="amanPrivacyLogoutBtn"
                    class="aman-privacy-link"
                    type="button"
                >
                    Logout instead
                </button>
            </div>
        `;

        const style = document.createElement("style");
        style.id = "amanPrivacyStyle";
        style.textContent = `
            #amanPrivacyLock{
                position:fixed;
                inset:0;
                z-index:2147483647;
                display:none;
                place-items:center;
                padding:18px;
                background:
                    radial-gradient(
                        circle at 50% 0%,
                        rgba(45,95,73,.22),
                        transparent 38%
                    ),
                    rgba(5,12,10,.97);
                backdrop-filter:blur(18px);
                font-family:
                    Inter,
                    system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    sans-serif;
                color:#f5f7f5;
            }

            #amanPrivacyLock.active{
                display:grid;
            }

            .aman-privacy-card{
                width:min(410px,100%);
                padding:28px;
                border-radius:24px;
                border:1px solid rgba(255,255,255,.09);
                background:#0e1d18;
                box-shadow:
                    0 35px 100px
                    rgba(0,0,0,.42);
                text-align:center;
            }

            .aman-privacy-mark{
                width:48px;
                height:48px;
                margin:0 auto 16px;
                border-radius:15px;
                display:grid;
                place-items:center;
                background:
                    linear-gradient(
                        135deg,
                        #f1d79b,
                        #d4ad62
                    );
                color:#152017;
                font-size:20px;
                font-weight:900;
            }

            .aman-privacy-card h2{
                margin:0 0 7px;
                font-size:24px;
            }

            .aman-privacy-card p{
                margin:0 0 18px;
                color:#a7b4ad;
                font-size:13px;
                line-height:1.55;
            }

            #amanPrivacyPassword{
                width:100%;
                min-height:48px;
                padding:12px 13px;
                border-radius:13px;
                border:1px solid
                    rgba(255,255,255,.1);
                background:#091511;
                color:#fff;
                outline:none;
                font-size:16px;
            }

            #amanPrivacyPassword:focus{
                border-color:#d4ad62;
                box-shadow:
                    0 0 0 3px
                    rgba(212,173,98,.12);
            }

            #amanPrivacyUnlockBtn{
                width:100%;
                min-height:48px;
                margin-top:10px;
                border:0;
                border-radius:13px;
                background:
                    linear-gradient(
                        135deg,
                        #f1d79b,
                        #d4ad62
                    );
                color:#152017;
                font-weight:850;
                cursor:pointer;
            }

            #amanPrivacyUnlockBtn:disabled{
                opacity:.55;
                cursor:not-allowed;
            }

            .aman-privacy-message{
                min-height:18px;
                margin-top:10px;
                color:#ffb9b9;
                font-size:12px;
            }

            .aman-privacy-link{
                margin-top:5px;
                border:0;
                background:transparent;
                color:#c3cdc8;
                font-size:12px;
                text-decoration:underline;
                cursor:pointer;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(overlay);

        const form =
            document.getElementById(
                "amanPrivacyUnlockForm"
            );

        const logoutBtn =
            document.getElementById(
                "amanPrivacyLogoutBtn"
            );

        form.addEventListener(
            "submit",
            unlock
        );

        logoutBtn.addEventListener(
            "click",
            logout
        );
    }


    function showLock() {
        if (locked) return;

        createLockScreen();

        locked = true;

        const overlay =
            document.getElementById(
                "amanPrivacyLock"
            );

        overlay.classList.add(
            "active"
        );

        document.documentElement.style.overflow =
            "hidden";

        setTimeout(() => {
            document
                .getElementById(
                    "amanPrivacyPassword"
                )
                ?.focus();
        }, 80);
    }


    function hideLock() {
        locked = false;

        document
            .getElementById(
                "amanPrivacyLock"
            )
            ?.classList
            .remove("active");

        document.documentElement.style.overflow =
            "";

        const password =
            document.getElementById(
                "amanPrivacyPassword"
            );

        const message =
            document.getElementById(
                "amanPrivacyMessage"
            );

        if (password) {
            password.value = "";
        }

        if (message) {
            message.textContent = "";
        }

        resetInactivityTimer();
    }


    async function unlock(event) {
        event.preventDefault();

        const passwordInput =
            document.getElementById(
                "amanPrivacyPassword"
            );

        const button =
            document.getElementById(
                "amanPrivacyUnlockBtn"
            );

        const message =
            document.getElementById(
                "amanPrivacyMessage"
            );

        if (
            !passwordInput ||
            !button
        ) {
            return;
        }

        const password =
            passwordInput.value;

        if (!password) {
            message.textContent =
                "Enter your password.";
            return;
        }

        button.disabled = true;
        message.textContent = "";

        try {
            const response =
                await fetch(
                    `${API_BASE}/unlock`,
                    {
                        method: "POST",
                        credentials:
                            "same-origin",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify({
                                password
                            })
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
                if (
                    response.status === 401 &&
                    data.message ===
                        "Authentication required."
                ) {
                    location.replace(
                        "/login"
                    );
                    return;
                }

                throw new Error(
                    data.message ||
                    "Could not unlock."
                );
            }

            hideLock();

        } catch (error) {
            message.textContent =
                error.message ||
                "Could not unlock.";
        } finally {
            button.disabled = false;
        }
    }


    async function logout() {
        try {
            await fetch(
                `${API_BASE}/logout`,
                {
                    method: "POST",
                    credentials:
                        "same-origin"
                }
            );
        } catch {}

        localStorage.removeItem(
            "amanUserId"
        );

        location.replace(
            "/login"
        );
    }


    function resetInactivityTimer() {
        clearTimeout(
            inactivityTimer
        );

        if (
            locked ||
            !autoLogoutMinutes ||
            autoLogoutMinutes <= 0
        ) {
            return;
        }

        inactivityTimer =
            setTimeout(
                logout,
                autoLogoutMinutes *
                60 *
                1000
            );
    }


    function activity() {
        if (!locked) {
            resetInactivityTimer();
        }
    }


    async function loadPreferences() {
        try {
            const response =
                await fetch(
                    `${API_BASE}/privacy`,
                    {
                        credentials:
                            "same-origin"
                    }
                );

            if (
                response.status === 401
            ) {
                return false;
            }

            const data =
                await response.json();

            if (
                response.ok &&
                data.success
            ) {
                lockOnHidden =
                    data.preferences
                        ?.lockOnHidden
                    !== false;

                autoLogoutMinutes =
                    Number(
                        data.preferences
                            ?.autoLogoutMinutes
                        ?? DEFAULT_LOGOUT_MINUTES
                    );
            }

            return true;

        } catch {
            return true;
        }
    }


    function handleVisibility() {
        if (
            document.visibilityState ===
                "hidden" &&
            lockOnHidden
        ) {
            showLock();
        }
    }


    async function init() {
        if (initialized) return;
        initialized = true;

        const authenticated =
            await loadPreferences();

        if (!authenticated) {
            return;
        }

        createLockScreen();

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        window.addEventListener(
            "pagehide",
            () => {
                if (lockOnHidden) {
                    showLock();
                }
            }
        );

        activityEvents.forEach(
            eventName => {
                window.addEventListener(
                    eventName,
                    activity,
                    {
                        passive: true
                    }
                );
            }
        );

        resetInactivityTimer();
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }
})();
