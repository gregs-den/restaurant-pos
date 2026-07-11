const currentPage = window.location.pathname.split("/").pop() || "index.html";

// Each link's allowed roles. Add/remove roles here to control visibility.
const NAV_LINKS = [
  { section: "Operations", href: "/dashboard.html", label: "📊 Dashboard", roles: ["ADMIN", "MANAGER"] },
  { section: "Operations", href: "/waiter.html", label: "📱 Waiter Ordering", roles: ["ADMIN", "MANAGER", "WAITER"] },
  { section: "Operations", href: "/kitchen-display.html", label: "🔥 Kitchen Display", roles: ["ADMIN", "MANAGER", "CASHIER", "WAITER"] },
  { section: "Operations", href: "/cashier-billing.html", label: "🧾 Cashier / Billing", roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { section: "Operations", href: "/reservations.html", label: "📅 Reservations", roles: ["ADMIN", "MANAGER", "CASHIER", "WAITER"] },
  { section: "Operations", href: "/table-management.html", label: "🪑 Table Management", roles: ["ADMIN", "MANAGER", "WAITER"] },
  { section: "Operations", href: "/shift-management.html", label: "💵 Shift / Cash Drawer", roles: ["ADMIN", "MANAGER", "CASHIER"] },

  { section: "Management", href: "/menu-management.html", label: "🍽️ Menu Management", roles: ["ADMIN", "MANAGER"] },
  { section: "Management", href: "/user-management.html", label: "👥 User Management", roles: ["ADMIN"] },
  { section: "Management", href: "/inventory.html", label: "📦 Inventory", roles: ["ADMIN", "MANAGER"] },
  { section: "Management", href: "/promo-management.html", label: "🎟️ Promo Management", roles: ["ADMIN", "MANAGER"] },
  { section: "Management", href: "/backup.html", label: "💾 Backup & Export", roles: ["ADMIN"] },

  { section: "Reports", href: "/order-history.html", label: "📜 Order History", roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { section: "Reports", href: "/reports.html", label: "📈 Sales Reports", roles: ["ADMIN", "MANAGER"] },
  { section: "Reports", href: "/void-logs.html", label: "🚫 Void Logs", roles: ["ADMIN", "MANAGER"] },
];

function buildNavHTML() {
  const role = localStorage.getItem("pos_role") || "WAITER";
  const visible = NAV_LINKS.filter(link => link.roles.includes(role));

  // Group by section, preserving first-seen order
  const sections = [];
  visible.forEach(link => {
    let group = sections.find(s => s.name === link.section);
    if (!group) {
      group = { name: link.section, links: [] };
      sections.push(group);
    }
    group.links.push(link);
  });

  const bodyHtml = sections.map(group => `
    <div class="nav-section-label">${group.name}</div>
    ${group.links.map(link => `
      <a href="${link.href}" class="${currentPage === link.href.replace('/', '') ? 'current' : ''}">${link.label}</a>
    `).join("")}
  `).join("") || `<div class="nav-section-label">No screens available</div>`;

  return `
    <div class="nav-menu-wrap">
      <button class="nav-menu-btn" id="navMenuBtn">☰ Menu</button>
      <div class="nav-dropdown" id="nav-dropdown">
        ${bodyHtml}
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("nav-container");
  if (!container) return;
  container.innerHTML = buildNavHTML();
});

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".nav-menu-wrap");
  if (!wrap) return;

  const dropdown = document.getElementById("nav-dropdown");

  if (e.target.closest("#navMenuBtn")) {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    return;
  }

  if (!wrap.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});