const currentPage = window.location.pathname.split("/").pop();

const navHTML = `
<div class="nav-menu-wrap">
    <button class="nav-menu-btn" id="navMenuBtn">
        ☰ Menu
    </button>

    <div class="nav-dropdown" id="nav-dropdown">

        <div class="nav-section-label">Operations</div>

        <a href="/dashboard.html"
            class="${currentPage==="dashboard.html" ? "current":""}">
            📊 Dashboard
        </a>

        <a href="/waiter.html"
            class="${currentPage==="waiter.html" ? "current":""}">
            📱 Waiter Ordering
        </a>

        <a href="/kitchen-display.html"
            class="${currentPage==="kitchen-display.html" ? "current":""}">
            🔥 Kitchen Display
        </a>

        <a href="/cashier-billing.html"
            class="${currentPage==="cashier-billing.html" ? "current":""}">
            🧾 Cashier / Billing
        </a>

        <a href="/reservations.html"
            class="${currentPage==="reservations.html" ? "current":""}">
            📅 Reservations
        </a>

        <div class="nav-section-label">Management</div>

        <a href="/menu-management.html"
            class="${currentPage==="menu-management.html" ? "current":""}">
            🍽️ Menu Management
        </a>

        <a href="/user-management.html"
            class="${currentPage==="user-management.html" ? "current":""}">
            👥 User Management
        </a>

        <a href="/inventory.html"
            class="${currentPage==="inventory.html" ? "current":""}">
            📦 Inventory
        </a>

        <a href="/promo-management.html"
            class="${currentPage==="promo-management.html" ? "current":""}">
            🎟️ Promo Management
        </a>

        <div class="nav-section-label">Reports</div>

        <a href="/order-history.html"
            class="${currentPage==="order-history.html" ? "current":""}">
            📜 Order History
        </a>

        <a href="/reports.html"
            class="${currentPage==="reports.html" ? "current":""}">
            📈 Sales Reports
        </a>

    </div>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("nav-container");

    if (!container) return;

    container.innerHTML = navHTML;

});

document.addEventListener("click", (e)=>{

    const wrap = document.querySelector(".nav-menu-wrap");

    if(!wrap) return;

    const dropdown = document.getElementById("nav-dropdown");

    if (e.target.closest("#navMenuBtn")) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
        return;
    }

    if(!wrap.contains(e.target)){
        dropdown.classList.remove("open");
    }

});

const role = localStorage.getItem("pos_role");

const menu = [
  { title: "Dashboard", href: "/dashboard.html", roles: ["ADMIN", "MANAGER"] },
  { title: "POS", href: "/pos.html", roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { title: "Kitchen", href: "/kitchen.html", roles: ["ADMIN", "MANAGER", "WAITER"] },
  { title: "Tables", href: "/tables.html", roles: ["ADMIN", "MANAGER", "WAITER"] },
  { title: "Reservations", href: "/reservations.html", roles: ["ADMIN", "MANAGER", "WAITER"] },
  { title: "Inventory", href: "/inventory.html", roles: ["ADMIN", "MANAGER"] },
  { title: "Menu", href: "/menu-management.html", roles: ["ADMIN", "MANAGER"] },
  { title: "Reports", href: "/reports.html", roles: ["ADMIN", "MANAGER"] },
  { title: "Users", href: "/users.html", roles: ["ADMIN"] }
];

const allowedMenu = menu.filter(item => item.roles.includes(role));