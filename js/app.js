const projectsRoot = document.querySelector("#projects");
const categoriesRoot = document.querySelector("#categories");
const searchInput = document.querySelector("#search");
const status = document.querySelector("#status");

let projects = [];
let activeCategory = "Все";

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCategories() {
  categoriesRoot.replaceChildren();

  const names = [
    "Все",
    ...new Set(projects.map(p => p.category).filter(Boolean))
  ];

  for (const name of names) {
    const button = element("button", "category", name);
    button.type = "button";
    button.setAttribute("aria-pressed", String(name === activeCategory));

    button.addEventListener("click", () => {
      activeCategory = name;
      renderCategories();
      renderProjects();
    });

    categoriesRoot.append(button);
  }
}

function renderProjects() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");

  const filtered = projects.filter(project => {
    const searchable = [
      project.title,
      project.description,
      project.category,
      project.author
    ].join(" ").toLocaleLowerCase("ru");

    return (activeCategory === "Все" || project.category === activeCategory)
      && searchable.includes(query);
  });

  projectsRoot.replaceChildren();

  for (const project of filtered) {
    const card = element("article", "card");

    if (project.image) {
      const imageUrl = safeUrl(project.image);

      if (imageUrl) {
        const image = element("img", "project-image");
        image.src = imageUrl;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove(), { once: true });
        card.append(image);
      }
    }

    card.append(
      element("span", "tag", project.category || "Проект"),
      element("h2", "", project.title),
      element("p", "description", project.description),
      element("p", "author", `Автор: ${project.author || "не указан"}`)
    );

    const url = safeUrl(project.url);

    if (url) {
      const link = element("a", "project-link", "Открыть проект ↗");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }

    projectsRoot.append(card);
  }

  status.textContent = filtered.length
    ? `Проектов: ${filtered.length}`
    : "По вашему запросу ничего не найдено.";
}

async function init() {
  try {
    const response = await fetch("./data/projects.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Неверный формат каталога");
    }

    projects = data.filter(p =>
      p
      && typeof p.title === "string"
      && typeof p.description === "string"
      && typeof p.url === "string"
    );

    renderCategories();
    renderProjects();
  } catch (error) {
    status.textContent =
      "Не удалось загрузить каталог. Проверьте файлы и публикацию.";
    console.error("Catalog loading error:", error);
  }

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
  }
}

searchInput.addEventListener("input", renderProjects);
init();
