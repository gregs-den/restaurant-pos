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
    ${group.links.map(link => {
      const isInventory = link.href === "/inventory.html";
      const badge = isInventory ? `<span class="nav-link-badge" id="nav-link-badge-inventory" style="display:none"></span>` : "";
      return `
      <a href="${link.href}" class="${currentPage === link.href.replace('/', '') ? 'current' : ''}">${link.label}${badge}</a>
    `;
    }).join("")}
  `).join("") || `<div class="nav-section-label">No screens available</div>`;

  return `
    <div class="nav-menu-wrap">
      <button class="nav-menu-btn" id="navMenuBtn">☰ Menu<span class="nav-btn-badge" id="nav-btn-badge" style="display:none"></span></button>
      <div class="nav-dropdown" id="nav-dropdown">
        ${bodyHtml}
      </div>
    </div>
  `;
}

async function checkLowStockBadge() {
  const token = localStorage.getItem("pos_token");
  const role = localStorage.getItem("pos_role");
  if (!token) return;
  // Only roles that can see Inventory need to check (avoid unnecessary calls for Waiter, etc.)
  if (!["ADMIN", "MANAGER"].includes(role)) return;

  try {
    const res = await fetch(`${window.location.origin}/stock/low-stock`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const lowStock = await res.json();
    const count = lowStock.length;

    const btnBadge = document.getElementById("nav-btn-badge");
    const linkBadge = document.getElementById("nav-link-badge-inventory");

    if (count > 0) {
      if (btnBadge) { btnBadge.textContent = count; btnBadge.style.display = "inline-flex"; }
      if (linkBadge) { linkBadge.textContent = count; linkBadge.style.display = "inline-flex"; }
    } else {
      if (btnBadge) btnBadge.style.display = "none";
      if (linkBadge) linkBadge.style.display = "none";
    }
  } catch (err) {
    // fail silently — badge just won't show
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("nav-container");
  if (!container) return;
  container.innerHTML = buildNavHTML();
  checkLowStockBadge();
  setInterval(checkLowStockBadge, 60000); // refresh every 60s
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