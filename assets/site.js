/* Zahnarztpraxis Brix – kleine Helfer ohne Abhängigkeiten. */

// Sprechzeiten (Wochentag 0 = Sonntag). Bei Änderungen auch die Tabellen im HTML anpassen.
const SPRECHZEITEN = {
  1: [["08:00", "12:00"], ["14:00", "18:00"]],
  2: [["08:00", "12:00"], ["14:00", "18:00"]],
  3: [["08:00", "12:00"], ["14:00", "18:00"]],
  4: [["08:00", "12:00"]],
  5: [["08:00", "12:00"]],
};
const TAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

// Uhrzeit in Deutschland, unabhängig von der Zeitzone des Geräts
function jetztInBerlin() {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const wert = (typ) => teile.find((t) => t.type === typ).value;
  const tag = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].indexOf(wert("weekday").replace(".", ""));
  return { tag, minuten: Number(wert("hour")) * 60 + Number(wert("minute")) };
}
const inMinuten = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

function naechsteOeffnung(tag, minuten) {
  for (let i = 0; i < 8; i++) {
    const t = (tag + i) % 7;
    for (const [von] of SPRECHZEITEN[t] || []) {
      if (i > 0 || inMinuten(von) > minuten) {
        const wann = i === 0 ? "heute" : i === 1 ? "morgen" : TAGE[t];
        return `${wann} um ${von} Uhr`;
      }
    }
  }
  return "";
}

function oeffnungsstatus() {
  const felder = document.querySelectorAll("[data-open-status]");
  const { tag, minuten } = jetztInBerlin();

  document.querySelectorAll("tr[data-days]").forEach((zeile) => {
    zeile.classList.toggle("is-today", zeile.dataset.days.split(" ").includes(String(tag)));
  });
  if (!felder.length || tag < 0) return;

  const offen = (SPRECHZEITEN[tag] || []).find(([von, bis]) => minuten >= inMinuten(von) && minuten < inMinuten(bis));
  const text = offen
    ? `Jetzt geöffnet <small>bis ${offen[1]} Uhr</small>`
    : `Gerade geschlossen <small>– wieder ${naechsteOeffnung(tag, minuten)}</small>`;
  felder.forEach((feld) => {
    feld.innerHTML = text;
    feld.classList.add("status", offen ? "is-open" : "is-closed");
  });
}

function menue() {
  const knopf = document.querySelector(".menu-toggle");
  const nav = document.getElementById("hauptmenue");
  if (!knopf || !nav) return;
  const setzen = (auf) => {
    knopf.setAttribute("aria-expanded", String(auf));
    knopf.querySelector(".menu-toggle__label").textContent = auf ? "Schließen" : "Menü";
    nav.classList.toggle("is-open", auf);
    document.body.classList.toggle("menu-open", auf);
  };
  knopf.addEventListener("click", () => setzen(knopf.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setzen(false); knopf.focus(); }
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setzen(false); });
  matchMedia("(min-width: 860px)").addEventListener("change", (e) => { if (e.matches) setzen(false); });
}

function galerie() {
  const knoepfe = document.querySelectorAll("[data-full]");
  if (!knoepfe.length || typeof HTMLDialogElement === "undefined") return;
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.innerHTML = '<button class="lightbox__close" type="button" aria-label="Bild schließen">×</button><img alt=""><p></p>';
  document.body.append(dialog);
  const bild = dialog.querySelector("img");
  const text = dialog.querySelector("p");
  knoepfe.forEach((k) => k.addEventListener("click", () => {
    const vorschau = k.querySelector("img");
    bild.src = k.dataset.full;
    bild.alt = vorschau.alt;
    text.textContent = k.closest("figure")?.querySelector("figcaption")?.textContent || "";
    dialog.showModal();
  }));
  dialog.addEventListener("click", (e) => { if (e.target !== bild) dialog.close(); });
}

document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
oeffnungsstatus();
setInterval(oeffnungsstatus, 60000);
menue();
galerie();
