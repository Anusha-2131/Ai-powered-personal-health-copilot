const notice = document.querySelector("#notice");
const activityList = document.querySelector("#activity-list");
const contactList = document.querySelector("#contact-list");
const smsContact = document.querySelector("#sms-contact");
let contactsCache = [];
let currentLocation = null;
let recognition = null;
let voiceTranscriptReceived = false;

function showNotice(message, type = "success") {
  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.hidden = false;
  window.setTimeout(() => { notice.hidden = true; }, 7000);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function updateClock() {
  const now = new Date();
  document.querySelector("#clock-date").textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(now);
  document.querySelector("#clock-time").textContent = new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(now);
}

function readLocation(enabled) {
  if (!enabled) return Promise.resolve({});
  if (!navigator.geolocation) return Promise.reject(new Error("Location is not available in this browser."));
  if (currentLocation) return Promise.resolve(currentLocation);
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        currentLocation = { latitude: coords.latitude, longitude: coords.longitude };
        renderLocation(currentLocation);
        resolve(currentLocation);
      },
      () => reject(new Error("Location permission was not granted. Nothing was shared.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}

function renderLocation(location) {
  const { latitude, longitude } = location;
  document.querySelector("#latitude-value").textContent = latitude.toFixed(5);
  document.querySelector("#longitude-value").textContent = longitude.toFixed(5);
  document.querySelector("#address-value").textContent = "Coordinates from your device";
  document.querySelector("#location-badge").textContent = "Available on this device";
  document.querySelector("#location-badge").className = "badge badge-green";
  const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  const mapLink = document.querySelector("#map-link");
  mapLink.href = mapUrl;
  mapLink.hidden = false;
  const map = document.querySelector(".map-frame");
  map.classList.add("has-location");
  document.querySelector(".map-help").textContent = "Location preview is ready";
  document.querySelector("#map-pin").style.display = "block";
  document.querySelector("#location-action").querySelector("small").textContent = "Location ready to share";
}

function renderContacts(contacts) {
  contactsCache = contacts;
  contactList.replaceChildren();
  document.querySelector("#contact-count").textContent = `${contacts.length} trusted ${contacts.length === 1 ? "contact" : "contacts"}`;
  const selected = smsContact.value;
  smsContact.replaceChildren(new Option("Choose a trusted contact", ""));
  for (const contact of contacts) {
    smsContact.add(new Option(`${contact.name} · ${contact.phone}`, String(contact.id)));
    const item = document.createElement("div");
    item.className = "contact-item";
    const avatar = document.createElement("span");
    avatar.className = "contact-avatar";
    avatar.textContent = contact.name.trim().charAt(0).toUpperCase();
    const details = document.createElement("div");
    details.className = "contact-details";
    const name = document.createElement("strong");
    name.textContent = contact.name;
    const phone = document.createElement("span");
    phone.textContent = contact.relationship ? `${contact.phone} · ${contact.relationship}` : contact.phone;
    const contactActions = document.createElement("div");
    contactActions.className = "contact-actions";
    const call = document.createElement("a");
    call.className = "contact-action";
    call.href = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;
    call.setAttribute("aria-label", `Call ${contact.name}`);
    call.textContent = "☎";
    const message = document.createElement("button");
    message.className = "contact-action";
    message.type = "button";
    message.setAttribute("aria-label", `Prepare a message for ${contact.name}`);
    message.textContent = "▤";
    message.addEventListener("click", () => {
      smsContact.value = String(contact.id);
      document.querySelector("#sms-alert").scrollIntoView({ behavior: "smooth" });
      document.querySelector("#sms-message").focus();
    });
    const remove = document.createElement("button");
    remove.className = "delete-contact";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${contact.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Remove ${contact.name} from trusted contacts?`)) return;
      try {
        await api(`/api/contacts/${contact.id}`, { method: "DELETE" });
        await loadContacts();
        showNotice("Trusted contact removed.");
      } catch (error) {
        showNotice(error.message, "error");
      }
    });
    contactActions.append(call, message, remove);
    details.append(name, phone);
    item.append(avatar, details, contactActions);
    contactList.append(item);
  }
  if (contacts.length === 0) {
    contactList.innerHTML = '<p class="empty-state">No contacts added yet. Use + to add one.</p>';
  }
  if (contacts.some((contact) => String(contact.id) === selected)) smsContact.value = selected;
}

function renderActivity(alerts) {
  document.querySelector("#activity-count").textContent = `${alerts.length} ${alerts.length === 1 ? "event" : "events"}`;
  activityList.replaceChildren();
  const hasSOS = alerts.some((alert) => alert.kind === "sos");
  document.querySelector("#system-status").textContent = hasSOS ? "CHECK LOG" : "READY";
  document.querySelector("#system-substatus").textContent = hasSOS ? "SOS event recorded" : "No active alert";
  if (alerts.length === 0) {
    activityList.innerHTML = '<p class="empty-state">No incidents recorded.</p>';
    return;
  }
  for (const alert of alerts) {
    const item = document.createElement("article");
    item.className = "activity-item";
    const marker = document.createElement("span");
    marker.className = `activity-marker${alert.kind === "sos" ? " emergency" : ""}`;
    marker.textContent = alert.kind === "sos" ? "!" : "✓";
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = alert.kind === "sos" ? "SOS alert recorded" : "Safety check-in";
    const meta = document.createElement("p");
    meta.textContent = `${formatDate(alert.created_at)} · ${alert.risk_level} (${alert.risk_score}/100)`;
    content.append(title, meta);
    if (alert.message) {
      const message = document.createElement("p");
      message.className = "incident-message";
      message.textContent = alert.message;
      content.append(message);
    }
    if (alert.map_url) {
      const map = document.createElement("a");
      map.href = alert.map_url;
      map.target = "_blank";
      map.rel = "noopener noreferrer";
      map.textContent = "View location";
      content.append(map);
    }
    item.append(marker, content);
    activityList.append(item);
  }
}

async function loadContacts() {
  const result = await api("/api/contacts");
  renderContacts(result.contacts);
}

async function loadDashboard() {
  const result = await api("/api/dashboard");
  renderActivity(result.alerts);
}

function openSOS(message = "") {
  document.querySelector("#sos-message").value = message;
  document.querySelector("#sos-dialog").showModal();
}

async function requestAndShowLocation() {
  try {
    await readLocation(true);
    showNotice("Your location is ready. It has not been shared with anyone.");
  } catch (error) {
    showNotice(error.message, "error");
  }
}

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

document.querySelector("#toggle-contact-form").addEventListener("click", () => {
  const form = document.querySelector("#contact-form");
  form.hidden = !form.hidden;
  if (!form.hidden) document.querySelector("#contact-name").focus();
});

document.querySelector("#contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await api("/api/contacts", { method: "POST", body: JSON.stringify(data) });
    event.currentTarget.reset();
    event.currentTarget.hidden = true;
    await loadContacts();
    showNotice("Trusted contact added.");
  } catch (error) {
    showNotice(error.message, "error");
  }
});

document.querySelector("#location-action").addEventListener("click", requestAndShowLocation);

document.querySelector("#checkin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const location = await readLocation(document.querySelector("#include-location").checked);
    const result = await api("/api/check-in", {
      method: "POST",
      body: JSON.stringify({
        concern: document.querySelector("#concern").value,
        message: document.querySelector("#checkin-message").value,
        ...location,
      }),
    });
    event.currentTarget.reset();
    await loadDashboard();
    showNotice(`Check-in saved. Demo risk estimate: ${result.alert.risk_level} (${result.alert.risk_score}/100).`);
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

const sosDialog = document.querySelector("#sos-dialog");
document.querySelector("#sos-button").addEventListener("click", () => openSOS());
document.querySelector("#quick-sos").addEventListener("click", () => openSOS());
document.querySelector("#cancel-sos").addEventListener("click", () => sosDialog.close());
document.querySelector("#sos-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const location = await readLocation(document.querySelector("#sos-location").checked);
    await api("/api/sos", {
      method: "POST",
      body: JSON.stringify({ message: document.querySelector("#sos-message").value, ...location }),
    });
    sosDialog.close();
    event.currentTarget.reset();
    await loadDashboard();
    showNotice("SOS alert recorded here only. No one was notified.");
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#sms-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const contact = contactsCache.find((item) => String(item.id) === smsContact.value);
  if (!contact) {
    showNotice("Choose a trusted contact first.", "error");
    return;
  }
  try {
    const location = await readLocation(document.querySelector("#sms-location").checked);
    let message = document.querySelector("#sms-message").value.trim();
    if (location.latitude !== undefined) {
      const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
      message = `${message}\nMy location: ${mapUrl}`;
    }
    window.location.href = `sms:${contact.phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(message)}`;
    showNotice("Your messaging app should open. Review and send the message there.");
  } catch (error) {
    showNotice(error.message, "error");
  }
});

document.querySelector("#emergency-number").addEventListener("input", (event) => {
  const number = event.currentTarget.value.trim();
  const callLink = document.querySelector("#call-link");
  if (number && /^[+\d][\d\s().-]{0,24}$/.test(number)) {
    callLink.href = `tel:${number.replace(/[^\d+]/g, "")}`;
    callLink.classList.remove("disabled-link");
    callLink.setAttribute("aria-disabled", "false");
  } else {
    callLink.href = "#";
    callLink.classList.add("disabled-link");
    callLink.setAttribute("aria-disabled", "true");
  }
});
document.querySelector("#call-action").addEventListener("click", () => {
  document.querySelector("#emergency-number").focus();
  document.querySelector("#emergency-call").scrollIntoView({ behavior: "smooth" });
  showNotice("Enter your local emergency number, then choose Call now.");
});
document.querySelector("#call-link").addEventListener("click", (event) => {
  if (event.currentTarget.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    showNotice("Enter your local emergency number first.", "error");
  } else if (!window.confirm("Open your device's calling app for this emergency number?")) {
    event.preventDefault();
  }
});

function setVoiceState(state, message) {
  document.querySelector("#voice-state").textContent = state;
  document.querySelector("#voice-state").className = `badge ${state === "LISTENING" ? "badge-green" : "badge-muted"}`;
  document.querySelector("#voice-wave").classList.toggle("listening", state === "LISTENING");
  if (message) document.querySelector("#voice-transcript").textContent = message;
}

document.querySelector("#voice-start").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceState("UNAVAILABLE", "Speech recognition is not supported by this browser. You can still use SOS or a phone call.");
    showNotice("Voice recognition is not available in this browser.", "error");
    return;
  }
  if (recognition) {
    recognition.stop();
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => {
    voiceTranscriptReceived = false;
    setVoiceState("LISTENING", "Listening once… speak a short phrase.");
    document.querySelector("#voice-start").querySelector("small").textContent = "Click to stop";
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    voiceTranscriptReceived = true;
    document.querySelector("#voice-transcript").textContent = `Heard: “${transcript}”`;
    const urgent = /\b(help|unsafe|emergency|hurt|danger|scared|followed)\b/i.test(transcript);
    document.querySelector("#risk-score").textContent = urgent ? "Elevated · demo" : "No keyword · demo";
    document.querySelector("#voice-alert-button").hidden = !urgent;
    if (urgent) document.querySelector("#sos-message").value = `Voice check phrase: ${transcript}`;
  };
  recognition.onerror = (event) => {
    setVoiceState("ERROR", `Voice recognition stopped: ${event.error}. You can use the other safety actions.`);
  };
  recognition.onend = () => {
    if (document.querySelector("#voice-state").textContent === "LISTENING") {
      const transcript = voiceTranscriptReceived
        ? document.querySelector("#voice-transcript").textContent
        : "Listening ended. No speech is stored by this app.";
      setVoiceState("OFF", transcript);
    }
    recognition = null;
    document.querySelector("#voice-start").querySelector("small").textContent = "Start listening by choice";
  };
  try {
    recognition.start();
  } catch (error) {
    recognition = null;
    setVoiceState("ERROR", "Could not start the microphone. Check browser permission and try again.");
    showNotice(error.message, "error");
  }
});

document.querySelector("#voice-alert-button").addEventListener("click", () => {
  openSOS(document.querySelector("#sos-message").value);
});

document.querySelector("#test-alert").addEventListener("click", async () => {
  try {
    await api("/api/check-in", {
      method: "POST",
      body: JSON.stringify({ concern: "low", message: "Demo test — no emergency. Alert flow check." }),
    });
    await loadDashboard();
    showNotice("Demo test saved as a low-risk check-in. No one was contacted.");
  } catch (error) {
    showNotice(error.message, "error");
  }
});

updateClock();
window.setInterval(updateClock, 1000);
Promise.all([loadContacts(), loadDashboard()]).catch((error) => showNotice(error.message, "error"));
