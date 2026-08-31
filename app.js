// ============================================================
// ONLINE BANKING - FRONTEND APPLICATION
// ============================================================

"use strict";


// ============================================================
// API CONFIGURATION
// ============================================================

// Empty string means the frontend and FastAPI are served
// from the same domain.
//
// Example:
// https://your-domain.com
//
// API calls become:
// https://your-domain.com/api/auth/login
const API_BASE = "";


// ============================================================
// APPLICATION STATE
// ============================================================

const state = {
    token: localStorage.getItem("banking_access_token") || "",
    user: null,
    transactions: [],
    currentSection: "overviewSection"
};


// ============================================================
// DOM HELPERS
// ============================================================

function $(id) {
    return document.getElementById(id);
}


function query(selector) {
    return document.querySelector(selector);
}


function queryAll(selector) {
    return document.querySelectorAll(selector);
}


// ============================================================
// AUTH STORAGE
// ============================================================

function saveToken(token) {
    state.token = token;

    localStorage.setItem(
        "banking_access_token",
        token
    );
}


function removeToken() {
    state.token = "";

    localStorage.removeItem(
        "banking_access_token"
    );
}


// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    if (state.token) {

        headers.Authorization =
            `Bearer ${state.token}`;

    }


    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers
        }
    );


    let data = null;


    try {

        data = await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        let message =
            data?.detail ||
            data?.message ||
            `Request failed (${response.status})`;


        if (Array.isArray(data?.detail)) {

            message = data.detail
                .map(item =>
                    item.msg || "Invalid input"
                )
                .join(", ");

        }


        const error =
            new Error(message);

        error.status =
            response.status;

        throw error;

    }


    return data;
}


// ============================================================
// LOADING UI
// ============================================================

function showLoading(
    text = "Please wait..."
) {

    const overlay =
        $("loadingOverlay");

    const loadingText =
        $("loadingText");


    if (loadingText) {

        loadingText.textContent =
            text;

    }


    if (overlay) {

        overlay.classList.remove(
            "hidden"
        );

    }

}


function hideLoading() {

    const overlay =
        $("loadingOverlay");


    if (overlay) {

        overlay.classList.add(
            "hidden"
        );

    }

}


// ============================================================
// MESSAGE UI
// ============================================================

function showMessage(
    elementId,
    message,
    type = "error"
) {

    const element =
        $(elementId);


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `message ${type}`;


    element.classList.remove(
        "hidden"
    );

}


function clearMessage(
    elementId
) {

    const element =
        $(elementId);


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "message";

}


// ============================================================
// AUTH PANELS
// ============================================================

function showAuthPanel(
    panelId
) {

    const panels = [
        "loginPanel",
        "registerPanel",
        "otpPanel"
    ];


    panels.forEach(id => {

        const panel = $(id);

        if (!panel) {
            return;
        }

        if (id === panelId) {

            panel.classList.remove(
                "hidden"
            );

        } else {

            panel.classList.add(
                "hidden"
            );

        }

    });

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

    showAuthPanel(
        "loginPanel"
    );


    clearMessage(
        "loginMessage"
    );

    clearMessage(
        "registerMessage"
    );

    clearMessage(
        "otpMessage"
    );

}


// ============================================================
// SHOW REGISTER
// ============================================================

function showRegister() {

    showAuthPanel(
        "registerPanel"
    );


    clearMessage(
        "loginMessage"
    );

    clearMessage(
        "registerMessage"
    );

    clearMessage(
        "otpMessage"
    );

}


// ============================================================
// SHOW OTP
// ============================================================

function showOTP(email) {

    showAuthPanel(
        "otpPanel"
    );


    const emailInput =
        $("otpEmail");


    if (emailInput) {

        emailInput.value =
            email;

    }


    const codeInput =
        $("otpCode");


    if (codeInput) {

        codeInput.value =
            "";

        codeInput.focus();

    }

}


// ============================================================
// AUTH SCREEN
// ============================================================

function showAuthScreen() {

    const auth =
        $("authScreen");

    const dashboard =
        $("dashboardScreen");


    if (auth) {

        auth.classList.remove(
            "hidden"
        );

    }


    if (dashboard) {

        dashboard.classList.add(
            "hidden"
        );

    }


    showLogin();

}


// ============================================================
// DASHBOARD SCREEN
// ============================================================

function showDashboardScreen() {

    const auth =
        $("authScreen");

    const dashboard =
        $("dashboardScreen");


    if (auth) {

        auth.classList.add(
            "hidden"
        );

    }


    if (dashboard) {

        dashboard.classList.remove(
            "hidden"
        );

    }

}


// ============================================================
// REGISTER
// ============================================================

async function handleRegister(
    event
) {

    event.preventDefault();


    clearMessage(
        "registerMessage"
    );


    const fullName =
        $("registerName")
            ?.value
            .trim();


    const email =
        $("registerEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        $("registerPassword")
            ?.value || "";


    const confirmPassword =
        $("registerPasswordConfirm")
            ?.value || "";


    if (!fullName) {

        showMessage(
            "registerMessage",
            "Please enter your full name."
        );

        return;
    }


    if (password.length < 8) {

        showMessage(
            "registerMessage",
            "Password must contain at least 8 characters."
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            "registerMessage",
            "Passwords do not match."
        );

        return;
    }


    try {

        showLoading(
            "Creating your account..."
        );


        const result =
            await apiRequest(
                "/api/auth/register",
                {
                    method: "POST",

                    body: JSON.stringify({
                        full_name: fullName,
                        email: email,
                        password: password
                    })
                }
            );


        hideLoading();


        showMessage(
            "registerMessage",
            result.message ||
                "Account created. Check your email for your verification code.",
            "success"
        );


        showOTP(email);


    } catch (error) {

        hideLoading();


        showMessage(
            "registerMessage",
            error.message ||
                "Registration failed."
        );

    }

}


// ============================================================
// VERIFY OTP
// ============================================================

async function handleOTP(
    event
) {

    event.preventDefault();


    clearMessage(
        "otpMessage"
    );


    const email =
        $("otpEmail")
            ?.value
            .trim()
            .toLowerCase();


    const code =
        $("otpCode")
            ?.value
            .trim();


    if (!/^\d{6}$/.test(code)) {

        showMessage(
            "otpMessage",
            "Enter the 6-digit verification code."
        );

        return;
    }


    try {

        showLoading(
            "Verifying your account..."
        );


        const result =
            await apiRequest(
                "/api/auth/verify",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email,
                        code
                    })
                }
            );


        hideLoading();


        showMessage(
            "otpMessage",
            result.message ||
                "Your account has been verified.",
            "success"
        );


        setTimeout(() => {

            showLogin();

            const loginEmail =
                $("loginEmail");

            if (loginEmail) {

                loginEmail.value =
                    email;

            }

        }, 900);


    } catch (error) {

        hideLoading();


        showMessage(
            "otpMessage",
            error.message ||
                "Verification failed."
        );

    }

}


// ============================================================
// LOGIN
// ============================================================

async function handleLogin(
    event
) {

    event.preventDefault();


    clearMessage(
        "loginMessage"
    );


    const email =
        $("loginEmail")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        $("loginPassword")
            ?.value || "";


    if (!email || !password) {

        showMessage(
            "loginMessage",
            "Enter your email and password."
        );

        return;
    }


    try {

        showLoading(
            "Signing you in..."
        );


        const result =
            await apiRequest(
                "/api/auth/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );


        if (!result.access_token) {

            throw new Error(
                "The server did not return an access token."
            );

        }


        saveToken(
            result.access_token
        );


        await loadDashboard();


    } catch (error) {

        removeToken();

        hideLoading();


        showMessage(
            "loginMessage",
            error.message ||
                "Unable to sign in."
        );

    }

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        const user =
            await apiRequest(
                "/api/me"
            );


        state.user =
            user;


        await loadTransactions();


        updateUserInterface();


        showDashboardScreen();


        showSection(
            "overviewSection"
        );


        hideLoading();


    } catch (error) {

        hideLoading();


        removeToken();

        state.user =
            null;


        showAuthScreen();


        if (error.status === 401) {

            showMessage(
                "loginMessage",
                "Your session has expired. Please sign in again."
            );

        } else {

            showMessage(
                "loginMessage",
                error.message ||
                    "Unable to load your account."
            );

        }

    }

}


// ============================================================
// UPDATE USER INTERFACE
// ============================================================

function updateUserInterface() {

    if (!state.user) {
        return;
    }


    const name =
        state.user.full_name ||
        "Customer";


    const email =
        state.user.email ||
        "";


    const account =
        state.user.account_number ||
        "—";


    const balance =
        parseFloat(
            state.user.balance || 0
        );


    const currency =
        state.user.currency ||
        "USD";


    // --------------------------------------------------------
    // Profile
    // --------------------------------------------------------

    setText(
        "profileName",
        name
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "welcomeName",
        getFirstName(name)
    );


    setText(
        "profileInitial",
        getInitials(name)
    );


    // --------------------------------------------------------
    // Account
    // --------------------------------------------------------

    setText(
        "accountNumber",
        account
    );


    setText(
        "accountCurrency",
        currency
    );


    setText(
        "balanceAmount",
        formatMoney(
            balance,
            currency
        )
    );


    setText(
        "transferBalance",
        formatMoney(
            balance,
            currency
        )
    );


    // --------------------------------------------------------
    // Settings
    // --------------------------------------------------------

    setText(
        "settingsName",
        name
    );


    setText(
        "settingsEmail",
        email
    );


    setText(
        "settingsAccount",
        account
    );


    const verification =
        $("settingsVerification");


    if (verification) {

        if (state.user.verified) {

            verification.textContent =
                "Verified";

            verification.className =
                "status-active";

        } else {

            verification.textContent =
                "Not verified";

            verification.className =
                "status-warning";

        }

    }

}


// ============================================================
// SAFE TEXT SETTER
// ============================================================

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value ?? "";

    }

}


// ============================================================
// FIRST NAME
// ============================================================

function getFirstName(
    name
) {

    return String(name)
        .trim()
        .split(/\s+/)[0] ||
        "Customer";

}


// ============================================================
// INITIALS
// ============================================================

function getInitials(
    name
) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {
        return "U";
    }


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(
    amount,
    currency = "USD"
) {

    const numericAmount =
        Number(amount);


    if (!Number.isFinite(
        numericAmount
    )) {

        return "$0.00";

    }


    try {

        return new Intl.NumberFormat(
            undefined,
            {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(
            numericAmount
        );

    } catch {

        return `$${numericAmount.toFixed(2)}`;

    }

}


// ============================================================
// LOAD TRANSACTIONS
// ============================================================

async function loadTransactions() {

    try {

        const result =
            await apiRequest(
                "/api/transactions"
            );


        state.transactions =
            Array.isArray(result)
                ? result
                : [];


        renderTransactions();


    } catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );


        state.transactions =
            [];


        renderTransactions();

    }

}


// ============================================================
// RENDER TRANSACTIONS
// ============================================================

function renderTransactions() {

    const recentContainer =
        $("recentTransactions");


    const allContainer =
        $("allTransactions");


    if (recentContainer) {

        renderTransactionList(
            recentContainer,
            state.transactions.slice(0, 5)
        );

    }


    if (allContainer) {

        renderTransactionList(
            allContainer,
            state.transactions
        );

    }

}


// ============================================================
// TRANSACTION LIST
// ============================================================

function renderTransactionList(
    container,
    transactions
) {

    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">↕</div>
                <strong>No transactions yet</strong>
                <span>Your account activity will appear here.</span>
            </div>
        `;

        return;

    }


    container.innerHTML =
        transactions
            .map(
                transaction =>
                    createTransactionHTML(
                        transaction
                    )
            )
            .join("");

}


// ============================================================
// TRANSACTION HTML
// ============================================================

function createTransactionHTML(
    transaction
) {

    const type =
        String(
            transaction.type || ""
        ).toLowerCase();


    const isCredit =
        type === "credit" ||
        type === "deposit";


    const amount =
        Number(
            transaction.amount || 0
        );


    const currency =
        state.user?.currency ||
        "USD";


    const sign =
        isCredit
            ? "+"
            : "-";


    const icon =
        isCredit
            ? "↓"
            : "↑";


    const amountClass =
        isCredit
            ? "credit"
            : "debit";


    const description =
        escapeHTML(
            transaction.description ||
            "Transaction"
        );


    const status =
        escapeHTML(
            transaction.status ||
            "completed"
        );


    const date =
        formatDate(
            transaction.created_at
        );


    return `
        <div class="transaction-item">

            <div class="transaction-icon ${amountClass}">
                ${icon}
            </div>

            <div class="transaction-details">

                <strong>
                    ${description}
                </strong>

                <span>
                    ${date}
                </span>

            </div>

            <div class="transaction-right">

                <strong class="${amountClass}">
                    ${sign}${formatMoney(
                        Math.abs(amount),
                        currency
                    )}
                </strong>

                <span class="transaction-status">
                    ${status}
                </span>

            </div>

        </div>
    `;

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "Unknown date";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(
        date.getTime()
    )) {

        return "Unknown date";

    }


    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ============================================================
// TRANSFER
// ============================================================

async function handleTransfer(
    event
) {

    event.preventDefault();


    clearMessage(
        "transferMessage"
    );


    const recipient =
        $("recipientAccount")
            ?.value
            .trim();


    const amountValue =
        $("transferAmount")
            ?.value;


    const description =
        $("transferDescription")
            ?.value
            .trim() ||
        "Transfer";


    const amount =
        Number(amountValue);


    if (!recipient) {

        showMessage(
            "transferMessage",
            "Enter the recipient account number."
        );

        return;
    }


    if (!Number.isFinite(amount) ||
        amount <= 0) {

        showMessage(
            "transferMessage",
            "Enter a valid transfer amount."
        );

        return;
    }


    if (amount > 999999999999999) {

        showMessage(
            "transferMessage",
            "Transfer amount is too large."
        );

        return;
    }


    try {

        showLoading(
            "Processing transfer..."
        );


        const result =
            await apiRequest(
                "/api/transfers",
                {
                    method: "POST",

                    body: JSON.stringify({
                        recipient_account:
                            recipient,

                        amount:
                            amount.toFixed(2),

                        description:
                            description
                    })
                }
            );


        await refreshAccount();


        hideLoading();


        showMessage(
            "transferMessage",
            result.message ||
                "Transfer completed successfully.",
            "success"
        );


        const form =
            $("transferForm");


        if (form) {

            form.reset();

        }


        showSection(
            "overviewSection"
        );


    } catch (error) {

        hideLoading();


        showMessage(
            "transferMessage",
            error.message ||
                "Transfer failed."
        );

    }

}


// ============================================================
// REFRESH ACCOUNT
// ============================================================

async function refreshAccount() {

    const user =
        await apiRequest(
            "/api/me"
        );


    state.user =
        user;


    await loadTransactions();


    updateUserInterface();

}


// ============================================================
// SHOW DASHBOARD SECTION
// ============================================================

function showSection(
    sectionId
) {

    const sections =
        queryAll(
            ".content-section"
        );


    sections.forEach(section => {

        if (section.id === sectionId) {

            section.classList.remove(
                "hidden"
            );

        } else {

            section.classList.add(
                "hidden"
            );

        }

    });


    state.currentSection =
        sectionId;


    // --------------------------------------------------------
    // Navigation
    // --------------------------------------------------------

    queryAll(
        ".nav-item"
    ).forEach(button => {

        const target =
            button.dataset.section;


        if (target === sectionId) {

            button.classList.add(
                "active"
            );

        } else {

            button.classList.remove(
                "active"
            );

        }

    });


    // --------------------------------------------------------
    // Page title
    // --------------------------------------------------------

    const titles = {

        overviewSection:
            "Overview",

        transactionsSection:
            "Transactions",

        transferSection:
            "Transfer",

        settingsSection:
            "Settings"

    };


    setText(
        "pageTitle",
        titles[sectionId] ||
            "Overview"
    );


    // --------------------------------------------------------
    // Close mobile sidebar
    // --------------------------------------------------------

    closeMobileSidebar();

}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

function openMobileSidebar() {

    const sidebar =
        $("sidebar");


    if (sidebar) {

        sidebar.classList.add(
            "mobile-open"
        );

    }

}


function closeMobileSidebar() {

    const sidebar =
        $("sidebar");


    if (sidebar) {

        sidebar.classList.remove(
            "mobile-open"
        );

    }

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    removeToken();

    state.user =
        null;

    state.transactions =
        [];


    const loginForm =
        $("loginForm");


    if (loginForm) {

        loginForm.reset();

    }


    const transferForm =
        $("transferForm");


    if (transferForm) {

        transferForm.reset();

    }


    showAuthScreen();

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    // --------------------------------------------------------
    // Login
    // --------------------------------------------------------

    const loginForm =
        $("loginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    // --------------------------------------------------------
    // Register
    // --------------------------------------------------------

    const registerForm =
        $("registerForm");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }


    // --------------------------------------------------------
    // OTP
    // --------------------------------------------------------

    const otpForm =
        $("otpForm");


    if (otpForm) {

        otpForm.addEventListener(
            "submit",
            handleOTP
        );

    }


    // --------------------------------------------------------
    // Transfer
    // --------------------------------------------------------

    const transferForm =
        $("transferForm");


    if (transferForm) {

        transferForm.addEventListener(
            "submit",
            handleTransfer
        );

    }


    // --------------------------------------------------------
    // Login/Register switches
    // --------------------------------------------------------

    const showRegisterButton =
        $("showRegisterButton");


    if (showRegisterButton) {

        showRegisterButton.addEventListener(
            "click",
            showRegister
        );

    }


    const showLoginButton =
        $("showLoginButton");


    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            showLogin
        );

    }


    const backToLoginButton =
        $("backToLoginButton");


    if (backToLoginButton) {

        backToLoginButton.addEventListener(
            "click",
            showLogin
        );

    }


    // --------------------------------------------------------
    // Sidebar navigation
    // --------------------------------------------------------

    queryAll(
        ".nav-item"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;


                if (section) {

                    showSection(
                        section
                    );

                }

            }
        );

    });


    // --------------------------------------------------------
    // Quick action buttons
    // --------------------------------------------------------

    queryAll(
        "[data-open-section]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.openSection;


                if (section) {

                    showSection(
                        section
                    );

                }

            }
        );

    });


    // --------------------------------------------------------
    // Logout
    // --------------------------------------------------------

    const logoutButton =
        $("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    // --------------------------------------------------------
    // Mobile menu
    // --------------------------------------------------------

    const mobileMenuButton =
        $("mobileMenuButton");


    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            openMobileSidebar
        );

    }


    // --------------------------------------------------------
    // Close sidebar when clicking outside
    // --------------------------------------------------------

    document.addEventListener(
        "click",
        event => {

            const sidebar =
                $("sidebar");


            const menuButton =
                $("mobileMenuButton");


            if (!sidebar ||
                !sidebar.classList.contains(
                    "mobile-open"
                )) {

                return;

            }


            if (
                !sidebar.contains(
                    event.target
                ) &&
                !menuButton?.contains(
                    event.target
                )
            ) {

                closeMobileSidebar();

            }

        }
    );


    // --------------------------------------------------------
    // OTP input
    // --------------------------------------------------------

    const otpCode =
        $("otpCode");


    if (otpCode) {

        otpCode.addEventListener(
            "input",
            () => {

                otpCode.value =
                    otpCode.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

            }
        );

    }

}


// ============================================================
// APPLICATION STARTUP
// ============================================================

async function initializeApp() {

    setupEventListeners();


    // --------------------------------------------------------
    // Existing session?
    // --------------------------------------------------------

    if (state.token) {

        try {

            showLoading(
                "Loading your account..."
            );


            await loadDashboard();


        } catch {

            hideLoading();

            removeToken();

            showAuthScreen();

        }


    } else {

        showAuthScreen();

    }

}


// ============================================================
// START
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();

}
